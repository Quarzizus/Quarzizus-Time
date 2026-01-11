interface SubdivisionSelectorProps {
  subdivision: number;
  handler: (n: number) => void;
  options: {
    label: string;
    value: number;
  }[];
}

export function SubdivisionSelector({
  subdivision,
  handler,
  options,
}: SubdivisionSelectorProps) {
  const createButton = (value: number) => (
    <button
      onClick={() => handler(value)}
      className={`flex-1 px-2 py-2 text-sm font-medium transition-colors ${
        subdivision === value
          ? "bg-primary text-primary-foreground"
          : "hover:bg-secondary"
      }`}
    >
      {value}
    </button>
  );

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-xs font-medium text-muted-foreground uppercase">
        Subdivisión
      </label>
      <div className="flex rounded-md overflow-hidden border bg-card shadow-sm">
        {options.map((option) => createButton(option.value))}
      </div>
    </div>
  );
}
