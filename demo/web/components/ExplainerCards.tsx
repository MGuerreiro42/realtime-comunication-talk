export function ExplainerCards() {
  return (
    <div className="explainer">
      <div className="exp-card polling-c">
        <h3>Polling</h3>
        <ul>
          <li>
            <strong>How it works:</strong> client calls GET every N seconds
          </li>
          <li>
            <strong>Connections:</strong> 1 new per tick
          </li>
          <li>
            <strong>Latency:</strong> up to N seconds
          </li>
          <li>
            <strong>Overhead:</strong> high — requests even without new data
          </li>
          <li>
            <strong>Use case:</strong> simple dashboards, maximum compatibility
          </li>
        </ul>
      </div>
      <div className="exp-card longpoll-c">
        <h3>Long Polling</h3>
        <ul>
          <li>
            <strong>How it works:</strong> client opens a request, server holds it until there&apos;s data
          </li>
          <li>
            <strong>Connections:</strong> 1 per event (reconnects automatically)
          </li>
          <li>
            <strong>Latency:</strong> near zero — responds as soon as there&apos;s data
          </li>
          <li>
            <strong>Overhead:</strong> medium — reconnects on every event
          </li>
          <li>
            <strong>Use case:</strong> chat, notifications (pre-SSE/WS)
          </li>
        </ul>
      </div>
      <div className="exp-card sse-c">
        <h3>Server-Sent Events</h3>
        <ul>
          <li>
            <strong>How it works:</strong> persistent HTTP stream, server → client
          </li>
          <li>
            <strong>Connections:</strong> a single one (browser auto-reconnects)
          </li>
          <li>
            <strong>Latency:</strong> near zero
          </li>
          <li>
            <strong>Overhead:</strong> low — HTTP headers only once
          </li>
          <li>
            <strong>Use case:</strong> live feeds, logs, push notifications
          </li>
        </ul>
      </div>
      <div className="exp-card ws-c">
        <h3>WebSocket</h3>
        <ul>
          <li>
            <strong>How it works:</strong> full-duplex TCP upgrade (ws://)
          </li>
          <li>
            <strong>Connections:</strong> a single persistent one
          </li>
          <li>
            <strong>Latency:</strong> minimal — binary frames
          </li>
          <li>
            <strong>Overhead:</strong> very low after handshake
          </li>
          <li>
            <strong>Use case:</strong> games, live collaboration, trading, chat
          </li>
        </ul>
      </div>
    </div>
  );
}
