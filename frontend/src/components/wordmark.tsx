import { SoundMark } from "./sound-mark";

interface WordmarkProps {
  size?: number;
  sub?: string;
}

export function Wordmark({ size = 20, sub }: WordmarkProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <SoundMark size={size * 1.6} live />
      <div style={{ lineHeight: 1 }}>
        <div
          style={{ fontWeight: 800, fontSize: size, letterSpacing: "-0.04em" }}
        >
          x1biu
        </div>
        {sub && (
          <div className="mono-label" style={{ marginTop: 4 }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}
