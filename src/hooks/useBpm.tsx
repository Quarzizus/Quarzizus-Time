import { useState } from "react";

const useBpm = () => {
  const [bpm, setBpm] = useState<number>(120);

  const handleBpmChange = (newBpm: number) => {
    const clampedBpm = Math.min(240, Math.max(20, newBpm));
    setBpm(clampedBpm);
  };

  return { bpm, handleBpmChange };
};

export { useBpm };
