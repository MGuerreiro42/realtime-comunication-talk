export interface ConnectionCounts {
  polling: number;
  longPoll: number;
  sse: number;
  ws: number;
}

function pct(n: number): string {
  return `${Math.min((n / 60) * 100, 100)}%`;
}

export function NetworkBars({ counts }: { counts: ConnectionCounts }) {
  return (
    <div className="network-viz">
      <h2>
        Accumulated HTTP requests (only Polling and Long Polling create a new request per event)
      </h2>
      <div className="req-bars">
        <div className="req-bar-wrap">
          <label>Polling</label>
          <div className="req-bar-track">
            <div className="req-bar-fill polling-bar" style={{ width: pct(counts.polling) }} />
          </div>
          <div className="req-bar-count">{counts.polling} requests</div>
        </div>
        <div className="req-bar-wrap">
          <label>Long Polling</label>
          <div className="req-bar-track">
            <div className="req-bar-fill longpoll-bar" style={{ width: pct(counts.longPoll) }} />
          </div>
          <div className="req-bar-count">{counts.longPoll} requests</div>
        </div>
        <div className="req-bar-wrap">
          <label>SSE (1 connection)</label>
          <div className="req-bar-track">
            <div className="req-bar-fill sse-bar" style={{ width: pct(counts.sse) }} />
          </div>
          <div className="req-bar-count">
            {counts.sse > 0 ? "1 connection open" : "0 connections open"}
          </div>
        </div>
        <div className="req-bar-wrap">
          <label>WebSocket (1 connection)</label>
          <div className="req-bar-track">
            <div className="req-bar-fill ws-bar" style={{ width: pct(counts.ws) }} />
          </div>
          <div className="req-bar-count">
            {counts.ws > 0 ? "1 connection open" : "0 connections open"}
          </div>
        </div>
      </div>
    </div>
  );
}
