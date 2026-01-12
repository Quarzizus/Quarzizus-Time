import { useRef, useCallback, useMemo, useEffect } from "react";
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
  interval: number; // milliseconds per tick
  beat: number;
  measure: number;
  subdivision: number;
  startTime: number; // audio time when started (seconds)
  tickCount: number;
  totalTicks: number;
  measureCount: number;
  measuresOn: number;
  measuresOff: number;
  gapEnabled: boolean;
}

const calculateInterval = (bpm: number, subdivision: number): number => {
  return 60000 / bpm / subdivision;
};

const calculateTotalTicks = (measure: number, subdivision: number): number => {
  return measure * subdivision;
};

const useMetronomeScheduler = () => {
  const stateRef = useRef<SchedulerState>({
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

  const tickCallbackRef = useRef<TickCallback | null>(null);
  const cancelScheduleRef = useRef<(() => void) | null>(null);
  const scheduleNextTickRef = useRef<() => void>(() => {});

  // Tick engine function - processes a single tick and schedules the next one
  const processTick = useCallback((audioTime: number) => {
    const state = stateRef.current;
    if (!state.running) {
      return;
    }

    const targetPerfTime = audioClock.getPerfTime(audioTime);
    const actualPerfTime = performance.now();
    const error = actualPerfTime - targetPerfTime;

    // Record timing error for metrics
    metrics.recordTickError(error, targetPerfTime, actualPerfTime, state.interval);

    // Calculate beat and measure before incrementing for this tick
    const currentBeat = state.beat;
    const currentMeasureCount = state.measureCount;

    // Increment for next tick
    state.beat++;
    state.tickCount++;

    if (state.beat >= state.totalTicks) {
      state.beat = 0;
      state.measureCount++;
    }

    const initMeasure = currentBeat === 0;
    const isAccent = initMeasure || currentBeat % state.subdivision === 0;
    const soundType: "accent" | "sub" = isAccent ? "accent" : "sub";

    const tickData: TickData = {
      beat: currentBeat,
      soundType,
      timestamp: actualPerfTime,
      targetTime: targetPerfTime,
      measureCount: currentMeasureCount,
      measuresOn: state.measuresOn,
      measuresOff: state.measuresOff,
      gapEnabled: state.gapEnabled,
    };

    // Call tick callback
    if (tickCallbackRef.current) {
      tickCallbackRef.current(tickData);
    }

    // Drift compensation: if error exceeds 20% of interval, recalibrate
    if (Math.abs(error) > state.interval * 0.2) {
      const nowAudio = audioClock.getCurrentAudioTime();
      state.startTime = nowAudio - (state.tickCount * state.interval) / 1000;
    }

    // Schedule next tick if still running
    if (state.running) {
      scheduleNextTickRef.current();
    }
  }, []);

  const scheduleNextTick = useCallback(() => {
    const state = stateRef.current;
    if (!state.running) {
      return;
    }

    // Cancel any previously scheduled tick
    if (cancelScheduleRef.current) {
      cancelScheduleRef.current();
      cancelScheduleRef.current = null;
    }

    const targetAudioTime = state.startTime + (state.tickCount * state.interval) / 1000;
    const nowAudio = audioClock.getCurrentAudioTime();
    const delay = targetAudioTime - nowAudio;

    // If the target time is significantly in the past (more than one interval),
    // skip missed ticks to avoid recursion
    if (delay < -state.interval / 1000) {
      const ticksToSkip = Math.floor(-delay * 1000 / state.interval);
      state.tickCount += ticksToSkip;
      
      // Recalculate target time with skipped ticks
      const newTargetAudioTime = state.startTime + (state.tickCount * state.interval) / 1000;
      const newDelay = newTargetAudioTime - nowAudio;
      
      if (newDelay <= 0.001) {
        processTick(newTargetAudioTime);
      } else {
        const cancel = audioClock.scheduleAtAudioTime((audioTime) => {
          cancelScheduleRef.current = null;
          processTick(audioTime);
        }, newTargetAudioTime);
        cancelScheduleRef.current = cancel;
      }
    }
    // If the target time is in the past or very near (within 1ms), execute immediately
    else if (delay <= 0.001) {
      processTick(targetAudioTime);
    } else {
      // Schedule via audio clock with cancellation support
      const cancel = audioClock.scheduleAtAudioTime((audioTime) => {
        cancelScheduleRef.current = null;
        processTick(audioTime);
      }, targetAudioTime);
      cancelScheduleRef.current = cancel;
    }
  }, [processTick]);

  // Update the scheduleNextTick ref after it's defined
  useEffect(() => {
    scheduleNextTickRef.current = scheduleNextTick;
  }, [scheduleNextTick]);

  const start = useCallback((config: MetronomeConfig) => {
    const state = stateRef.current;
    
    // Ensure audio context is running and clocks are synchronized
    audioClock.resume();
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

    // Record start metrics
    metrics.recordWorkerStart(config);

    scheduleNextTick();
  }, [scheduleNextTick]);

  const stop = useCallback(() => {
    const state = stateRef.current;
    state.running = false;

    // Cancel any scheduled tick
    if (cancelScheduleRef.current) {
      cancelScheduleRef.current();
      cancelScheduleRef.current = null;
    }

    // Record stop metrics
    metrics.recordWorkerStop();
  }, []);

  const update = useCallback((config: MetronomeConfig) => {
    const state = stateRef.current;
    
    // Only update configuration when NOT running
    // When running, useEngine will stop the metronome first
    if (!state.running) {
      state.bpm = config.bpm;
      state.measure = config.measure;
      state.subdivision = config.subdivision;
      state.measuresOn = config.measuresOn;
      state.measuresOff = config.measuresOff;
      state.gapEnabled = config.gapEnabled;
      state.interval = calculateInterval(config.bpm, config.subdivision);
      state.totalTicks = calculateTotalTicks(config.measure, config.subdivision);
    }
    // If running, do nothing - the metronome will be stopped by useEngine
  }, []);

  const onTick = useCallback((callback: TickCallback) => {
    tickCallbackRef.current = callback;
  }, []);

  return useMemo(() => ({ start, stop, update, onTick }), [start, stop, update, onTick]);
};

export { useMetronomeScheduler };