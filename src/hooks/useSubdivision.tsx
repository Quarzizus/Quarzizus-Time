import { useState } from "react";

const useSubdivision = () => {
  const [subdivision, setSubdivision] = useState<number>(4);

  const options = [
    {
      label: "1",
      value: 1,
    },
    {
      label: "2",
      value: 2,
    },
    {
      label: "3",
      value: 3,
    },
    {
      label: "4",
      value: 4,
    },
  ];

  const handler = (sub: number) => {
    setSubdivision(sub);
  };

  return { subdivision, handler, options };
};

export { useSubdivision };
