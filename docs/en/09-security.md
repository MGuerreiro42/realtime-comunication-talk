# Security in Real-Time Connections

## Why it deserves separate attention

SSE and WebSocket have security models that differ from classic HTTP in ways that aren't obvious. Applying the same assumptions from a REST endpoint to an SSE or WebSocket endpoint is a direct path to production vulnerabilities.

---

## SSE and CORS

`EventSource` follows CORS policy, but with a specific behavior: it always makes a *simple* request (no preflight), regardless of whether the destination is cross-origin. This means the server needs to be prepared to validate the origin itself.

```javascript
// The browser automatically sends the Origin header:
GET /api/events HTTP/1.1
Origin: https://myapp.com

// Server needs to validate and respond:
Access-Control-Allow-Origin: https://myapp.com
// or
Access-Control-Allow-Origin: *  // not recommended for sensitive data
```

Without the correct `Access-Control-Allow-Origin` header, the browser blocks the response — but the request already reached the server. In careless implementations, the server may process the request before the browser rejects the response.

Also, `EventSource` **always sends cookies** for same-origin requests, and sends cookies for cross-origin requests if the server responds with `Access-Control-Allow-Credentials: true`. This exposes an attack vector if CORS validation is too permissive.

---

## WebSocket and the lack of automatic Origin verification

This is the most critical and least-known point: the **WebSocket upgrade handshake doesn't verify the `Origin` header automatically**. The browser sends the header, but it's up to the server to decide what to do with it.

```http
GET /ws HTTP/1.1
Host: api.myapp.com
Origin: https://malicious-site.com   ← browser sends it, server ignores it by default
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
```

Unlike fetch/XHR, where the browser blocks cross-origin requests without CORS, **WebSocket has no such automatic blocking**. If the server accepts the upgrade without checking Origin, any site can open a WebSocket connection to it using the user's credentials (cookies) — a CSRF via WebSocket.

```javascript
// Node.js server: mandatory Origin verification
wss.on('connection', (ws, req) => {
  const origin = req.headers.origin;
  const allowedOrigins = ['https://myapp.com', 'https://staging.myapp.com'];

  if (!allowedOrigins.includes(origin)) {
    ws.close(1008, 'Unauthorized origin');
    return;
  }

  // ... rest of the logic
});
```

Libraries like `ws` don't do this validation for you. Socket.io does, by default — it's one of the reasons it still has a place even with native WebSocket available.

---

## Authentication: the headers problem

Neither SSE nor native WebSocket support custom headers at connection time. This complicates authentication via `Authorization: Bearer`.

### For SSE

```javascript
// ❌ Doesn't work — EventSource doesn't accept headers
const es = new EventSource('/api/events', {
  headers: { Authorization: `Bearer ${token}` } // ignored
});

// ✅ Option 1: token in the query string
// Works, but the token shows up in server and proxy logs
const es = new EventSource(`/api/events?token=${token}`);

// ✅ Option 2: HttpOnly cookie (same-origin)
// EventSource sends cookies automatically — the safest option
// for same-origin applications

// ✅ Option 3: fetch + ReadableStream
// Supports full headers, but no automatic reconnection
const response = await fetch('/api/events', {
  headers: { Authorization: `Bearer ${token}` }
});
```

### For WebSocket

```javascript
// ❌ Doesn't work
const ws = new WebSocket('wss://api.com/ws', {
  headers: { Authorization: `Bearer ${token}` } // ignored by the browser
});

// ✅ Option 1: token in the query string (same caveats)
const ws = new WebSocket(`wss://api.com/ws?token=${token}`);

// ✅ Option 2: send the token as the first message after connecting
ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'auth', token }));
};
// Server rejects any message before receiving authentication

// ✅ Option 3: HttpOnly cookie (same-origin, safest)
```

---

## `wss://` vs `ws://` — not optional

`ws://` travels in plain text, unencrypted. Any proxy, router, or network hop along the way can read and inject messages. In 2025, there's no argument for using `ws://` outside localhost.

Besides encryption in transit, `wss://` has another benefit: corporate proxies generally block `ws://` but allow `wss://` (because they can't inspect HTTPS content).

```javascript
// ❌ Never in production
const ws = new WebSocket('ws://api.myapp.com/ws');

// ✅ Always
const ws = new WebSocket('wss://api.myapp.com/ws');
```

---

## Rate limiting and DoS on persistent connections

SSE and WebSocket endpoints have a different attack surface than REST endpoints. A malicious client can:

- Open thousands of simultaneous SSE connections (each holds state on the server)
- Send WebSocket messages at high frequency with no throttling

Mitigations needed in production:

```javascript
// Connection limit per IP (SSE)
const connectionsByIp = new Map();

app.get('/api/events', (req, res) => {
  const ip = req.ip;
  const count = connectionsByIp.get(ip) || 0;

  if (count >= 10) {
    return res.status(429).json({ error: 'Too many connections' });
  }

  connectionsByIp.set(ip, count + 1);
  req.on('close', () => {
    const current = connectionsByIp.get(ip) || 1;
    connectionsByIp.set(ip, current - 1);
  });

  // ... normal SSE setup
});

// Message rate limiting (WebSocket)
ws.on('message', (data) => {
  const now = Date.now();
  if (now - ws.lastMessage < 50) { // max 20 msgs/s
    ws.close(1008, 'Rate limit exceeded');
    return;
  }
  ws.lastMessage = now;
  // ... process message
});
```

---

## Summary of security considerations

| Point | SSE | WebSocket |
|---|---|---|
| CORS | Follows CORS policy, no preflight | No automatic Origin verification |
| CSRF | Mitigated by CORS when configured | **Vulnerable if Origin isn't validated server-side** |
| Authentication | Query string or cookie | Query string, cookie, or first message |
| Encryption | Always HTTPS (SSE is HTTP) | Always `wss://` |
| Rate limiting | Per IP/session on the server | Per IP + per message frequency |
