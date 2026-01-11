import { useState } from "react";

const useGap = () => {
  const [measuresOn, setMeasuresOn] = useState<number>(1);
  const [measuresOff, setMeasuresOff] = useState<number>(1);
  const [gapEnabled, setGapEnabled] = useState<boolean>(false);

  const handleOn = (value: number) => {
    setMeasuresOn(value);
  };

  const handleOff = (value: number) => {
    setMeasuresOff(value);
  };

  const handleGap = () => {
    setGapEnabled(!gapEnabled);
  };

  return {
    measuresOn,
    measuresOff,
    handleOn,
    handleOff,
    gapEnabled,
    handleGap,
  };
};

export { useGap };
