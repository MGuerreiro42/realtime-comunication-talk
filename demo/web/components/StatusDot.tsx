export type DotState = "" | "connected" | "disconnected" | "waiting";

export function StatusRow({
  state,
  label,
  children,
}: {
  state: DotState;
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="status-row">
      <div className={`dot ${state}`} />
      <span>{label}</span>
      {children}
    </div>
  );
}
