# HTTP/1.1 and HTTP/2 — The Ground SSE and WebSocket Stand On

## Why HTTP versions matter here

SSE and WebSocket don't exist in a vacuum — both are built on top of HTTP and TCP. HTTP/1.1's limitations are part of why WebSocket exists. And HTTP/2's improvements change SSE's behavior in production in ways you need to know about. Understanding the transport protocol means understanding why the APIs are the way they are.

---

## HTTP/1.1 (1997) — The standard that lasted decades

### What it brought over HTTP/1.0

Keep-alive by default: the TCP connection is reusable between requests, without needing a new handshake each time. Pipelining: technically it's possible to send multiple requests without waiting for the previous response.

### The problems it carried

**Head-of-line blocking**: pipelining never worked in practice because responses need to arrive in order. If the first request is slow, all the others queue up behind it, even if they're already ready on the server.

```
Request 1 (slow) ──────────────────────► Response 1
Request 2 (fast) ──► (waiting on R1) ─── Response 2
Request 3 (fast) ──► (waiting on R1) ──────── Response 3
```

**Limit of 6 connections per domain**: browsers cap parallel TCP connections per domain. With HTTP/1.1, every `EventSource` you open takes up one of those 6 — which becomes a real problem in applications with multiple simultaneous SSE streams (multiple tabs, multiple components).

**Repetitive plain-text headers**: every request resends User-Agent, Accept, Cookie, Authorization... with no compression at all. At high frequency, header overhead can exceed the payload.

---

## HTTP/2 (2015) — The binary rewrite

### Real multiplexing

The most important change: HTTP/2 is a binary protocol with the concept of **streams** over a single TCP connection. Multiple requests and responses travel in parallel, interleaved, without blocking one another.

```
HTTP/1.1 (needs 6 TCP connections for parallelism):
Conn1: ──[req1]──[res1]──[req7]──...
Conn2: ──[req2]──[res2]──[req8]──...
...

HTTP/2 (1 TCP connection, N simultaneous streams):
Stream1: ──[req1]──────────────[res1]──
Stream2: ────[req2]──[res2]────────────
Stream3: ──────[req3]──[res3]──────────
(all on the same TCP connection)
```

### Header compression (HPACK)

Client and server keep a shared dictionary of headers. Repeated headers like `User-Agent` and `Authorization` are sent as a reference index instead of full text. Typical reduction of 80-90% in header size.

### Server Push (and why it died)

The server could send resources to the client before it asked for them — for example, sending CSS and JS along with the HTML. In practice this was problematic: the server doesn't know what's already cached on the client, and unnecessary push wastes bandwidth. Chrome removed support in 2022.

### The problem HTTP/2 didn't solve

Head-of-line blocking **at the TCP level**. Multiplexing operates at the application layer, but all streams share the same TCP connection. If a TCP packet is lost in transit, TCP needs to retransmit it — and every stream is blocked until the retransmission completes. On networks with packet loss (unstable Wi-Fi, weak 4G), HTTP/2 can be **slower** than HTTP/1.1 with multiple connections.

That problem is only solved with HTTP/3. We'll get there after covering SSE and WebSocket.

---

## What changes for SSE under HTTP/2

Under HTTP/1.1, every `EventSource` opens a separate TCP connection. With 6 tabs open on the same domain, all using SSE, you've hit the limit — the seventh tab waits for a connection to free up.

Under HTTP/2, multiple EventSources share the same TCP connection via streams. The practical limit disappears.

```
HTTP/1.1:
Tab 1: TCP connection 1 ──► SSE stream
Tab 2: TCP connection 2 ──► SSE stream
...
Tab 6: TCP connection 6 ──► SSE stream
Tab 7: ⏳ waiting

HTTP/2:
Single TCP connection:
  Stream 1 ──► SSE tab 1
  Stream 2 ──► SSE tab 2
  Stream 3 ──► SSE tab 3
  ...no practical limit
```

This is one of the reasons SSE has become more viable in production in recent years — most modern servers already serve HTTP/2 by default.
