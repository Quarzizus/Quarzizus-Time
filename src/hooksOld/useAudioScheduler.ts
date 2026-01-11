import { useEffect, useRef } from 'react';
import { AudioContextManager } from '../lib/audioUtils';

export function useAudioScheduler(
  onTick: (context: AudioContext) => void,
  isRunning: boolean,
  lookahead: number = 25
) {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const context = AudioContextManager.getContext();
    AudioContextManager.resume();

    const loop = () => {
      onTick(context);
      timerRef.current = window.setTimeout(loop, lookahead);
    };

    loop();

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [isRunning, lookahead, onTick]);
}

