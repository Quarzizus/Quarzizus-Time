import { useEffect, useRef, useState, useCallback } from "react";
import { useMetronomeAudio } from "./useMetronomeAudio";
import { useMetronomeWorker } from "./useMetronomeWorker";

interface Props {
  bpm: number;
  measure: number;
  subdivision: number;
}

const useEngine = ({ bpm, measure, subdivision }: Props) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentBeat, setCurrentBeat] = useState<number>(0);

  const { playSound } = useMetronomeAudio();
  const { start, stop, update, onTick } = useMetronomeWorker();

  const prevBpm = useRef(bpm);
  const prevMeasure = useRef(measure);
  const prevSubdivision = useRef(subdivision);

  const handleTick = useCallback(
    (beat: number, soundType: "accent" | "sub") => {
      playSound(soundType, beat);
      setCurrentBeat(beat);
    },
    [playSound],
  );

  useEffect(() => {
    onTick(handleTick);
  }, [onTick, handleTick]);

  useEffect(() => {
    const hasUpdates =
      bpm !== prevBpm.current ||
      measure !== prevMeasure.current ||
      subdivision !== prevSubdivision.current;

    if (hasUpdates) {
      update(bpm, measure, subdivision);
      prevBpm.current = bpm;
      prevMeasure.current = measure;
      prevSubdivision.current = subdivision;
    }
  }, [bpm, measure, subdivision, update]);

  const onPlay = useCallback(() => {
    start(bpm, measure, subdivision);
    setIsRunning(true);
  }, [bpm, measure, subdivision, start]);

  const onStop = useCallback(() => {
    stop();
    setIsRunning(false);
  }, [stop]);

  const onReset = useCallback(() => {
    stop();
    setIsRunning(false);
    setCurrentBeat(0);
  }, [stop]);

  return {
    currentBeat,
    isRunning,
    onPlay,
    onStop,
    onReset,
  };
};

export { useEngine };
