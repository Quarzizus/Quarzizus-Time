interface TapTempoButtonProps {
  onTap: () => void;
}

export function TapTempoButton({ onTap }: TapTempoButtonProps) {
  return (
    <button
      onMouseDown={onTap} // Use onMouseDown for faster response
      className="w-full py-4 mt-2 bg-secondary/30 hover:bg-secondary active:bg-primary/10 rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 transition-all flex flex-col items-center justify-center gap-1 group select-none"
    >
      <span className="text-xs font-bold text-muted-foreground group-hover:text-primary uppercase tracking-widest">
        Tap Tempo
      </span>
      <span className="text-[10px] text-muted-foreground/50">
        Haz clic rítmicamente
      </span>
    </button>
  );
}
