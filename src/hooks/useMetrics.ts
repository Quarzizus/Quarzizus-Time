import { useCallback, useState, useEffect } from 'react';
import { metrics } from '../lib/metrics';

export const useMetrics = () => {
  const [enabled, setEnabled] = useState(() => metrics.isEnabled());
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    // Actualizar contador periódicamente para reflejar cambios
    const interval = setInterval(() => {
      setEventCount(metrics.getEvents().length);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleEnabled = useCallback(() => {
    if (metrics.isEnabled()) {
      metrics.disable();
      setEnabled(false);
    } else {
      metrics.enable();
      setEnabled(true);
    }
  }, []);

  const exportJSON = useCallback(() => {
    metrics.download();
  }, []);

  const exportCSV = useCallback(() => {
    metrics.downloadCSV();
  }, []);

  const clear = useCallback(() => {
    metrics.clear();
    setEventCount(0);
  }, []);

  return {
    enabled,
    toggleEnabled,
    exportJSON,
    exportCSV,
    clear,
    eventCount,
  };
};