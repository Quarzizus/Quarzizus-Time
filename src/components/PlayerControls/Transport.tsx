import { Play, Square, RotateCcw } from "lucide-react";

interface TransportProps {
  isRunning: boolean;
  onPlay: () => void;
  onStop: () => void;
  onReset: () => void;
}

export function Transport({
  isRunning,
  onPlay,
  onStop,
  onReset
}: TransportProps) {
  return (
    <div className="flex items-center gap-6 justify-center p-4">
      <button
        onClick={onReset}
        className="p-4 rounded-full bg-secondary hover:bg-secondary/80 transition-colors text-secondary-foreground"
        aria-label="Reset"
        title="Reset to Bar 1"
      >
        <RotateCcw className="w-6 h-6" />
      </button>

      <button
        onClick={isRunning ? onStop : onPlay}
        className={`p-8 rounded-full transition-all transform hover:scale-105 shadow-xl ${
          isRunning
            ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        }`}
        aria-label={isRunning ? "Stop" : "Play"}
      >
        {isRunning ? (
          <Square className="w-8 h-8 fill-current" />
        ) : (
          <Play className="w-8 h-8 fill-current ml-1" />
        )}
      </button>
    </div>
  );
}
