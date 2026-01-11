import { useState } from "react";

const useTapTempo = (onBpmChange: (bpm: number) => void) => {
  const [taps, setTaps] = useState<number[]>([]);
  const [lastTap, setLastTap] = useState<number>(0);

  const MAX_TAPS = 5;
  const MIN_BPM = 20;
  const MAX_BPM = 240;

  const calculateTempo = (tapIntervals: number[]) => {
    if (tapIntervals.length < 2) return;
    
    const sum = tapIntervals.reduce((acc, curr) => acc + curr, 0);
    const average = sum / tapIntervals.length;
    
    if (average <= 0) return;
    
    const bpm = Math.round(60000 / average);
    const clampedBpm = Math.min(MAX_BPM, Math.max(MIN_BPM, bpm));
    
    onBpmChange(clampedBpm);
  };

  const tapTempo = () => {
    const now = performance.now();

    if (lastTap === 0) {
      setLastTap(now);
      return;
    }

    const interval = now - lastTap;
    let newTaps = [...taps, interval];
    setLastTap(now);

    if (newTaps.length > MAX_TAPS) {
      newTaps = newTaps.slice(1);
    }

    setTaps(newTaps);
    calculateTempo(newTaps);
  };

  const resetTaps = () => {
    setTaps([]);
    setLastTap(0);
  };

  return { tapTempo, resetTaps, tapCount: taps.length };
};

export { useTapTempo };