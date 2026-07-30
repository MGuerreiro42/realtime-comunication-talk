# Polling and Long Polling: The Workarounds That Work

## Short Polling — brute force

The most obvious solution to the real-time problem: if the server can't tell me, I'll keep asking.

```javascript
// Client-side: asks every 2 seconds
setInterval(async () => {
  const response = await fetch('/api/messages/new');
  const data = await response.json();
  if (data.messages.length > 0) {
    renderMessages(data.messages);
  }
}, 2000);
```

### When it works well
- Data that updates at predictable intervals (e.g. a dashboard that refreshes every 30s)
- Legacy systems where you don't control the server
- Rapid prototyping

### The real problems
- **Inherent latency**: in the worst case, the user waits the full `interval` for the update
- **Constant overhead**: 1,000 users polling every 1s = 1,000 req/s of pure overhead
- **Empty responses**: most requests come back "nothing new" — wasted bandwidth and CPU
- **Doesn't scale**: cost grows linearly with users × frequency

---

## Long Polling — the elegant workaround

The evolution of polling: instead of answering immediately, the server *holds* the request until it has something to say.

```
Normal polling:
Client ──► Server: "anything new?"
Server ──► Client: "no" (immediate)
(repeats 2 seconds later)

Long Polling:
Client ──► Server: "let me know when there's something new"
Server: ... (holds the connection open) ...
(30 seconds later, a message arrives)
Server ──► Client: "here it is"
Client ──► Server: "let me know when there's something new" (reconnects immediately)
```

```javascript
// Server-side (simplified Node.js)
app.get('/api/poll', (req, res) => {
  const timeout = setTimeout(() => {
    res.json({ messages: [] }); // timed out with nothing new
  }, 30000);

  // When a new message arrives, resolve the pending request
  messageQueue.once('message', (msg) => {
    clearTimeout(timeout);
    res.json({ messages: [msg] });
  });
});

// Client-side
async function longPoll() {
  try {
    const response = await fetch('/api/poll');
    const data = await response.json();
    if (data.messages.length > 0) {
      renderMessages(data.messages);
    }
  } finally {
    longPoll(); // reconnect immediately
  }
}
```

### Advantages over plain polling
- Near-zero delivery latency (responds the instant there's data)
- Fewer requests when data is sporadic
- Works with any proxy, firewall, CDN — it's plain HTTP

### Problems that remain
- **Open connections on the server**: 10,000 users = 10,000 open connections waiting. On thread-per-connection servers (classic Java, PHP), this is catastrophic. With an event loop (Node.js, Nginx), it's manageable but still costly.
- **Server-side complexity**: managing pending requests, timeouts, reconnections
- **HTTP overhead**: every "cycle" still pays for a handshake, headers, etc.
- **Proxy issues**: some proxies have aggressive timeouts and close long-lived connections

---

## Where Long Polling still makes sense today

It's not dead technology. It's the foundation of **Comet**, which Gmail used for years. **Pusher** itself used long polling as a fallback. In 2024, some notification systems still prefer long polling over WebSocket because it's simpler to operate behind corporate infrastructure (proxies, firewalls, load balancers with sticky sessions).

The choice isn't always "use the newest technology" — it's understanding the trade-offs of your context.
