export function cpToPercent(cp: number): number {
  const clamped = Math.max(-1000, Math.min(1000, cp));
  return 50 + (clamped / 1000) * 45;
}

interface EvalBarProps {
  evalPercent: number;
  isWhiteBottom: boolean;
  evalText: string;
  className?: string;
}

function EvalBar({
  evalPercent,
  isWhiteBottom,
  evalText,
  className,
}: EvalBarProps) {
  const whiteHeight = evalPercent;
  return (
    <div className={`flex flex-col items-center gap-1 h-full ${className}`}>
      <div
        className={`w-4 flex-1 rounded-sm overflow-hidden border border-white/10 bg-[#020202] flex relative ${
          isWhiteBottom ? "flex-col-reverse" : "flex-col"
        }`}
      >
        <div
          className={`w-full bg-[#F4F4F5]`}
          style={{
            height: `${whiteHeight}%`,
          }}
        />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums tracking-wider">
        {evalText}
      </span>
    </div>
  );
}

export default EvalBar;
