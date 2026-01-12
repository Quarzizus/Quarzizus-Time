import { useEffect, useRef, useState, useCallback } from "react";
import { useMetronomeAudio } from "./useMetronomeAudio";
import { useMetronomeScheduler } from "./useMetronomeScheduler";
import type { MetronomeConfig, TickData } from "./useMetronomeScheduler";
import { metrics } from "../lib/metrics";

const useEngine = (config: MetronomeConfig) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isGap, setIsGap] = useState<boolean>(false);
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const [currentMeasure, setCurrentMeasure] = useState<number>(1);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState<boolean>(false);

  const { playSoundAtTargetTime } = useMetronomeAudio();
  const { start, stop, update, onTick } = useMetronomeScheduler();

  const prevConfig = useRef<MetronomeConfig>(config);

  const handleTick = useCallback(
    (data: TickData) => {
      const shouldPlay =
        !data.gapEnabled ||
        data.measureCount % (data.measuresOn + data.measuresOff) <
          data.measuresOn;

      // Registrar error de timing del worker
      const errorMs = data.timestamp - data.targetTime;
      metrics.recordTickError(errorMs, data.targetTime, data.timestamp, 60000 / config.bpm / config.subdivision);

      if (shouldPlay) {
        playSoundAtTargetTime(data.soundType, data.beat, data.targetTime);
        setIsGap(false);
      } else {
        setIsGap(true);
      }

      setCurrentBeat(data.beat);
      setCurrentMeasure(data.measureCount);
    },
    [playSoundAtTargetTime, config.bpm, config.subdivision],
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
      if (isRunning) {
        // Pausar automáticamente cuando hay cambios mientras corre
        stop();
        metrics.recordWorkerStop();
        
        // Usar setTimeout para evitar cascading renders
        const timer = setTimeout(() => {
          setIsRunning(false);
          setCurrentBeat(0);
          setCurrentMeasure(1);
          setIsGap(false);
          setNotificationMessage("Cambia la configuración y dale play ⚡");
          setShowNotification(true);
          
          // Auto-ocultar notificación después de 2 segundos
          setTimeout(() => {
            setShowNotification(false);
            setNotificationMessage(null);
          }, 2000);
        }, 0);
        
        return () => clearTimeout(timer);
      } else {
        // Si ya está pausado, solo actualizar silenciosamente
        update(config);
      }
      prevConfig.current = config;
    }
  }, [config, update, isRunning, stop]);

  const onPlay = useCallback(() => {
    metrics.recordWorkerStart(config);
    start(config);
    setIsRunning(true);
  }, [config, start]);

  const onStop = useCallback(() => {
    stop();
    metrics.recordWorkerStop();
    setIsRunning(false);
  }, [stop]);

  const onReset = useCallback(() => {
    stop();
    metrics.recordWorkerStop();
    setIsRunning(false);
    setCurrentBeat(0);
    setCurrentMeasure(1);
    setIsGap(false);
  }, [stop]);

  const clearNotification = useCallback(() => {
    setShowNotification(false);
    setNotificationMessage(null);
  }, []);

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
