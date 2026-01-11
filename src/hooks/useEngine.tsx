import { useEffect, useRef, useState } from "react";

interface Props {
  bpm: number;
  measure: number;
  subdivision: number;
}

const useEngine = ({ bpm, measure, subdivision }: Props) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentBeat, setCurrentBeat] = useState<number>(0);

  const stateRef = useRef({
    bpm,
    measure,
    subdivision,
    beat: 0,
    nextTick: 0,
  });

  useEffect(() => {
    stateRef.current.bpm = bpm;
    stateRef.current.measure = measure;
    stateRef.current.subdivision = subdivision;
  }, [bpm, measure, subdivision]);

  useEffect(() => {
    if (!isRunning) return;

    let rafId: number;
    stateRef.current.nextTick = performance.now();

    const loop = () => {
      const { bpm, measure, subdivision, nextTick } = stateRef.current;
      const interval = 60000 / bpm / subdivision;
      const now = performance.now();

      if (now >= nextTick) {
        let nextBeat = stateRef.current.beat + 1;
        if (nextBeat >= measure * subdivision) {
          nextBeat = 0;
        }

        stateRef.current.beat = nextBeat;
        stateRef.current.nextTick += interval;
        setCurrentBeat(nextBeat);
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [isRunning]);

  const onPlay = () => setIsRunning(true);

  const onStop = () => setIsRunning(false);

  const onReset = () => {
    setIsRunning(false);
    setCurrentBeat(0);
    stateRef.current.beat = 0;
  };

  return {
    currentBeat,
    isRunning,
    onPlay,
    onStop,
    onReset,
  };
};

export { useEngine };
