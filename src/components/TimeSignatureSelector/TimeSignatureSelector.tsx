interface TimeSignatureSelectorProps {
  beatsPerBar: number;
  setBeatsPerBar: (n: number) => void;
}

export function TimeSignatureSelector({
  beatsPerBar,
  setBeatsPerBar,
}: TimeSignatureSelectorProps) {
  // 6 now represents 6/8, which we will handle logically as a special case
  const options = [
    { value: 2, label: "2/4" },
    { value: 3, label: "3/4" },
    { value: 4, label: "4/4" },
    // { value: 6, label: '6/8' }
  ];

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-xs font-medium text-muted-foreground uppercase">
        Compás
      </label>
      <div className="flex rounded-md overflow-hidden border bg-card shadow-sm">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setBeatsPerBar(opt.value)}
            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
              beatsPerBar === opt.value
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
