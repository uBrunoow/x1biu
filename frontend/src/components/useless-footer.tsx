interface UselessFooterProps {
  note?: string;
}

export function UselessFooter({ note }: UselessFooterProps) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "12px",
        fontSize: 11.5,
        color: "var(--faint)",
        borderTop: "1px solid var(--border)",
        flexShrink: 0,
      }}
    >
      {note ??
        "x1biu · um projeto orgulhosamente inútil · 0 problemas resolvidos"}
    </div>
  );
}
