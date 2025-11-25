interface SubdivisionSelectorProps {
  subdivision: number;
  setSubdivision: (n: number) => void;
}

export function SubdivisionSelector({
  subdivision,
  setSubdivision,
}: SubdivisionSelectorProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-xs font-medium text-muted-foreground uppercase">
        Subdivisión
      </label>
      <div className="flex rounded-md overflow-hidden border bg-card shadow-sm">
        <button
          onClick={() => setSubdivision(1)}
          className={`flex-1 px-2 py-2 text-sm font-medium transition-colors ${
            subdivision === 1
              ? "bg-primary text-primary-foreground"
              : "hover:bg-secondary"
          }`}
        >
          1/1
        </button>
        <button
          onClick={() => setSubdivision(2)}
          className={`flex-1 px-2 py-2 text-sm font-medium transition-colors ${
            subdivision === 2
              ? "bg-primary text-primary-foreground"
              : "hover:bg-secondary"
          }`}
        >
          2/2
        </button>
        <button
          onClick={() => setSubdivision(3)}
          className={`flex-1 px-2 py-2 text-sm font-medium transition-colors ${
            subdivision === 3
              ? "bg-primary text-primary-foreground"
              : "hover:bg-secondary"
          }`}
        >
          3/3
        </button>
      </div>
    </div>
  );
}
