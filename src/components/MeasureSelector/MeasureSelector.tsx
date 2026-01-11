interface MeasureSelectorProps {
  measure: number;
  handleChangeMesure: (n: number) => void;
  options: {
    value: number;
    label: string;
  }[];
}

export function MeasureSelector({
  measure,
  handleChangeMesure,
  options,
}: MeasureSelectorProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-xs font-medium text-muted-foreground uppercase">
        Compás
      </label>
      <div className="flex rounded-md overflow-hidden border bg-card shadow-sm">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleChangeMesure(opt.value)}
            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
              measure === opt.value
                ? "bg-primary text-primary-foreground"
                : "hover:bg-secondary hover:text-secondary-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
