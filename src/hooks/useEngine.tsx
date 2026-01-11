import { useEffect, useRef, useState } from "react";
import { useMetronomeAudio } from "./useMetronomeAudio";

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

  const { playSound } = useMetronomeAudio();

  useEffect(() => {
    stateRef.current.bpm = bpm;
    stateRef.current.measure = measure;
    stateRef.current.subdivision = subdivision;
  }, [bpm, measure, subdivision]);

  useEffect(() => {
    if (!isRunning) return;

    let rafId: number;
    const { bpm, subdivision } = stateRef.current;
    const interval = 60000 / bpm / subdivision;
    stateRef.current.nextTick = performance.now() + interval;

    const loop = () => {
      const { bpm, measure, subdivision, nextTick } = stateRef.current;
      const interval = 60000 / bpm / subdivision;
      const now = performance.now();

      if (now >= nextTick) {
        let nextBeat = stateRef.current.beat + 1;
        const totalTicks = measure * subdivision;
        if (nextBeat >= totalTicks) {
          nextBeat = 0;
        }

        const isAccent = nextBeat === 0 || nextBeat % subdivision === 0;

        const soundType: "accent" | "sub" = isAccent ? "accent" : "sub";

        playSound(soundType, nextBeat);

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
  }, [isRunning, playSound]);

  const onPlay = () => {
    setIsRunning(true);
  };

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
