# HTTP/3 and QUIC — Replacing the Ground

## What was left unsolved

HTTP/2 solved multiplexing at the application layer, but didn't touch the transport. All streams still share a single TCP connection — and TCP was designed in 1974 for a different network, with different assumptions. HTTP/3 solves this by abandoning TCP entirely.

---

## The radical change: replacing TCP with QUIC

QUIC is a transport protocol implemented on top of UDP that reimplements reliability, flow control, and multiplexing from scratch — with the lessons of the last 50 years of TCP.

```
HTTP/1.1:  [HTTP] ──► [TCP] ──► [IP]
HTTP/2:    [HTTP] ──► [TCP] ──► [IP]    (same transport stack)
HTTP/3:    [HTTP] ──► [QUIC] ──► [UDP] ──► [IP]
```

---

## Why UDP as a foundation?

UDP is unreliable by design — it doesn't guarantee delivery, order, or integrity. That sounds like a regression, but it's exactly what gives QUIC the freedom to implement reliability more intelligently than TCP does.

TCP is reliable per-connection. If a packet is lost, the whole connection stalls until it's retransmitted — every HTTP/2 stream blocks.

QUIC is reliable per-stream. If a packet from Stream 1 is lost, only Stream 1 waits for the retransmission. Streams 2, 3, 4 keep flowing normally.

```
HTTP/2 over TCP — packet loss:
Stream 1: ──────── ✗ packet lost ──── ⏳ blocked
Stream 2: ──────────────────────────── ⏳ blocked (no fault of its own)
Stream 3: ──────────────────────────── ⏳ blocked (no fault of its own)

HTTP/3 over QUIC — same loss:
Stream 1: ──────── ✗ packet lost ──── ⏳ retransmitting
Stream 2: ──────────────────────────────────────► continues
Stream 3: ──────────────────────────────────────► continues
```

Head-of-line blocking truly solved, at the transport level.

---

## 0-RTT Handshake

TCP + TLS 1.3 requires at least 1 RTT for TCP and 1 RTT for TLS before any application data can flow:

```
Client                            Server
  │─── SYN ────────────────────────►│
  │◄── SYN-ACK ─────────────────────│   TCP: 1 RTT
  │─── ACK + ClientHello ──────────►│
  │◄── ServerHello + Certificate ───│   TLS: 1 RTT
  │─── Finished ───────────────────►│
  │◄── [application data] ──────────│
```

QUIC bakes the cryptographic handshake into the protocol itself. On a new session: 1 RTT. On reconnection with a prior session: **0-RTT** — the client already has the cryptographic parameters from the previous session and sends data in the very first packet.

For SSE and WebSocket, this reduces reconnection cost — especially relevant on mobile, where reconnections are frequent.

---

## Connection Migration

TCP connections are identified by the `source IP:source port` pair. When you switch from Wi-Fi to 4G, your IP changes — the TCP connection is torn down and has to be re-established from scratch.

QUIC connections are identified by an opaque **Connection ID**, chosen by the client. When the network changes and the IP changes, the Connection ID stays the same. QUIC detects the path change and keeps the connection going without interruption.

For real-time mobile applications, this matters: an SSE or WebSocket reconnection over TCP pays the full handshake cost. Over QUIC, the transition is transparent.

---

## Combined impact on real-time

| | HTTP/1.1 | HTTP/2 | HTTP/3 / QUIC |
|---|---|---|---|
| SSE: simultaneous connection limit | 6 per domain | No practical limit | No practical limit |
| Head-of-line blocking | At the TCP connection | At the TCP connection | Solved per-stream |
| New-connection latency | 2-3 RTTs | 2-3 RTTs | 1 RTT / 0-RTT |
| Network change (Wi-Fi → 4G) | Full reconnection | Full reconnection | Transparent (Connection ID) |
| WebSocket | HTTP → WS upgrade | Still over TCP | WebTransport as a successor |

---

## WebSocket and HTTP/3 — the gap

WebSocket was designed for HTTP/1.1 and uses an upgrade mechanism that doesn't fit well into the stream model of HTTP/2 and HTTP/3. There's technically an RFC for WebSocket over HTTP/2 (RFC 8441), but support is limited.

The intended successor for this gap is **WebTransport** — a W3C API over QUIC that offers bidirectional streams and datagrams, without the legacy of WebSocket's upgrade handshake. Current support: Chrome and Firefox. Not yet Safari. For production in 2025, it's still early, but it's the direction things are heading.

---

## Current adoption

HTTP/2 accounts for roughly 65% of global web traffic. HTTP/3 is around 30%, with Cloudflare, Google, and Meta already serving it by default. If you're behind Cloudflare or any modern CDN, you're probably already on HTTP/3 without having configured anything.

QUIC is also used independently of HTTP: Google used a proprietary version (gQUIC) for years before standardization, and Microsoft Teams and other products have adopted it for low-latency real-time communication.
