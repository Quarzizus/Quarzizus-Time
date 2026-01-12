import { useRef, useEffect } from "react";
import { audioClock } from "../lib/audioClock";
import { createClickBuffer } from "../lib/audioUtils";
import { metrics } from "../lib/metrics";

export type BeatType = "accent" | "sub" | "mute";

export interface MetronomeConfig {
  bpm: number;
  measure: number;
  subdivision: number;
  measuresOn: number;
  measuresOff: number;
  gapEnabled: boolean;
  patternMode: "simple" | "advanced";
  pattern: BeatType[];
}

export interface TickData {
  beat: number;
  soundType: "accent" | "sub" | "mute";
  measureCount: number;
  measuresOn: number;
  measuresOff: number;
  gapEnabled: boolean;
}

type TickCallback = (data: TickData) => void;

const LOOKAHEAD_TIME = 0.1;
const SCHEDULE_INTERVAL = 25;

interface SchedulerState {
  running: boolean;
  bpm: number;
  interval: number;
  beat: number;
  measure: number;
  subdivision: number;
  nextTickTime: number;
  tickCount: number;
  totalTicks: number;
  measureCount: number;
  measuresOn: number;
  measuresOff: number;
  gapEnabled: boolean;
  patternMode: "simple" | "advanced";
  pattern: BeatType[];
}

const calculateInterval = (bpm: number, subdivision: number) => {
  return 60 / bpm / subdivision;
};

const calculateTotalTicks = (measure: number, subdivision: number) => {
  return measure * subdivision;
};

const determineSoundType = (beat: number, subdivision: number, patternMode: "simple" | "advanced", pattern: BeatType[]): "accent" | "sub" | "mute" => {
  if (patternMode === "advanced" && pattern.length > 0) {
    return pattern[beat % pattern.length];
  }
  
  const isFirstBeat = beat === 0;
  const isAccentBeat = beat % subdivision === 0;
  return isFirstBeat || isAccentBeat ? "accent" : "sub";
};

const shouldPlayInGap = (measureCount: number, measuresOn: number, measuresOff: number, gapEnabled: boolean) => {
  if (!gapEnabled) return true;
  const cycleLength = measuresOn + measuresOff;
  return (measureCount - 1) % cycleLength < measuresOn;
};

const createInitialState = (): SchedulerState => ({
  running: false,
  bpm: 90,
  interval: 0,
  beat: 0,
  measure: 4,
  subdivision: 1,
  nextTickTime: 0,
  tickCount: 0,
  totalTicks: 4,
  measureCount: 1,
  measuresOn: 1,
  measuresOff: 1,
  gapEnabled: false,
  patternMode: "simple",
  pattern: ["accent", "sub", "sub", "sub"],
});

export const useLookaheadScheduler = () => {
  const stateRef = useRef<SchedulerState>(createInitialState());
  const tickCallbackRef = useRef<TickCallback | null>(null);
  const scheduleIntervalRef = useRef<number | null>(null);
  const accentBufferRef = useRef<AudioBuffer | null>(null);
  const subBufferRef = useRef<AudioBuffer | null>(null);

  const ensureBuffersInitialized = () => {
    if (accentBufferRef.current && subBufferRef.current) return;
    
    const ctx = audioClock.getContext();
    accentBufferRef.current = createClickBuffer(ctx, 1200, 0.08);
    subBufferRef.current = createClickBuffer(ctx, 1200, 0.08);
  };

  const scheduleSound = (audioTime: number, type: "accent" | "sub" | "mute") => {
    if (type === "mute") return;
    
    const ctx = audioClock.getContext();
    const buffer = type === "accent" ? accentBufferRef.current : subBufferRef.current;
    
    if (!buffer) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    
    const gain = ctx.createGain();
    gain.gain.value = type === "accent" ? 0.8 : 0.3;
    
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(audioTime);
  };

  const scheduleTicks = () => {
    const state = stateRef.current;
    if (!state.running) return;

    const ctx = audioClock.getContext();
    const currentTime = ctx.currentTime;
    const scheduleAheadTime = currentTime + LOOKAHEAD_TIME;

    while (state.nextTickTime < scheduleAheadTime) {
      const currentBeat = state.beat;
      const currentMeasureCount = state.measureCount;
      const soundType = determineSoundType(currentBeat, state.subdivision, state.patternMode, state.pattern);
      const shouldPlay = shouldPlayInGap(
        currentMeasureCount,
        state.measuresOn,
        state.measuresOff,
        state.gapEnabled
      );

      if (shouldPlay && soundType !== "mute") {
        scheduleSound(state.nextTickTime, soundType);
      }

      const tickData: TickData = {
        beat: currentBeat,
        soundType,
        measureCount: currentMeasureCount,
        measuresOn: state.measuresOn,
        measuresOff: state.measuresOff,
        gapEnabled: state.gapEnabled,
      };

      if (tickCallbackRef.current) {
        tickCallbackRef.current(tickData);
      }

      state.beat++;
      state.tickCount++;

      if (state.beat >= state.totalTicks) {
        state.beat = 0;
        state.measureCount++;
      }

      state.nextTickTime += state.interval;
    }
  };

  const start = async (config: MetronomeConfig) => {
    const state = stateRef.current;

    await audioClock.resume();
    audioClock.synchronizeClocks();
    ensureBuffersInitialized();

    const ctx = audioClock.getContext();
    
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
    state.patternMode = config.patternMode;
    state.pattern = config.pattern;
    state.nextTickTime = ctx.currentTime;

    metrics.recordWorkerStart(config);

    scheduleTicks();

    if (scheduleIntervalRef.current !== null) {
      clearInterval(scheduleIntervalRef.current);
    }

    scheduleIntervalRef.current = window.setInterval(() => {
      scheduleTicks();
    }, SCHEDULE_INTERVAL);
  };

  const stop = () => {
    const state = stateRef.current;
    state.running = false;

    if (scheduleIntervalRef.current !== null) {
      clearInterval(scheduleIntervalRef.current);
      scheduleIntervalRef.current = null;
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
      state.patternMode = config.patternMode;
      state.pattern = config.pattern;
      state.interval = calculateInterval(config.bpm, config.subdivision);
      state.totalTicks = calculateTotalTicks(config.measure, config.subdivision);
    }
  };

  const onTick = (callback: TickCallback) => {
    tickCallbackRef.current = callback;
  };

  useEffect(() => {
    return () => {
      if (scheduleIntervalRef.current !== null) {
        clearInterval(scheduleIntervalRef.current);
      }
    };
  }, []);

  return { start, stop, update, onTick };
};
