import { useEffect, useRef, useCallback } from 'react';



type TickCallback = (beat: number, soundType: 'accent' | 'sub', timestamp: number) => void;

const useMetronomeWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const tickCallbackRef = useRef<TickCallback | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL('../lib/metronomeWorker.ts', import.meta.url), {
      type: 'module',
    });
    workerRef.current = worker;

    const handleMessage = (e: MessageEvent<{ type: 'tick'; beat: number; soundType: 'accent' | 'sub'; timestamp: number }>) => {
      if (e.data.type === 'tick' && tickCallbackRef.current) {
        tickCallbackRef.current(e.data.beat, e.data.soundType, e.data.timestamp);
      }
    };

    worker.addEventListener('message', handleMessage);

    return () => {
      worker.removeEventListener('message', handleMessage);
      worker.terminate();
    };
  }, []);

  const start = useCallback((bpm: number, measure: number, subdivision: number) => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'start', bpm, measure, subdivision });
    }
  }, []);

  const stop = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'stop' });
    }
  }, []);

  const update = useCallback((bpm: number, measure: number, subdivision: number) => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'update', bpm, measure, subdivision });
    }
  }, []);

  const onTick = useCallback((callback: TickCallback) => {
    tickCallbackRef.current = callback;
  }, []);

  return { start, stop, update, onTick };
};

export { useMetronomeWorker };