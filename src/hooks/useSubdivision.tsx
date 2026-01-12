import { useState, useEffect } from "react";

const useSubdivision = (initialSubdivision?: number) => {
  const [subdivision, setSubdivision] = useState<number>(initialSubdivision || 1);

  useEffect(() => {
    if (initialSubdivision !== undefined) {
      setSubdivision(initialSubdivision);
    }
  }, [initialSubdivision]);

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
