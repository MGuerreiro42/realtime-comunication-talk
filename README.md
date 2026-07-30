# Real-Time Communication on the Web

Presentation material and interactive demo comparing the four main approaches to real-time communication on the web: Polling, Long Polling, Server-Sent Events, and WebSocket.

> The slide deck in [`docs/`](docs/) is in Portuguese — it documents a TechTalk actually delivered in that language. This README and the demo below are in English.

---

## Repository contents

```
/
├── docs/                  # Presentation material (Markdown / Obsidian), in Portuguese
│   ├── 00-indice.md
│   ├── 01-o-problema.md
│   ├── 02-http-classico.md
│   ├── 03-polling-long-polling.md
│   ├── 04a-http-1-e-2.md
│   ├── 04b-http3-quic.md
│   ├── 05-sse.md
│   ├── 06-websocket.md
│   ├── 07-alem-do-basico.md
│   ├── 08-como-escolher.md
│   ├── 09-demo.md
│   └── 10-seguranca.md
└── demo/
    ├── server.js
    └── public/
        └── index.html
```

---

## Demo

A Node.js server with four endpoints running in parallel, and a frontend that connects to all of them simultaneously and shows the behavior of each in real time.

The server simulates a crypto price feed — a new event every 1.5 seconds — and the client displays how each technology receives those events, with request counters, measured latency, and a cumulative-connections visualizer that makes the cost of each approach visible.

### What each panel shows

**Polling** — the client makes a GET every 2 seconds regardless of whether there's new data. The request counter keeps climbing even in silence. This is the cost of the pull model in its rawest form.

**Long Polling** — the client opens a request and the server holds it until there's an event. The request sits "pending" in the DevTools Network tab. Once data arrives, the client reconnects immediately. Near-zero latency, but one new HTTP request per event.

**SSE** — a single persistent HTTP connection. The server pushes events as they happen. The request counter stays at 1 forever — that's the point of the slide.

**WebSocket** — full-duplex connection. Besides receiving events from the server, you can send messages and see the server's timestamped echo, illustrating the bidirectionality that SSE doesn't have.

### How to run it

```bash
cd demo
npm install
node server.js
```

Open `http://localhost:3000` and start whichever panels you want to compare. Keeping the DevTools Network tab open alongside it is recommended — the difference between "one request that never closes" (SSE) and "one request per event" (Long Polling) becomes immediately visible.

### Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/polling` | Returns current state immediately |
| GET | `/api/long-polling` | Holds until the next event |
| GET | `/api/sse` | Persistent `text/event-stream` stream |
| WS | `/ws` | Full-duplex WebSocket connection |

---

## Material (in Portuguese)

The files in `docs/` form a linear narrative from the problem to next-generation technologies, aimed at engineers already familiar with web development.

The suggested reading order is in [`docs/00-indice.md`](docs/00-indice.md). The files are Obsidian-compatible — `[[]]` links work if you open the `docs/` folder as a vault.

The [`05-sse.md`](docs/05-sse.md) module includes a React hook implementation (`useSSE`) with exponential backoff, jitter to avoid thundering herd, stable callbacks via `useLatestRef`, and memory-leak cleanup — plus the reasoning behind each of those safeguards.

---

## Tech

- Node.js with `express` and `ws`
- Framework-free, build-step-free frontend — plain HTML, CSS, and JS
