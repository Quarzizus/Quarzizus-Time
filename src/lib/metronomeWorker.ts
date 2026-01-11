type WorkerMessage =
  | { type: 'start'; bpm: number; measure: number; subdivision: number }
  | { type: 'stop' }
  | { type: 'update'; bpm: number; measure: number; subdivision: number };

type MainMessage = {
  type: 'tick';
  beat: number;
  soundType: 'accent' | 'sub';
  timestamp: number;
};

const state = {
  running: false,
  bpm: 120,
  interval: 0,
  beat: 0,
  measure: 4,
  subdivision: 4,
  lastTick: 0,
  totalTicks: 16,
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
    }

    const isAccent = state.beat === 0 || state.beat % state.subdivision === 0;
    const soundType: 'accent' | 'sub' = isAccent ? 'accent' : 'sub';

    const message: MainMessage = {
      type: 'tick',
      beat: state.beat,
      soundType,
      timestamp: performance.now(),
    };

    self.postMessage(message);
    state.lastTick = performance.now();
    scheduleNextTick();
  }, delay) as unknown as number;
};

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const msg = e.data;

  switch (msg.type) {
    case 'start':
      state.running = true;
      state.bpm = msg.bpm;
      state.measure = msg.measure;
      state.subdivision = msg.subdivision;
      state.interval = calculateInterval(msg.bpm, msg.subdivision);
      state.totalTicks = calculateTotalTicks(msg.measure, msg.subdivision);
      state.beat = 0;
      state.lastTick = performance.now();
      scheduleNextTick();
      break;

    case 'stop':
      state.running = false;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      break;

    case 'update':
      state.bpm = msg.bpm;
      state.measure = msg.measure;
      state.subdivision = msg.subdivision;
      state.interval = calculateInterval(msg.bpm, msg.subdivision);
      state.totalTicks = calculateTotalTicks(msg.measure, msg.subdivision);
      if (state.running && timeoutId !== null) {
        clearTimeout(timeoutId);
        scheduleNextTick();
      }
      break;
  }
};