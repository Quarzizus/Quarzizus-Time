import { useEffect, useRef, useCallback } from "react";

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
  measureCount: number;
  measuresOn: number;
  measuresOff: number;
  gapEnabled: boolean;
}

type TickCallback = (data: TickData) => void;

const useMetronomeWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const tickCallbackRef = useRef<TickCallback | null>(null);

  useEffect(() => {
    const worker = new Worker(
      new URL("../lib/metronomeWorker.ts", import.meta.url),
      {
        type: "module",
      },
    );
    workerRef.current = worker;

    const handleMessage = (
      e: MessageEvent<{
        type: "tick";
        beat: number;
        soundType: "accent" | "sub";
        timestamp: number;
        measureCount: number;
        measuresOn: number;
        measuresOff: number;
        gapEnabled: boolean;
      }>,
    ) => {
      if (e.data.type === "tick" && tickCallbackRef.current) {
        tickCallbackRef.current({
          beat: e.data.beat,
          soundType: e.data.soundType,
          timestamp: e.data.timestamp,
          measureCount: e.data.measureCount,
          measuresOn: e.data.measuresOn,
          measuresOff: e.data.measuresOff,
          gapEnabled: e.data.gapEnabled,
        });
      }
    };

    worker.addEventListener("message", handleMessage);

    return () => {
      worker.removeEventListener("message", handleMessage);
      worker.terminate();
    };
  }, []);

  const start = useCallback((config: MetronomeConfig) => {
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: "start",
        config,
      });
    }
  }, []);

  const stop = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: "stop" });
    }
  }, []);

  const update = useCallback((config: MetronomeConfig) => {
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: "update",
        config,
      });
    }
  }, []);

  const onTick = useCallback((callback: TickCallback) => {
    tickCallbackRef.current = callback;
  }, []);

  return { start, stop, update, onTick };
};

export { useMetronomeWorker };
