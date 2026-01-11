interface MetronomeConfig {
  bpm: number;
  measure: number;
  subdivision: number;
  measuresOn: number;
  measuresOff: number;
  gapEnabled: boolean;
}

type WorkerMessage =
  | {
      type: "start";
      config: MetronomeConfig;
    }
  | { type: "stop" }
  | {
      type: "update";
      config: MetronomeConfig;
    };

type MainMessage = {
  type: "tick";
  beat: number;
  soundType: "accent" | "sub";
  timestamp: number;
  measureCount: number;
  measuresOn: number;
  measuresOff: number;
  gapEnabled: boolean;
};

const state = {
  running: false,
  bpm: 90,
  interval: 0,
  beat: 0,
  measure: 4,
  subdivision: 1,
  lastTick: 0,
  totalTicks: 16,
  measureCount: 1,
  measuresOn: 1,
  measuresOff: 1,
  gapEnabled: false,
};

const calculateInterval = (bpm: number, subdivision: number) => {
  return 60000 / bpm / subdivision;
};

const calculateTotalTicks = (measure: number, subdivision: number) => {
  return measure * subdivision;
};

let timeoutId: number | null = null;

const scheduleNextTick = () => {
  if (!state.running) return;

  const now = performance.now();
  const nextTickTime = state.lastTick + state.interval;
  const delay = Math.max(0, nextTickTime - now);

  timeoutId = setTimeout(() => {
    if (!state.running) return;

    state.beat++;
    if (state.beat >= state.totalTicks) {
      state.beat = 0;
      state.measureCount++;
    }

    const initMeasure = state.beat === 0;
    const isAccent = initMeasure || state.beat % state.subdivision === 0;
    const soundType: "accent" | "sub" = isAccent ? "accent" : "sub";

    const message: MainMessage = {
      type: "tick",
      beat: state.beat,
      soundType,
      timestamp: performance.now(),
      measureCount: state.measureCount,
      measuresOn: state.measuresOn,
      measuresOff: state.measuresOff,
      gapEnabled: state.gapEnabled,
    };

    self.postMessage(message);
    state.lastTick = performance.now();
    scheduleNextTick();
  }, delay) as unknown as number;
};

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const msg = e.data;

  switch (msg.type) {
    case "start":
      state.running = true;
      state.bpm = msg.config.bpm;
      state.measure = msg.config.measure;
      state.subdivision = msg.config.subdivision;
      state.interval = calculateInterval(
        msg.config.bpm,
        msg.config.subdivision,
      );
      state.totalTicks = calculateTotalTicks(
        msg.config.measure,
        msg.config.subdivision,
      );
      state.beat = 0;
      state.measureCount = 1;
      state.measuresOn = msg.config.measuresOn;
      state.measuresOff = msg.config.measuresOff;
      state.gapEnabled = msg.config.gapEnabled;
      state.lastTick = performance.now();
      scheduleNextTick();
      break;

    case "stop":
      state.running = false;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      break;

    case "update":
      state.bpm = msg.config.bpm;
      state.measure = msg.config.measure;
      state.subdivision = msg.config.subdivision;
      state.measuresOn = msg.config.measuresOn;
      state.measuresOff = msg.config.measuresOff;
      state.gapEnabled = msg.config.gapEnabled;
      state.interval = calculateInterval(
        msg.config.bpm,
        msg.config.subdivision,
      );
      state.totalTicks = calculateTotalTicks(
        msg.config.measure,
        msg.config.subdivision,
      );
      if (state.running && timeoutId !== null) {
        clearTimeout(timeoutId);
        scheduleNextTick();
      }
      break;
  }
};
