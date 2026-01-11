// import type { ChangeEvent } from "react";

// interface GapConfigProps {
//   onBars: number | null;
//   offBars: number | null;
//   gapActive: boolean;
//   setOnBars: (n: number | null) => void;
//   setOffBars: (n: number | null) => void;
//   setGapActive: (active: boolean) => void;
// }

export function GapConfig() {
  return (
    <div className="flex flex-col gap-4 p-4 border rounded-xl bg-card shadow-sm w-full">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => {}}
      >
        <label className="text-sm font-medium uppercase tracking-wider cursor-pointer">
          Gap Trainer
        </label>
        <div
          className={`w-11 h-6 rounded-full p-1 transition-colors ${
            window ? "bg-primary" : "bg-muted"
          }`}
        >
          <div
            className={`w-4 h-4 bg-background rounded-full shadow-sm transform transition-transform duration-200 ${
              window ? "translate-x-5" : ""
            }`}
          />
        </div>
      </div>

      <div
        className={`grid grid-cols-2 gap-4 transition-opacity duration-200 ${
          window ? "opacity-100" : "opacity-50 pointer-events-none"
        }`}
      >
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground font-medium">
            PLAY (COMPASES)
          </span>
          <input
            type="number"
            min={1}
            value={1}
            onChange={() => {}}
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
            value={1}
            onChange={() => {}}
            className="w-full p-2 rounded-md border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
        </div>
      </div>
      <button className="px-4 py-2 rounded-md  transition-colors text-sm border hover:bg-secondary">
        Aplicar
      </button>
    </div>
  );
}
