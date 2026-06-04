interface PlayerChipProps {
  name: string;
  color: string;
  you?: boolean;
}

export function PlayerChip({ name, color, you }: PlayerChipProps) {
  return (
    <div
      className="card"
      style={{
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        borderColor: color,
        minWidth: 150,
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          flexShrink: 0,
          background: color,
          color: "#0a1100",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: 15,
        }}
      >
        {(name || "?")[0].toUpperCase()}
      </div>
      <div style={{ textAlign: "left" }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
        <div className="mono-label" style={{ color }}>
          {you ? "você" : "rival"}
        </div>
      </div>
    </div>
  );
}
