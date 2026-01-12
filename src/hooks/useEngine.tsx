import { useEffect, useRef, useState } from "react";
import { useMetronomeAudio } from "./useMetronomeAudio";
import { useMetronomeScheduler } from "./useMetronomeScheduler";
import type { MetronomeConfig, TickData } from "./useMetronomeScheduler";
import { metrics } from "../lib/metrics";
import { audioClock } from "../lib/audioClock";

const hasConfigChanged = (
  current: MetronomeConfig,
  previous: MetronomeConfig
) => {
  return (
    current.bpm !== previous.bpm ||
    current.measure !== previous.measure ||
    current.subdivision !== previous.subdivision ||
    current.measuresOn !== previous.measuresOn ||
    current.measuresOff !== previous.measuresOff ||
    current.gapEnabled !== previous.gapEnabled
  );
};

const shouldPlaySound = (data: TickData) => {
  if (!data.gapEnabled) return true;
  const cycleLength = data.measuresOn + data.measuresOff;
  return data.measureCount % cycleLength < data.measuresOn;
};

const useAutoRestart = (onRestart: () => void) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const schedule = () => {
    cancel();
    timerRef.current = setTimeout(onRestart, 1000);
  };

  useEffect(() => () => cancel(), []);

  return { schedule, cancel };
};

const usePageVisibility = (onVisibilityChange: (isVisible: boolean) => void) => {
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      onVisibilityChange(isVisible);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [onVisibilityChange]);
};

const useEngine = (config: MetronomeConfig) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isGap, setIsGap] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentMeasure, setCurrentMeasure] = useState(1);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(
    null
  );
  const [showNotification, setShowNotification] = useState(false);

  const prevConfig = useRef(config);
  const wasRunningBeforeBackground = useRef(false);
  const { playSoundAtTargetTime } = useMetronomeAudio();
  const { start, stop, update, onTick } = useMetronomeScheduler();

  const restartMetronome = () => {
    start(config);
    setIsRunning(true);
    setShowNotification(false);
    setNotificationMessage(null);
  };

  const autoRestart = useAutoRestart(restartMetronome);

  usePageVisibility((isVisible) => {
    if (!isVisible && isRunning) {
      wasRunningBeforeBackground.current = true;
      stop();
      metrics.recordWorkerStop();
      setIsRunning(false);
      setNotificationMessage("Pausado (app en background)");
      setShowNotification(true);
    } else if (isVisible && wasRunningBeforeBackground.current) {
      wasRunningBeforeBackground.current = false;
      audioClock.synchronizeClocks();
      setNotificationMessage("¿Continuar?");
      setShowNotification(true);
    }
  });

  useEffect(() => {
    const handleTick = (data: TickData) => {
      const errorMs = data.timestamp - data.targetTime;
      const intervalMs = 60000 / config.bpm / config.subdivision;
      metrics.recordTickError(
        errorMs,
        data.targetTime,
        data.timestamp,
        intervalMs
      );

      const shouldPlay = shouldPlaySound(data);
      setIsGap(!shouldPlay);

      if (shouldPlay) {
        playSoundAtTargetTime(data.soundType, data.beat, data.targetTime);
      }

      setCurrentBeat(data.beat);
      setCurrentMeasure(data.measureCount);
    };

    onTick(handleTick);
  }, [onTick, config.bpm, config.subdivision, playSoundAtTargetTime]);

  useEffect(() => {
    const configChanged = hasConfigChanged(config, prevConfig.current);

    if (configChanged && isRunning) {
      stop();
      metrics.recordWorkerStop();
      autoRestart.cancel();
      prevConfig.current = config;

      const uiTimer = setTimeout(() => {
        setIsRunning(false);
        setCurrentBeat(0);
        setCurrentMeasure(1);
        setIsGap(false);
        setNotificationMessage("Actualizando configuración");
        setShowNotification(true);
        autoRestart.schedule();
      }, 0);

      return () => clearTimeout(uiTimer);
    }

    if (configChanged && !isRunning) {
      update(config);
      prevConfig.current = config;
    }
  }, [config, isRunning, stop, start, update, autoRestart]);

  const onPlay = () => {
    metrics.recordWorkerStart(config);
    start(config);
    setIsRunning(true);
  };

  const onStop = () => {
    stop();
    metrics.recordWorkerStop();
    setIsRunning(false);
    autoRestart.cancel();
  };

  const onReset = () => {
    stop();
    metrics.recordWorkerStop();
    setIsRunning(false);
    setCurrentBeat(0);
    setCurrentMeasure(1);
    setIsGap(false);
    autoRestart.cancel();
  };

  const clearNotification = () => {
    setShowNotification(false);
    setNotificationMessage(null);
  };

  return {
    currentBeat,
    currentMeasure,
    isRunning,
    isGap,
    notificationMessage,
    showNotification,
    clearNotification,
    onPlay,
    onStop,
    onReset,
  };
};

export { useEngine };
