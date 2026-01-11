import { Minus, Plus } from "lucide-react";

interface BpmControlProps {
  bpm: number;
  handler: (bpm: number) => void;
}

export function BpmControl({ bpm, handler }: BpmControlProps) {
  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-card rounded-xl shadow-sm border w-full">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Tempo
      </h2>
      <div className="flex items-center justify-center gap-6 w-full">
        <button
          onClick={() => handler(Math.max(20, bpm - 1))}
          className="p-3 rounded-full hover:bg-secondary transition-colors"
          aria-label="Decrease BPM"
        >
          <Minus className="w-6 h-6" />
        </button>
        <div className="text-7xl font-bold font-mono tabular-nums text-center min-w-[3ch]">
          {bpm}
        </div>
        <button
          onClick={() => handler(Math.min(240, bpm + 1))}
          className="p-3 rounded-full hover:bg-secondary transition-colors"
          aria-label="Increase BPM"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
      <input
        type="range"
        min="20"
        max="240"
        value={bpm}
        onChange={(e) => handler(Number(e.target.value))}
        className="w-full accent-primary h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
}
