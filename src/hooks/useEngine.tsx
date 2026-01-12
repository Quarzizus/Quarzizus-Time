import { useEffect, useRef, useState, useCallback } from "react";
import { useMetronomeAudio } from "./useMetronomeAudio";
import {
  useMetronomeWorker,
  type MetronomeConfig,
  type TickData,
} from "./useMetronomeWorker";

const useEngine = (config: MetronomeConfig) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isGap, setIsGap] = useState<boolean>(false);
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const [currentMeasure, setCurrentMeasure] = useState<number>(1);

  const { playSoundAtTargetTime } = useMetronomeAudio();
  const { start, stop, update, onTick } = useMetronomeWorker();

  const prevConfig = useRef<MetronomeConfig>(config);

  const handleTick = useCallback(
    (data: TickData) => {
      const shouldPlay =
        !data.gapEnabled ||
        data.measureCount % (data.measuresOn + data.measuresOff) <
          data.measuresOn;

      if (shouldPlay) {
        playSoundAtTargetTime(data.soundType, data.beat, data.targetTime);
        setIsGap(false);
      } else {
        setIsGap(true);
      }

      setCurrentBeat(data.beat);
      setCurrentMeasure(data.measureCount);
    },
    [playSoundAtTargetTime],
  );

  useEffect(() => {
    onTick(handleTick);
  }, [onTick, handleTick]);

  useEffect(() => {
    const hasUpdates =
      config.bpm !== prevConfig.current.bpm ||
      config.measure !== prevConfig.current.measure ||
      config.subdivision !== prevConfig.current.subdivision ||
      config.measuresOn !== prevConfig.current.measuresOn ||
      config.measuresOff !== prevConfig.current.measuresOff ||
      config.gapEnabled !== prevConfig.current.gapEnabled;

    if (hasUpdates) {
      update(config);
      prevConfig.current = config;
    }
  }, [config, update]);

  const onPlay = useCallback(() => {
    start(config);
    setIsRunning(true);
  }, [config, start]);

  const onStop = useCallback(() => {
    stop();
    setIsRunning(false);
  }, [stop]);

  const onReset = useCallback(() => {
    stop();
    setIsRunning(false);
    setCurrentBeat(0);
    setCurrentMeasure(1);
    setIsGap(false);
  }, [stop]);

  return {
    currentBeat,
    currentMeasure,
    isRunning,
    isGap,
    onPlay,
    onStop,
    onReset,
  };
};

export { useEngine };
