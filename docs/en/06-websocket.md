# WebSocket — True Full-Duplex

## What it is

WebSocket is a bidirectional, full-duplex communication protocol that operates over a single persistent TCP connection. RFC 6455 was standardized in 2011. Unlike SSE, WebSocket isn't HTTP — it starts as HTTP (the handshake) and then *switches protocols*.

---

## The upgrade handshake

A WebSocket connection starts with a special HTTP request:

```http
GET /ws HTTP/1.1
Host: example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```

The server responds with 101 Switching Protocols:

```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

From this point on, the TCP connection is "hijacked" by the WebSocket protocol. HTTP no longer exists on this connection.

```
Before upgrade:  [TCP] ──► [HTTP]
After upgrade:   [TCP] ──► [WebSocket frames]
```

---

## The frame protocol

WebSocket transmits **frames**, not HTTP text. Each frame has:

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-------+-+-------------+-------------------------------+
|F|R|R|R| opcode|M| Payload len |    Extended payload length    |
|I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
|N|V|V|V|       |S|             |   (if payload len==126/127)   |
| |1|2|3|       |K|             |                               |
+-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - -+
```

Important opcodes:
- `0x1` — text frame
- `0x2` — binary frame
- `0x8` — close
- `0x9` — ping
- `0xA` — pong

Client-to-server frames are always masked (XOR with a random key) — a security measure against cache poisoning in HTTP proxies.

---

## Client API

```javascript
const ws = new WebSocket('wss://example.com/ws');

ws.onopen = () => {
  console.log('connected');

  // Send text
  ws.send(JSON.stringify({ type: 'join', room: 'general' }));

  // Send binary
  const buffer = new ArrayBuffer(8);
  ws.send(buffer);
};

ws.onmessage = (event) => {
  if (typeof event.data === 'string') {
    const msg = JSON.parse(event.data);
    handleMessage(msg);
  } else {
    // ArrayBuffer or Blob (binary)
    handleBinary(event.data);
  }
};

ws.onclose = (event) => {
  console.log(`closed: ${event.code} - ${event.reason}`);
  // Reconnection is NOT automatic — you need to implement it
  setTimeout(reconnect, 3000);
};

ws.onerror = (error) => {
  console.error('WebSocket error', error);
};

// Close with a code
ws.close(1000, 'session ended normally');
```

---

## WebSocket is stateful — that changes everything about infra

Unlike HTTP, where any server can answer any request, a WebSocket connection is tied to one server instance. This has serious implications:

**Sticky sessions are mandatory**: your load balancer needs to guarantee a client always lands on the same server. If that server goes down, the connection drops.

**Horizontal scaling is complex**: for server A to send a message to a client connected to server B, you need a pub/sub mechanism between instances (Redis Pub/Sub, NATS, etc).

```
Client 1 ──► Server A
Client 2 ──► Server B

Server A wants to broadcast a message to everyone?
Server A ──► Redis (PUBLISH) ──► Server B (SUBSCRIBE) ──► Client 2
```

---

## WebSocket server (Node.js with ws)

```javascript
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`client connected: ${ip}`);

  // Heartbeat: detect zombie connections
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', (data, isBinary) => {
    if (isBinary) {
      handleBinary(ws, data);
    } else {
      const msg = JSON.parse(data.toString());
      handleMessage(ws, msg);
    }
  });

  ws.on('close', (code, reason) => {
    cleanup(ws);
  });
});

// Ping every 30s to detect dead connections
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => clearInterval(interval));
```

---

## Subprotocols and extensions

WebSocket supports subprotocols negotiated during the handshake:

```http
Sec-WebSocket-Protocol: chat, superchat
```

Examples of subprotocols:
- **STOMP** (Simple Text Oriented Messaging Protocol) — widely used with Spring/Java
- **MQTT over WebSocket** — IoT
- **GraphQL over WebSocket** (graphql-ws) — subscriptions

Extensions:
- **permessage-deflate** — per-message compression (significantly reduces bandwidth)

---

## Reconnection — you're responsible for it

Unlike EventSource, WebSocket doesn't reconnect automatically. You need to implement reconnection with exponential backoff:

```javascript
function createWebSocket(url) {
  const ws = new WebSocket(url);
  let retries = 0;

  ws.onclose = () => {
    const delay = Math.min(1000 * Math.pow(2, retries), 30000);
    retries++;
    console.log(`reconnecting in ${delay}ms`);
    setTimeout(() => createWebSocket(url), delay);
  };

  ws.onopen = () => { retries = 0; };

  return ws;
}
```

---

## When WebSocket is the right choice

WebSocket is necessary when:
- Low-latency bidirectional communication is fundamental (games, live collaboration, trading)
- You need to send binary data without encoding overhead
- High-frequency messaging in both directions (more efficient than SSE + parallel fetches)
- You need subprotocols (STOMP, MQTT)

WebSocket is overkill when:
- Data flows mostly server → client
- Automatic reconnection matters
- You're behind corporate infrastructure with restrictive proxies
- Operational simplicity matters more than performance
