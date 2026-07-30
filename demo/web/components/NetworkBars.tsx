import { NETWORK_BARS, TECHNIQUE_STYLES, type BarConfig, type Technique } from "@/lib/constants";

export type ConnectionCounts = Record<Technique, number>;

function pct(n: number): string {
  return `${Math.min((n / 60) * 100, 100)}%`;
}

function countLabel(unit: BarConfig["unit"], count: number): string {
  if (unit === "requests") return `${count} requests`;
  return count > 0 ? "1 connection open" : "0 connections open";
}

function RequestBar({ config, count }: { config: BarConfig; count: number }) {
  const barFill = TECHNIQUE_STYLES[config.technique].barFill;
  return (
    <div className="bg-[#161b27] border border-[#1e2535] rounded-lg px-4 py-3">
      <label className="text-[0.75rem] text-[#64748b] block mb-1.5">{config.label}</label>
      <div className="bg-[#1e2535] rounded h-2 overflow-hidden">
        <div
          className={`h-full rounded transition-[width] duration-[400ms] ease-in-out ${barFill}`}
          style={{ width: pct(count) }}
        />
      </div>
      <div className="text-[0.75rem] text-[#475569] mt-1">{countLabel(config.unit, count)}</div>
    </div>
  );
}

export function NetworkBars({ counts }: { counts: ConnectionCounts }) {
  return (
    <div className="max-w-[1400px] mx-auto mb-4 px-6">
      <h2 className="text-[1rem] font-semibold text-[#94a3b8] mb-3">
        Accumulated HTTP requests (only Polling and Long Polling create a new request per event)
      </h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
        {NETWORK_BARS.map((config) => (
          <RequestBar key={config.technique} config={config} count={counts[config.technique]} />
        ))}
      </div>
    </div>
  );
}
