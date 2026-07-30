# How to Choose: Comparison and Decision Tree

## The most common mistake

Most people hear "real-time" and go straight to WebSocket. WebSocket is powerful, but it carries operational complexity that's frequently unnecessary. The right question isn't "which technology is more modern?" but "which one solves my problem at the lowest cost?"

---

## Detailed technical comparison

### Protocol overhead

```
Long Polling (per cycle):
- TCP handshake (if a new connection): ~3 RTTs
- HTTP headers: ~200-800 bytes per request/response
- One response with data + one empty = 2x overhead when there's nothing new

SSE (per event):
- Connection established once: ~3 RTTs initial
- Event: just the event's bytes + \n\n
- HTTP headers: only at establishment
- Keep-alive: `: keep-alive\n\n` = ~16 bytes every N seconds

WebSocket (per message):
- Handshake: ~3 RTTs + Upgrade overhead
- Frame overhead: 2-14 bytes per message (vs ~200-800 bytes of HTTP headers)
- Better for high-frequency small messages
```

### Infrastructure comparison

```
SSE:
✓ Works with any load balancer, no configuration needed
✓ Stateless: any server can receive the reconnection
✓ Works fine with HTTPS/corporate proxies
✗ Unidirectional (client uses a separate fetch to send)

WebSocket:
✓ Full-duplex, one connection for everything
✓ Lower overhead per message at high frequency
✗ Pub/sub between instances needed for horizontal scale
✗ Some corporate proxies block it
✗ Stateful: reconnection needs to re-establish context
```

---

## Decision tree

```
Need real-time communication?
│
├── Does data arrive at regular, predictable intervals?
│   └── YES ──► Short Polling (simple, predictable, easy to reason about)
│
├── Does data flow mostly Server → Client?
│   └── YES ──► SSE
│       ├── Need authentication with custom headers?
│       │   └── YES ──► fetch + ReadableStream (SSE superset)
│       └── No ──► EventSource (simpler, automatic reconnection)
│
├── Need low-latency bidirectional communication?
│   └── YES ──► WebSocket
│       ├── Already using GraphQL?
│       │   └── YES ──► GraphQL Subscriptions
│       ├── Microservices / non-browser?
│       │   └── YES ──► gRPC Streaming
│       └── No ──► Plain WebSocket or Socket.io
│
├── Need video/voice or P2P?
│   └── YES ──► WebRTC
│
└── Can you wait for broader adoption?
    └── YES ──► WebTransport (QUIC, next generation)
```

---

## Real-world use cases and the right choice

### Chat (Slack-like, WhatsApp Web)

**WebSocket** — bidirectional, the user types and receives messages. But note: WhatsApp Web uses a Long Polling variant with BOSH (XMPP over HTTP) in some contexts. The "right answer" sometimes surprises.

### Push notifications (GitHub-like, Jira-like)

**SSE** — the server sends alerts, the client doesn't need to respond over the same channel. Automatic reconnection is ideal here.

### Monitoring dashboard (Datadog-like, Grafana-like)

**SSE** or **WebSocket** depending on volume. Grafana uses WebSocket. A simple dashboard with 10 metrics: SSE works perfectly.

### Live collaboration (Google Docs-like, Figma-like)

**WebSocket** — multiple cursors, simultaneous edits, user presence. Bidirectionality is fundamental. Figma specifically uses a custom binary protocol over WebSocket.

### LLM streaming (ChatGPT-like, Claude-like)

**SSE** — the model generates tokens and the server sends them as they're generated. Unidirectional by nature. This is exactly what the OpenAI API and the Anthropic API use.

### Video calling

**WebRTC** — no debate.

### Live scoreboard (ESPN-like, globo.com-like)

**SSE** — server pushes updates, client just displays them. Simple, robust, scales well.

### High-frequency trading

**WebSocket** with a custom binary protocol, or even UDP with a proprietary protocol. Latency matters more than reliability here.

---

## The conversation you don't want to have with ops

Before choosing WebSocket in production, think about:

1. Does your load balancer support sticky sessions? What's the operational cost?
2. How will you deploy without dropping open connections? (graceful shutdown)
3. When the server restarts, how will clients know they need to reconnect and re-establish state?
4. How will you debug it? (WebSocket doesn't show up in the DevTools Network panel the same way HTTP requests do)
5. If you scale to 3 instances, how does one instance send a message to a client connected to another?

SSE solves 1-3 automatically (it's stateless HTTP, automatic reconnection with Last-Event-ID). 4 and 5 still exist, but are smaller.

---

## Socket.io — when the abstraction is worth the cost

Socket.io comes up in nearly every WebSocket discussion, so it's worth a clear position: it's not WebSocket, it's an abstraction over WebSocket (with a fallback to long polling when WebSocket isn't available).

What it adds over plain WebSocket:

- **Automatic reconnection with backoff** — which native WebSocket doesn't have
- **Rooms and namespaces** — logical grouping of connections without you implementing it
- **Origin verification by default** — mitigates the CSRF problem covered in the security module
- **Named events** — instead of a single channel, you get `socket.emit('message', data)` and `socket.on('message', handler)`
- **Easy broadcast** — `io.to('room').emit(...)` without managing the list manually

The cost: it's a non-trivial dependency (~30KB minified on the client), it adds its own protocol on top of WebSocket (the first bytes of every message are Socket.io metadata), and it creates coupling — client and server both need to use Socket.io.

It makes sense when you need rooms, group broadcast, or want automatic reconnection without implementing it. It doesn't make sense when you have full control over the server and infra, or when protocol performance matters (that metadata overhead adds up at high frequency).

A practical note: a lot of legacy code uses Socket.io not because it needed the features, but because it was the easiest tutorial to find in 2015. In 2025, native WebSocket with a simple reconnection library solves the same problem with fewer layers.

---

## The case for "SSE first"

The default recommendation should be: start with SSE. If you hit a real limitation — genuine low-latency bidirectionality, high-frequency binary data, the need for subprotocols — then evaluate WebSocket.

Most applications never hit that limitation. And there's a data point that illustrates this well: ChatGPT, Claude, Copilot, Gemini — every major LLM product uses SSE for token streaming. These are systems with tens of millions of simultaneous connections, built by engineers who had WebSocket as an option, and chose SSE. Not by accident: the flow is unidirectional by nature, automatic reconnection with Last-Event-ID is valuable, and the operational simplicity of plain HTTP scales without friction.

The choice of real-time technology isn't about what's most impressive — it's about what solves the problem at the lowest total cost: of implementation, of operation, and of maintenance.
