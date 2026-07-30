export interface ConnectionCounts {
  polling: number;
  longPoll: number;
  sse: number;
  ws: number;
}

function pct(n: number): string {
  return `${Math.min((n / 60) * 100, 100)}%`;
}

function RequestBar({
  label,
  count,
  colorClassName,
  countLabel,
}: {
  label: string;
  count: number;
  colorClassName: string;
  countLabel: string;
}) {
  return (
    <div className="bg-[#161b27] border border-[#1e2535] rounded-lg px-4 py-3">
      <label className="text-[0.75rem] text-[#64748b] block mb-1.5">{label}</label>
      <div className="bg-[#1e2535] rounded h-2 overflow-hidden">
        <div
          className={`h-full rounded transition-[width] duration-[400ms] ease-in-out ${colorClassName}`}
          style={{ width: pct(count) }}
        />
      </div>
      <div className="text-[0.75rem] text-[#475569] mt-1">{countLabel}</div>
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
        <RequestBar
          label="Polling"
          count={counts.polling}
          colorClassName="bg-[#3b82f6]"
          countLabel={`${counts.polling} requests`}
        />
        <RequestBar
          label="Long Polling"
          count={counts.longPoll}
          colorClassName="bg-[#a855f7]"
          countLabel={`${counts.longPoll} requests`}
        />
        <RequestBar
          label="SSE (1 connection)"
          count={counts.sse}
          colorClassName="bg-[#22c55e]"
          countLabel={counts.sse > 0 ? "1 connection open" : "0 connections open"}
        />
        <RequestBar
          label="WebSocket (1 connection)"
          count={counts.ws}
          colorClassName="bg-[#f59e0b]"
          countLabel={counts.ws > 0 ? "1 connection open" : "0 connections open"}
        />
      </div>
    </div>
  );
}
