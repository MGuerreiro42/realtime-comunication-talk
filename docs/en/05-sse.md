# SSE — Server-Sent Events

## Where it came from

In 2004, the web already had the real-time problem but no native solution. The answer at the time was **Comet** — an umbrella term for hacks on top of HTTP/1.1, mostly long polling and HTTP responses that streamed and never closed. Gmail, launched in 2004, used Comet. Google Talk on the web used Comet. It worked, but it was a hack — every implementation was different, fragile, and hard to operate.

Ian Hickson, then editor of the HTML5 spec at WHATWG, proposed in 2004 a standardized way to do exactly what Comet was already doing in practice: a native browser API to receive events from the server over HTTP. The proposal became the Server-Sent Events spec, published as a W3C recommendation in 2015 — but implemented in browsers long before that.

The question "why didn't we do this from the start?" has a simple answer: the web was designed for static documents. Nobody in 1991 imagined live dashboards, notification feeds, or token-by-token text generation. SSE is the formalization of what the web needed to invent once it outgrew documents.

---

## What it is

SSE is a W3C standard that lets the server continuously send data to the client over a persistent HTTP connection. It's unidirectional: server → client. The client opens the connection once and listens.

Unlike WebSocket, SSE isn't a new protocol — it's plain HTTP with a response that never ends.

---

## The protocol at the wire level

The server responds with `Content-Type: text/event-stream` and keeps the connection open, sending data in plain-text format:

```
data: Hello world\n\n

data: {"user": "miguel", "msg": "hi"}\n\n

event: user-joined\n
data: {"user": "claudia"}\n\n

id: 42\n
data: important payload\n\n

: this is a comment, ignored by the client\n\n
```

### Format rules

- Each field is `key: value\n`
- Available fields: `data`, `event`, `id`, `retry`
- An event ends with a blank line (`\n\n`)
- Multiple `data` lines are concatenated with `\n`
- Lines starting with `:` are comments (useful for keep-alive)

---

## The client-side API: EventSource

```javascript
const source = new EventSource('/api/events');

// Generic event (no "event:" field)
source.onmessage = (event) => {
  console.log(event.data);        // string
  console.log(event.lastEventId); // id of the last event
};

// Named events (with "event: name")
source.addEventListener('user-joined', (event) => {
  const user = JSON.parse(event.data);
  renderUserJoined(user);
});

// Errors and reconnection
source.onerror = (err) => {
  // EventSource reconnects automatically
  // this callback is called during the attempt
  if (source.readyState === EventSource.CLOSED) {
    console.log('connection closed permanently');
  }
};

// Close manually
source.close();
```

---

## Automatic reconnection: the most important detail

EventSource has automatic reconnection built in. When the connection drops, the browser waits a delay (default 3 seconds, configurable via the `retry:` field) and reconnects automatically, sending the `Last-Event-ID` header with the last id received.

```
// Server sends:
id: 100\n
data: message A\n\n

id: 101\n
data: message B\n\n

// Connection drops here

// Client reconnects with:
GET /api/events HTTP/1.1
Last-Event-ID: 101

// Server can resume from event 101:
id: 102\n
data: message C\n\n  ← nothing lost
```

This is powerful: with IDs properly implemented on the server, the client never loses messages even across reconnections.

```javascript
// Server-side: respecting Last-Event-ID
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const lastId = parseInt(req.headers['last-event-id']) || 0;

  // Replay missed messages
  const missed = messageStore.getFrom(lastId);
  missed.forEach(msg => {
    res.write(`id: ${msg.id}\ndata: ${JSON.stringify(msg)}\n\n`);
  });

  // Register the client to receive new messages
  const clientId = addClient(res);

  req.on('close', () => removeClient(clientId));
});
```

---

## Full server implementation (Node.js)

```javascript
const clients = new Map();
let eventId = 0;

// Broadcast to every connected client
function broadcast(eventType, data) {
  eventId++;
  const payload = `id: ${eventId}\nevent: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;

  clients.forEach((res, clientId) => {
    try {
      res.write(payload);
    } catch (e) {
      clients.delete(clientId);
    }
  });
}

