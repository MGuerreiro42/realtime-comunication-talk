# Real-Time Communication on the Web

## Presentation structure

A narrative timeline: from the fundamental problem to next-generation technologies.

---

## Modules

| #   | File                         | Content                                                                                                                                                                          |
| --- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | [[01-the-problem]]           | Why doesn't classic HTTP serve real-time needs? Use cases, the fundamental gap, the cost of naive polling                                                                     |
| 02  | [[02-classic-http]]          | Anatomy of request/response, stateless by design, the full lifecycle of a request, the fundamental limitation                                                                |
| 03  | [[03-polling-long-polling]]  | Short polling (brute force), Long Polling (elegant workaround), code for both, when they still make sense                                                                     |
| 04a | [[04a-http-1-and-2]]         | HTTP/1.1 and HTTP/2 as context: head-of-line blocking, multiplexing, HPACK, and what changes for SSE under HTTP/2                                                             |
| 05  | [[05-sse]]                   | SSE: historical origin, wire protocol, EventSource API, reconnection with Last-Event-ID, authentication, production implementation with exponential backoff, jitter and thundering herd |
| 06  | [[06-websocket]]             | WebSocket: upgrade handshake, binary framing, stateful infra implications, manual reconnection, when it's the right choice                                                   |
| 04b | [[04b-http3-quic]]           | HTTP/3 and QUIC: replacing TCP, head-of-line blocking solved per-stream, 0-RTT, connection migration, real-time impact                                                        |
| 07  | [[07-beyond-the-basics]]     | WebRTC (P2P, ICE/STUN/TURN), gRPC Streaming, GraphQL Subscriptions, WebTransport                                                                                              |
| 08  | [[08-how-to-choose]]         | Technical comparison, decision tree, real-world use cases, Socket.io, closing                                                                                                 |
| 09  | [[09-security]]              | CORS on SSE, CSRF on WebSocket, authentication without headers, wss:// vs ws://, rate limiting                                                                                |


---

## Narrative timeline

```
01 — The Problem
      │
      ▼
02 — Classic HTTP (the baseline)
      │
      ▼
03 — Polling & Long Polling (the workarounds)
      │
      ▼
04a — HTTP/1.1 → HTTP/2 (transport context)
      │
      ├──► 05 — SSE (unidirectional, simple, historical)
      │
      └──► 06 — WebSocket (bidirectional, stateful)
                │
                ▼
           04b — HTTP/3 + QUIC (impact on everything explained so far)
                │
                ▼
           07 — Beyond the Basics (WebRTC, gRPC, GraphQL Subs, WebTransport)
                │
                ▼
           08 — How to Choose (Socket.io, decision tree, closing)
                │
                ▼
           09 — Security (CORS, CSRF, authentication, rate limiting)
                │
                ▼
           Live demo (see the root README and demo/)
```

---

## Core message

> The choice of real-time technology isn't about what's most impressive — it's about what solves the problem at the lowest total cost: of implementation, of operation, and of maintenance.
