"use client";

interface PitchPoint {
  frame: number;
  hz: number;
}

const HZ_MIN = 500;
const HZ_MAX = 4000;
const W = 1000;
const H = 220;
const PAD = { top: 16, bottom: 24, left: 0, right: 0 };

function foldHz(hz: number): number {
  let h = hz;
  while (h < HZ_MIN) h *= 2;
  while (h >= HZ_MAX) h /= 2;
  return h;
}

function toY(hz: number): number {
  const norm = (foldHz(hz) - HZ_MIN) / (HZ_MAX - HZ_MIN);
  const drawH = H - PAD.top - PAD.bottom;
  return PAD.top + drawH - norm * drawH;
}

function buildPath(points: PitchPoint[], maxFrame: number): string {
  if (!points.length) return "";
  let path = "";
  let prev: PitchPoint | null = null;
  for (const p of points) {
    const x = (p.frame / maxFrame) * W;
    const y = toY(p.hz);
    if (!prev || p.frame - prev.frame > 8) {
      path += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
    } else {
      path += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    prev = p;
  }
  return path;
}

interface PitchChartProps {
  pitchRef: PitchPoint[];
  myData: PitchPoint[];
  opponentData: PitchPoint[];
  myLabel: string;
  opponentLabel: string;
}

export function PitchChart({ pitchRef, myData, opponentData, myLabel, opponentLabel }: PitchChartProps) {
  const maxFrame = Math.max(
    ...pitchRef.map((p) => p.frame),
    ...myData.map((p) => p.frame),
    ...opponentData.map((p) => p.frame),
    1,
  );

  const refPath = buildPath(pitchRef, maxFrame);
  const myPath = buildPath(myData, maxFrame);
  const opPath = buildPath(opponentData, maxFrame);

  // Y-axis labels (Hz values after fold)
  const yLabels = [500, 1000, 2000, 4000];

  return (
    <div style={{ width: "100%" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        {/* Grid lines */}
        {yLabels.map((hz) => {
          const y = toY(hz);
          return (
            <g key={hz}>
              <line x1={0} y1={y} x2={W} y2={y} stroke="var(--border)" strokeWidth="0.5" />
              <text x={8} y={y - 3} fontSize="11" fill="var(--faint)">{hz}Hz</text>
            </g>
          );
        })}

        {/* Reference (song melody) */}
        {refPath && (
          <path d={refPath} stroke="var(--border-2)" fill="none" strokeWidth="2"
            strokeDasharray="5 3" opacity="0.8" />
        )}

        {/* Opponent */}
        {opPath && (
          <path d={opPath} stroke="var(--rival)" fill="none" strokeWidth="2" opacity="0.7" />
        )}

        {/* Me */}
        {myPath && (
          <path d={myPath} stroke="var(--you)" fill="none" strokeWidth="2.5" />
        )}
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", gap: 20, fontSize: 12, marginTop: 8, color: "var(--muted)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "inline-block", width: 20, height: 2, background: "var(--you)" }} />
          {myLabel}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "inline-block", width: 20, height: 2, background: "var(--rival)", opacity: 0.7 }} />
          {opponentLabel}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "inline-block", width: 20, height: 2, background: "var(--border-2)", borderTop: "2px dashed var(--border-2)" }} />
          referência
        </span>
      </div>
    </div>
  );
}
