import type { ChangeEvent } from "react";

interface GapConfigProps {
  onBars: number | null;
  offBars: number | null;
  gapActive: boolean;
  setOnBars: (n: number | null) => void;
  setOffBars: (n: number | null) => void;
  setGapActive: (active: boolean) => void;
}

export function GapConfig({
  onBars,
  offBars,
  gapActive,
  setOnBars,
  setOffBars,
  setGapActive,
}: GapConfigProps) {
  const handleOnBarsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setOnBars(null);
      return;
    }
    const parsed = Number(value);
    setOnBars(Number.isNaN(parsed) ? null : parsed);
  };

  const handleOffBarsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setOffBars(null);
      return;
    }
    const parsed = Number(value);
    setOffBars(Number.isNaN(parsed) ? null : parsed);
  };
  return (
    <div className="flex flex-col gap-4 p-4 border rounded-xl bg-card shadow-sm w-full">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setGapActive(!gapActive)}
      >
        <label className="text-sm font-medium uppercase tracking-wider cursor-pointer">
          Gap Trainer
        </label>
        <div
          className={`w-11 h-6 rounded-full p-1 transition-colors ${
            gapActive ? "bg-primary" : "bg-muted"
          }`}
        >
          <div
            className={`w-4 h-4 bg-background rounded-full shadow-sm transform transition-transform duration-200 ${
              gapActive ? "translate-x-5" : ""
            }`}
          />
        </div>
      </div>

      <div
        className={`grid grid-cols-2 gap-4 transition-opacity duration-200 ${
          gapActive ? "opacity-100" : "opacity-50 pointer-events-none"
        }`}
      >
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground font-medium">
            PLAY (COMPASES)
          </span>
          <input
            type="number"
            min={1}
            value={onBars ?? ""}
            onChange={(e) => handleOnBarsChange(e)}
            className="w-full p-2 rounded-md border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground font-medium">
            MUTE (COMPASES)
          </span>
          <input
            type="number"
            min={1}
            value={offBars ?? ""}
            onChange={(e) => handleOffBarsChange(e)}
            className="w-full p-2 rounded-md border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
        </div>
      </div>
    </div>
  );
}