app.get('/api/events', (req, res) => {
  // Required headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disables Nginx buffering
  });

  // Keep-alive every 15s (avoids proxy timeouts)
  const keepAlive = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 15000);

  const clientId = Date.now();
  clients.set(clientId, res);

  req.on('close', () => {
    clearInterval(keepAlive);
    clients.delete(clientId);
  });
});
```

---

## SSE with authentication

EventSource doesn't support custom headers. This is a real limitation — you can't pass `Authorization: Bearer token`. The alternatives:

```javascript
// Option 1: token in the query string (less secure, shows up in logs)
const source = new EventSource(`/api/events?token=${jwt}`);

// Option 2: cookie (works well if same-origin)
// EventSource sends cookies automatically (same-origin)

// Option 3: fetch with ReadableStream (more modern, full headers)
const response = await fetch('/api/events', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const text = decoder.decode(value);
  parseSSEEvents(text); // manual parser for the text/event-stream format
}
```

---

## SSE limitations

**Unidirectional**: the client can't send data over the same connection. If you need bidirectional communication, you use SSE to receive + fetch/POST to send. That's perfectly valid — it's what many chat systems do.

**No support for binary data**: SSE is plain text. Binary data needs to be base64 or similar.

**No native support in IE**: Edge yes, IE no. In 2024 this rarely matters.

**6-connection limit under HTTP/1.1**: every tab that opens an EventSource takes up one of the 6 connections available per domain. Solved under HTTP/2.

**Corporate proxies**: some proxies buffer the response waiting for it to finish before passing it to the client. `X-Accel-Buffering: no` fixes this for Nginx. For other proxies, you may need HTTPS (which proxies can't inspect and buffer).

---

## Production implementation: beyond plain EventSource

The native `EventSource` is simple, but in production it poorly covers some critical situations: no control over how many reconnection attempts to make, no configurable backoff, and no way to keep callbacks stable without causing unnecessary reconnections. The hook below wraps `EventSource` to solve these problems.

---

## Exponential Backoff — why a fixed interval isn't enough

The default behavior of `EventSource` is to reconnect at a fixed 3 seconds. The problem: if the server went down, every connected client will reconnect together, at exactly the same moment, creating a load spike at the exact instant the server comes back — possibly taking it down again.

Exponential backoff solves this by increasing the interval on each failed attempt:

```
attempt 1: wait baseDelay * 2⁰ = 1000ms
attempt 2: wait baseDelay * 2¹ = 2000ms
attempt 3: wait baseDelay * 2² = 4000ms
attempt 4: wait baseDelay * 2³ = 8000ms
...up to maxDelay (e.g. 30000ms)
```

```typescript
const calculateDelay = (attempt: number): number => {
  const exponentialDelay = Math.min(baseDelay * 2 ** attempt, maxDelay);
  const jitter = exponentialDelay * 0.1 * (Math.random() * 2 - 1);
  return Math.floor(exponentialDelay + jitter);
};
```

When the connection is successfully established, the counter resets:

```typescript
eventSource.onopen = () => {
  retryCountRef.current = 0; // back to zero once connected
  setIsConnected(true);
  setError(null);
};
```

---

## Thundering Herd — the problem jitter solves

Even with exponential backoff, if every client uses the same `baseDelay` and `maxDelay` values, they'll still pile up at the same instants. Imagine 5,000 users all with `baseDelay = 1000ms`: on attempt 1, they all wait exactly 1 second and reconnect together.

Jitter breaks that synchronization by adding random noise to the calculated delay:

```typescript
// ±10% of the calculated delay, random per client
const jitter = exponentialDelay * 0.1 * (Math.random() * 2 - 1);
```

With this, clients that would all try to reconnect at the same time end up spread across a time window:

```
Without jitter: ||||||||||| (spike)    t=1000ms
With jitter:    . . . . . . . . . .   t=900ms to t=1100ms
```

The result is that the server receives reconnections gradually, instead of a spike that can cause a cascade of failures.

---

## Max retries and the fatal error state

Reconnecting indefinitely isn't always the right behavior. If the server is permanently unavailable or the URL changed, retrying forever wastes resources and can confuse the user.

```typescript
if (retryCountRef.current < maxRetries) {
  const delay = calculateDelay(retryCountRef.current);
  retryCountRef.current += 1;
  retryTimeoutRef.current = setTimeout(connect, delay);
} else {
  const fatalError = new Error(
    `SSE: connection failed after ${maxRetries} attempts`,
  );
  setError(fatalError);
  callbacksRef.current.onError?.(fatalError);
}
```

After `maxRetries` attempts, the hook exposes the error via state — the UI can then show feedback to the user ("No connection to server") and offer a manual retry button, instead of silently retrying in the background forever.

---

## Stable callbacks with useLatestRef — no unnecessary reconnections

A subtle problem in React: if `onMessage`, `onError`, or `parseMessage` are passed as inline functions, their reference changes on every render. If those callbacks were in the `useEffect` dependency array, the SSE connection would be closed and reopened on every render of the parent component — a silent, hard-to-debug behavior.

The solution is the `useLatestRef` pattern: store the callbacks in a ref that always points to the latest version, without needing to include them in the effect's dependencies:

```typescript
// callbacksRef.current always has the latest version of the callbacks
const callbacksRef = useLatestRef({
  parseMessage,
  onMessage,
  onError,
  onConnect,
  onDisconnect,
});

