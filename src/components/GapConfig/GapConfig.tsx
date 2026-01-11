interface Props {
  handleGap: () => void;
  handleOff: (value: number) => void;
  handleOn: (value: number) => void;
  gapEnabled: boolean;
  measuresOn: number;
  measuresOff: number;
}

const ON_OPTIONS = [1, 2, 3, 4];
const OFF_OPTIONS = [1, 2, 3, 4];

export function GapConfig({
  handleGap,
  handleOff,
  handleOn,
  gapEnabled,
  measuresOn,
  measuresOff,
}: Props) {
  return (
    <div className="flex flex-col gap-4 p-4 border rounded-xl bg-card shadow-sm w-full">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={handleGap}
      >
        <label className="text-sm font-medium uppercase tracking-wider cursor-pointer">
          Gap Trainer
        </label>
        <div
          className={`w-11 h-6 rounded-full p-1 transition-colors ${
            gapEnabled ? "bg-primary" : "bg-muted"
          }`}
        >
          <div
            className={`w-4 h-4 bg-background rounded-full shadow-sm transform transition-transform duration-200 ${
              gapEnabled ? "translate-x-5" : ""
            }`}
          />
        </div>
      </div>

      <div
        className={`grid grid-cols-2 gap-4 transition-opacity duration-200 ${
          gapEnabled ? "opacity-100" : "opacity-50 pointer-events-none"
        }`}
      >
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground font-medium">
            PLAY (COMPASES)
          </span>
          <div className="flex rounded-md overflow-hidden border bg-card">
            {ON_OPTIONS.map((value) => (
              <button
                key={value}
                onClick={() => handleOn(value)}
                className={`flex-1 px-2 py-2 text-sm font-medium transition-colors ${
                  measuresOn === value
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-secondary"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground font-medium">
            MUTE (COMPASES)
          </span>
          <div className="flex rounded-md overflow-hidden border bg-card">
            {OFF_OPTIONS.map((value) => (
              <button
                key={value}
                onClick={() => handleOff(value)}
                className={`flex-1 px-2 py-2 text-sm font-medium transition-colors ${
                  measuresOff === value
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-secondary"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
