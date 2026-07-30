# Beyond the Basics: WebRTC, gRPC Streaming, GraphQL Subscriptions, and WebTransport

## Why mention these technologies

WebSocket and SSE solve most cases. But understanding where they fit (and where they don't) is a sign of technical maturity.

---

## WebRTC — Peer-to-Peer on the Web

### What it is

WebRTC (Web Real-Time Communication) is an API and protocol that enables direct communication between browsers, without the data going through a server. It's the technology behind Google Meet, Discord in the browser, and any web video call.

### How it works

```
WebSocket/SSE model:
Client A ──► Server ──► Client B

WebRTC model (after establishing the connection):
Client A ◄────────────────► Client B
         (direct P2P connection)
```

The server is still needed for the *signaling* phase — the peers need to exchange metadata (ICE candidates, SDP offers) to discover each other and negotiate the connection. After that, data flows directly.

### Protocols underneath

```
WebRTC uses:
- DTLS (TLS over UDP) for encryption
- SRTP for media (audio/video)
- SCTP over DTLS for data (data channels)
- ICE/STUN/TURN for NAT traversal
```

**STUN**: discovers the client's public IP behind NAT
**TURN**: fallback relay when direct P2P isn't possible (symmetric NATs, firewalls)
**ICE**: orchestrates STUN/TURN to find the best path

### When to use it

- Video calls and audio/video streaming
- P2P file transfer
- Games with extremely low latency requirements
- Any case where you want to avoid sensitive data passing through the server

### When *not* to use it

WebRTC has significant implementation complexity — NAT traversal, fallbacks, codec negotiation, reconnection. For cases that don't need P2P or video-grade latency, it's overkill.

---

## gRPC Streaming — HTTP/2 for microservices

### What it is

gRPC is a Google RPC (Remote Procedure Call) framework that uses HTTP/2 as transport and Protocol Buffers for serialization. It supports four communication modes:

```protobuf
service ChatService {
  // Unary (normal req/response)
  rpc GetMessage (MessageRequest) returns (Message);

  // Server streaming (server sends multiple responses)
  rpc WatchMessages (WatchRequest) returns (stream Message);

  // Client streaming (client sends multiple requests)
  rpc SendBatch (stream MessageRequest) returns (BatchResult);

  // Bidirectional streaming (full-duplex)
  rpc Chat (stream ChatMessage) returns (stream ChatMessage);
}
```

### Why it's relevant to real-time

Server streaming and bidirectional streaming are forms of real-time communication over HTTP/2. With Protocol Buffers, serialization overhead is minimal compared to JSON.

### The limitation on the web

Standard gRPC doesn't work in the browser. The browser doesn't expose low-level HTTP/2 APIs sufficient for it. The solution is **gRPC-Web**, which uses a proxy (Envoy, for example) to convert between gRPC-Web (which the browser can do) and real gRPC.

### When to use it

gRPC streaming is the natural choice when:
- You already use gRPC for communication between microservices
- Serialization performance matters (Protocol Buffers vs JSON)
- A strong contract via `.proto` files is desirable
- The client isn't the browser (native mobile, backend-to-backend, CLI tools)

---

## GraphQL Subscriptions — An abstraction over WebSocket

### What it is

GraphQL Subscriptions is a GraphQL spec feature that lets the client subscribe to events. The most common implementation uses WebSocket underneath (the `graphql-ws` library or the legacy `subscriptions-transport-ws`).

```graphql
subscription {
  messageAdded(roomId: "general") {
    id
    text
    author {
      name
      avatar
    }
  }
}
```

### How it works

```
Client ──► WebSocket ──► GraphQL Subscription Server
                         (resolves the subscription, connects to pub/sub)

Event happens ──► pub/sub ──► server resolves and filters ──► client
```

### What it adds over plain WebSocket

- **Typing and schema**: incoming data has a known, validated shape
- **Server-side filtering**: the client declares exactly which fields it wants
- **Integration with the data graph**: subscriptions can resolve relationships (like `author` in the example above)
- **Tooling**: GraphiQL, Apollo DevTools, TypeScript type generation

### Cost

All the complexity of WebSocket + all the complexity of GraphQL. It makes sense when you already use GraphQL — adding subscriptions is natural. From scratch, just for real-time, it's over-engineered.

---

## WebTransport — The Future (and already present)

### What it is

WebTransport is an experimental W3C API (supported in Chrome and Firefox, not yet Safari) that uses QUIC as transport. It's a modern alternative to WebSocket designed for HTTP/3.

```javascript
const transport = new WebTransport('https://example.com/wt');
await transport.ready;

// Bidirectional streams (like WebSocket)
const stream = await transport.createBidirectionalStream();
const writer = stream.writable.getWriter();
await writer.write(new Uint8Array([1, 2, 3]));

// Datagrams (like UDP — no delivery guarantee, no ordering)
const writer = transport.datagrams.writable.getWriter();
await writer.write(new Uint8Array([1, 2, 3]));
```

### What's different about it

- **Datagrams**: sending with no order or delivery guarantee (ideal for games, telemetry where stale data is useless)
- **Multiple independent streams**: no head-of-line blocking between streams (inherited from QUIC)
- **Connection migration**: switches networks without reconnecting

### Current status

Supported in Chrome and Firefox. Safari has no support (as of 2024). For production, it's still early — but it's the direction WebSocket will likely follow.

---

## Summary: where each one fits

| Technology | Transport | Direction | Latency | Use case |
|---|---|---|---|---|
| Long Polling | HTTP/1.1 | S→C | ~100ms+ | Fallback, legacy systems |
| SSE | HTTP | S→C | ~50ms | Notifications, feeds, LLM streaming |
| WebSocket | TCP | Bidirectional | ~10ms | Chat, games, collaboration |
| WebRTC | UDP (DTLS) | P2P | ~5ms | Video, voice, P2P |
| gRPC Streaming | HTTP/2 | Both | ~10ms | Microservices, non-browser |
| WebTransport | QUIC | Both + datagrams | ~5ms | Next generation |
