interface PitchMeterProps {
  target: number;
  value: number;
  color: string;
  glow: string;
  label: string;
  score?: number;
  big?: boolean;
}

export function PitchMeter({
  target,
  value,
  color,
  glow,
  label,
  score,
  big,
}: PitchMeterProps) {
  const onTarget = Math.abs(target - value) < 0.08;
  const H = big ? 320 : 260;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        flex: 1,
      }}
    >
      <div
        style={{
          position: "relative",
          width: 74,
          height: H,
          background: "var(--bg-2)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {[0.2, 0.4, 0.6, 0.8].map((t) => (
          <div
            key={t}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: `${(1 - t) * 100}%`,
              borderTop: "1px dashed var(--border-2)",
              opacity: 0.5,
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            left: 6,
            right: 6,
            top: `${(1 - target) * 100}%`,
            height: 3,
            marginTop: -1.5,
            background: "var(--muted)",
            borderRadius: 3,
            opacity: 0.9,
            boxShadow: "0 0 0 6px rgba(150,156,167,0.07)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${(1 - target) * 100}%`,
            height: 14,
            marginTop: -7,
            background: "rgba(150,156,167,0.10)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: `${value * 100}%`,
            background: `linear-gradient(to top, ${color}22, ${color}05)`,
            transition: "height .09s linear",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 4,
            right: 4,
            top: `${(1 - value) * 100}%`,
            height: 6,
            marginTop: -3,
            background: color,
            borderRadius: 4,
            boxShadow: onTarget ? `0 0 14px 2px ${glow}` : "none",
            transition: "top .09s linear, box-shadow .15s ease",
          }}
        />
      </div>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontWeight: 800,
            fontSize: 13,
            color,
            letterSpacing: "0.04em",
          }}
        >
          {label}
        </div>
        {score != null && (
          <div
            style={{
              fontSize: 26,
              fontWeight: 800,
              marginTop: 2,
              letterSpacing: "-0.04em",
            }}
          >
            {Math.round(score).toLocaleString("pt-BR")}
          </div>
        )}
      </div>
    </div>
  );
}
