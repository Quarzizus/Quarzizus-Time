import logo from "../../assets/logo.png";

interface VisualizerProps {
  measure: number;
  subdivision: number;
  currentBeat?: number;
  // isGap: boolean;
}

export function Visualizer({
  measure,
  subdivision,
  currentBeat = 0,
  // isGap,
}: VisualizerProps) {
  // Total ticks per bar
  const totalTicks = measure * subdivision;
  // console.log(currentBeat);
  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-secondary/20 rounded-xl w-full shadow-inner">
      <div className="flex items-center justify-between w-full px-4 text-sm font-mono font-bold tracking-wider text-muted-foreground">
        <picture className="w-14 h-14">
          <img
            src={logo}
            alt="Quarzizus"
            className="w-full h-full object-contain"
          />
        </picture>
        {/*<span
          className={`px-2 py-0.5 rounded ${
            isGap
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary"
          }`}
        >
          {isGap ? "MUTE" : "ON"}
        </span>*/}
      </div>

      <div className="flex gap-3 justify-center flex-wrap py-4">
        {Array.from({ length: totalTicks }).map((_, i) => {
          const isMainBeat = i % subdivision === 0;
          const isActive = i === currentBeat;

          return (
            <div
              key={i}
              className={`
                transition-all duration-75 rounded-full
                ${isMainBeat ? "w-5 h-5" : "w-2 h-2 mt-1.5"}
                ${
                  isActive
                    ? isMainBeat
                      ? "bg-primary scale-125 shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                      : "bg-primary/80"
                    : isMainBeat
                      ? "bg-muted-foreground/20"
                      : "bg-muted-foreground/10"
                }
                ${
                  // isGap ? "opacity-20" : "opacity-100"
                  "opacity-100"
                }
              `}
            />
          );
        })}
      </div>
    </div>
  );
}
