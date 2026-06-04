interface AccuracyRingProps {
  pct: number;
  color: string;
  size?: number;
}

export function AccuracyRing({ pct, color, size = 92 }: AccuracyRingProps) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--border-2)"
        strokeWidth="6"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (pct / 100) * c}
        style={{
          transition: "stroke-dashoffset .4s ease",
          filter: `drop-shadow(0 0 5px ${color})`,
        }}
      />
    </svg>
  );
}
