import type { PatternPreset } from "../../hooks/usePattern";

interface PatternSelectorProps {
  patternMode: "simple" | "advanced";
  selectedPresetId: string;
  presets: PatternPreset[];
  onPatternModeChange: (mode: "simple" | "advanced") => void;
  onPresetChange: (presetId: string) => void;
}

export function PatternSelector({
  patternMode,
  selectedPresetId,
  presets,
  onPatternModeChange,
  onPresetChange,
}: PatternSelectorProps) {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-muted-foreground uppercase">
          Patrón Rítmico
        </label>
        <div className="flex rounded-md overflow-hidden border bg-card shadow-sm">
          <button
            onClick={() => onPatternModeChange("simple")}
            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
              patternMode === "simple"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-secondary hover:text-secondary-foreground"
            }`}
          >
            Simple
          </button>
          <button
            onClick={() => onPatternModeChange("advanced")}
            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
              patternMode === "advanced"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-secondary hover:text-secondary-foreground"
            }`}
          >
            Avanzado
          </button>
        </div>
      </div>

      {patternMode === "advanced" && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground uppercase">
            Presets
          </label>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onPresetChange(preset.id)}
                className={`p-3 text-sm font-medium rounded-md border transition-colors text-left ${
                  selectedPresetId === preset.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card hover:bg-secondary border-border"
                }`}
              >
                <div className="font-medium">{preset.name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {preset.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}