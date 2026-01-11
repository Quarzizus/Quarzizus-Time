import { useState } from "react";

const useMesure = () => {
  const [measure, setMeasure] = useState<number>(4);

  const options = [
    { value: 2, label: "2/4" },
    { value: 3, label: "3/4" },
    { value: 4, label: "4/4" },
  ];

  const handleChangeMesure = (newMesure: number) => {
    setMeasure(newMesure);
  };

  return { measure, handleChangeMesure, options };
};

export { useMesure };
