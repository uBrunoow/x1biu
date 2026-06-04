interface SoundMarkProps {
  size?: number;
  live?: boolean;
  color?: string;
}

export function SoundMark({
  size = 34,
  live = false,
  color = "var(--you)",
}: SoundMarkProps) {
  const bars = [0.45, 0.85, 0.6, 1, 0.5];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 9,
        border: "1px solid var(--border-2)",
        background: "var(--surface-2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: size * 0.07,
        position: "relative",
        flexShrink: 0,
      }}
    >
      {bars.map((h, i) => (
        <span
          key={i}
          style={{
            width: Math.max(2, size * 0.08),
            height: `${h * 52}%`,
            background: color,
            borderRadius: 2,
            transformOrigin: "center",
            animation: live
              ? `eq 0.9s ${i * 0.12}s ease-in-out infinite alternate`
              : "none",
            boxShadow: live ? `0 0 8px ${color}` : "none",
          }}
        />
      ))}
    </div>
  );
}
