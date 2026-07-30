import { NETWORK_BARS, TECHNIQUE_STYLES, type Technique } from "@/lib/constants";

function pct(n: number): string {
  return `${Math.min((n / 60) * 100, 100)}%`;
}

function countLabel(unit: "requests" | "connection", count: number): string {
  if (unit === "requests") return `${count} requests`;
  return count > 0 ? "1 connection open" : "0 connections open";
}

export function RequestBar({ technique, count }: { technique: Technique; count: number }) {
  const { label, unit } = NETWORK_BARS[technique];
  const barFill = TECHNIQUE_STYLES[technique].barFill;

  return (
    <div className="bg-[#161b27] border border-[#1e2535] rounded-lg px-4 py-3">
      <label className="text-[0.75rem] text-[#64748b] block mb-1.5">{label}</label>
      <div className="bg-[#1e2535] rounded h-2 overflow-hidden">
        <div
          className={`h-full rounded transition-[width] duration-[400ms] ease-in-out ${barFill}`}
          style={{ width: pct(count) }}
        />
      </div>
      <div className="text-[0.75rem] text-[#475569] mt-1">{countLabel(unit, count)}</div>
    </div>
  );
}
