import type { ReactNode } from "react";

export type DotState = "" | "connected" | "disconnected" | "waiting";

const dotStateClasses: Record<DotState, string> = {
  "": "bg-[#334155]",
  connected: "bg-[#22c55e] shadow-[0_0_6px_#22c55e88]",
  disconnected: "bg-[#ef4444]",
  waiting: "bg-[#f59e0b] animate-pulse-dot",
};

export function StatusRow({
  state,
  label,
  children,
}: {
  state: DotState;
  label: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 px-5 py-[0.6rem] border-b border-[#1e2535] text-[0.8rem]">
      <div
        className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-300 ${dotStateClasses[state]}`}
      />
      <span>{label}</span>
      {children}
    </div>
  );
}
