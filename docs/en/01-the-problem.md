# The Problem: Why Real-Time?

## The web was designed for documents, not conversations

The original architecture of the web is simple: the client asks, the server answers, the connection ends. This model works perfectly for loading an HTML page, fetching a product from a catalog, or submitting a form. The problem shows up when information changes on the server and the client needs to know about it *now* — without having asked.

---

## Use cases that break the classic model

- **Chat and messaging** — a new message can arrive at any moment, from any sender
- **Dashboards and monitoring** — CPU metrics, requests/s, errors in real time
- **Notifications** — the server needs to "push" an event to the client
- **Live collaboration** — Google Docs, Figma, multiple cursors on screen
- **Trading and finance** — quotes that change in milliseconds
- **Multiplayer games** — shared state with minimal latency
- **Live feeds** — scores, elections, real-time results

---

## The fundamental gap

```
Classic model:
Client ──── request ────► Server
Client ◄─── response ─── Server
(end of conversation)

What we need:
Server ──── push ──────► Client  (without the client having asked)
```

This gap — the server's inability to initiate communication — is the core problem every technology in this presentation tries to solve, each with its own trade-offs.

---

## Why this matters beyond UX

The naive alternative is having the client repeatedly ask: *"anything new? anything new? anything new?"*. This works, but has a real cost:

- Unnecessary load on the server
- Inherent latency (you only find out about news on the next polling cycle)
- Wasted bandwidth on empty responses
- Limited scalability: 10,000 clients asking every second = 10,000 req/s of pure overhead

The choice of real-time technology has a direct impact on infrastructure cost, user experience, and system complexity.
