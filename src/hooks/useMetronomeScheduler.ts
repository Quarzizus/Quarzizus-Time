import { useRef, useEffect } from "react";
import { audioClock } from "../lib/audioClock";
import { metrics } from "../lib/metrics";

export interface MetronomeConfig {
  bpm: number;
  measure: number;
  subdivision: number;
  measuresOn: number;
  measuresOff: number;
  gapEnabled: boolean;
}

export interface TickData {
  beat: number;
  soundType: "accent" | "sub";
  timestamp: number;
  targetTime: number;
  measureCount: number;
  measuresOn: number;
  measuresOff: number;
  gapEnabled: boolean;
}

type TickCallback = (data: TickData) => void;

interface SchedulerState {
  running: boolean;
  bpm: number;
  interval: number;
  beat: number;
  measure: number;
  subdivision: number;
  startTime: number;
  tickCount: number;
  totalTicks: number;
  measureCount: number;
  measuresOn: number;
  measuresOff: number;
  gapEnabled: boolean;
}

const DRIFT_THRESHOLD = 0.2;
const IMMEDIATE_EXECUTION_THRESHOLD = 0.001;

const calculateInterval = (bpm: number, subdivision: number) => {
  return 60000 / bpm / subdivision;
};

const calculateTotalTicks = (measure: number, subdivision: number) => {
  return measure * subdivision;
};

const determineSoundType = (
  beat: number,
  subdivision: number
): "accent" | "sub" => {
  const isFirstBeat = beat === 0;
  const isAccentBeat = beat % subdivision === 0;
  return isFirstBeat || isAccentBeat ? "accent" : "sub";
};

const createInitialState = (): SchedulerState => ({
  running: false,
  bpm: 90,
  interval: 0,
  beat: 0,
  measure: 4,
  subdivision: 1,
  startTime: 0,
  tickCount: 0,
  totalTicks: 4,
  measureCount: 1,
  measuresOn: 1,
  measuresOff: 1,
  gapEnabled: false,
});

const useMetronomeScheduler = () => {
  const stateRef = useRef<SchedulerState>(createInitialState());
  const tickCallbackRef = useRef<TickCallback | null>(null);
  const cancelScheduleRef = useRef<(() => void) | null>(null);
  const scheduleNextTickRef = useRef<() => void>(() => {});

  const processTick = (audioTime: number) => {
    const state = stateRef.current;
    if (!state.running) return;

    const targetPerfTime = audioClock.getPerfTime(audioTime);
    const actualPerfTime = performance.now();
    const error = actualPerfTime - targetPerfTime;

    metrics.recordTickError(
      error,
      targetPerfTime,
      actualPerfTime,
      state.interval
    );

    const currentBeat = state.beat;
    const currentMeasureCount = state.measureCount;

    state.beat++;
    state.tickCount++;

    if (state.beat >= state.totalTicks) {
      state.beat = 0;
      state.measureCount++;
    }

    const tickData: TickData = {
      beat: currentBeat,
      soundType: determineSoundType(currentBeat, state.subdivision),
      timestamp: actualPerfTime,
      targetTime: targetPerfTime,
      measureCount: currentMeasureCount,
      measuresOn: state.measuresOn,
      measuresOff: state.measuresOff,
      gapEnabled: state.gapEnabled,
    };

    if (tickCallbackRef.current) {
      tickCallbackRef.current(tickData);
    }

    if (Math.abs(error) > state.interval * DRIFT_THRESHOLD) {
      const nowAudio = audioClock.getCurrentAudioTime();
      state.startTime = nowAudio - (state.tickCount * state.interval) / 1000;
    }

    if (state.running) {
      scheduleNextTickRef.current();
    }
  };

  const scheduleNextTick = () => {
    const state = stateRef.current;
    if (!state.running) return;

    if (cancelScheduleRef.current) {
      cancelScheduleRef.current();
      cancelScheduleRef.current = null;
    }

    const targetAudioTime =
      state.startTime + (state.tickCount * state.interval) / 1000;
    const nowAudio = audioClock.getCurrentAudioTime();
    const delay = targetAudioTime - nowAudio;

    if (delay < -state.interval / 1000) {
      const ticksToSkip = Math.floor((-delay * 1000) / state.interval);
      state.tickCount += ticksToSkip;

      const newTargetAudioTime =
        state.startTime + (state.tickCount * state.interval) / 1000;
      const newDelay = newTargetAudioTime - nowAudio;

      if (newDelay <= IMMEDIATE_EXECUTION_THRESHOLD) {
        processTick(newTargetAudioTime);
      } else {
        cancelScheduleRef.current = audioClock.scheduleAtAudioTime(
          (audioTime) => {
            cancelScheduleRef.current = null;
            processTick(audioTime);
          },
          newTargetAudioTime
        );
      }
    } else if (delay <= IMMEDIATE_EXECUTION_THRESHOLD) {
      processTick(targetAudioTime);
    } else {
      cancelScheduleRef.current = audioClock.scheduleAtAudioTime(
        (audioTime) => {
          cancelScheduleRef.current = null;
          processTick(audioTime);
        },
        targetAudioTime
      );
    }
  };

  useEffect(() => {
    scheduleNextTickRef.current = scheduleNextTick;
  });

  const start = async (config: MetronomeConfig) => {
    const state = stateRef.current;

    await audioClock.resume();
    audioClock.synchronizeClocks();

    state.running = true;
    state.bpm = config.bpm;
    state.measure = config.measure;
    state.subdivision = config.subdivision;
    state.interval = calculateInterval(config.bpm, config.subdivision);
    state.totalTicks = calculateTotalTicks(config.measure, config.subdivision);
    state.beat = 0;
    state.measureCount = 1;
    state.tickCount = 0;
    state.measuresOn = config.measuresOn;
    state.measuresOff = config.measuresOff;
    state.gapEnabled = config.gapEnabled;
    state.startTime = audioClock.getCurrentAudioTime();

    metrics.recordWorkerStart(config);
    scheduleNextTick();
  };

  const stop = () => {
    const state = stateRef.current;
    state.running = false;

    if (cancelScheduleRef.current) {
      cancelScheduleRef.current();
      cancelScheduleRef.current = null;
    }

    metrics.recordWorkerStop();
  };

  const update = (config: MetronomeConfig) => {
    const state = stateRef.current;

    if (!state.running) {
      state.bpm = config.bpm;
      state.measure = config.measure;
      state.subdivision = config.subdivision;
      state.measuresOn = config.measuresOn;
      state.measuresOff = config.measuresOff;
      state.gapEnabled = config.gapEnabled;
      state.interval = calculateInterval(config.bpm, config.subdivision);
      state.totalTicks = calculateTotalTicks(
        config.measure,
        config.subdivision
      );
    }
  };

  const onTick = (callback: TickCallback) => {
    tickCallbackRef.current = callback;
  };

  return { start, stop, update, onTick };
};

export { useMetronomeScheduler };