// In the handler, read from the ref — not from the closure
eventSource.onmessage = (event: MessageEvent) => {
  const { parseMessage: parse, onMessage } = callbacksRef.current;
  // ...
};
```

`connect` only reconnects when `url`, `maxRetries`, `baseDelay`, or `maxDelay` change — values that actually define a different connection. Changes to the callbacks don't cause a reconnection.

---

## Cleanup and preventing memory leaks

Two resources need to be cleaned up when the component unmounts or the URL changes: the open `EventSource` and any pending reconnection `setTimeout`.

```typescript
const disconnect = useCallback(() => {
  // Cancel pending retry
  if (retryTimeoutRef.current) {
    clearTimeout(retryTimeoutRef.current);
    retryTimeoutRef.current = undefined;
  }
  // Close the SSE connection
  if (eventSourceRef.current) {
    eventSourceRef.current.close();
    eventSourceRef.current = null;
  }
  setIsConnected(false);
}, []);

useEffect(() => {
  if (!enabled || !url) {
    disconnect();
    return;
  }
  connect();
  return disconnect; // automatic cleanup on unmount
}, [url, enabled, connect, disconnect]);
```

Without this, a component that unmounts during a reconnection attempt would leave an orphaned `setTimeout` calling `connect()` on an already-dead component — with the connection established and nobody left to close it.

---

## The full flow in production

```
Connection established
        │
        ▼
    onopen → retryCount = 0, isConnected = true
        │
   (server goes down)
        │
        ▼
    onerror → close EventSource, isConnected = false
        │
        ├── retryCount < maxRetries?
        │       │
        │      YES → calculateDelay(retryCount) with jitter
        │             retryCount++
        │             setTimeout(connect, delay)
        │             (each client with a slightly different delay)
        │
        └── NO → setError(fatalError), onError(fatalError)
                   UI shows error state
```

---

## Using the hook

```tsx
const { data, isConnected, error } = useSSE<Coordinates>({
  url: `https://api.example.com/tracking/${shippingUuid}`,
  enabled: !!shippingUuid,
  parseMessage: (event) => {
    const parsed = JSON.parse(event.data);
    // returning null discards the event without updating state
    return parsed.type === 'LOCATION_UPDATE' ? parsed.data : null;
  },
  onConnect: () => analytics.track('sse_connected'),
  onDisconnect: () => analytics.track('sse_disconnected'),
  onError: (err) => logger.error('SSE fatal', err),
  maxRetries: 5,
  baseDelay: 1000,   // 1s on the first attempt
  maxDelay: 30000,   // 30s ceiling
});

if (error) return <ConnectionError onRetry={() => window.location.reload()} />;
if (!isConnected) return <Reconnecting />;
return <TrackingMap coordinates={data} />;
```

---

## When SSE is the right choice

SSE shines when:

- The data flow is predominantly server → client
- You want operational simplicity (it's plain HTTP, works with any load balancer, CDN, proxy)
- Automatic reconnection with replay matters
- You're in an environment with firewall restrictions (WebSocket is sometimes blocked; SSE never is)
- Streaming LLM output (ChatGPT, Claude) — this is literally that pattern

Most applications that "think they need WebSocket" work perfectly well with SSE + fetch for client-to-server data.
