const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const PORT = 3000;

// The frontend (demo/web) runs on a different port, so every endpoint needs CORS.
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// --- Shared state: simulated "server events" ---
// Every 1s the server generates a new event (like a stock price or sensor reading)
let currentEvent = generateEvent(0);
let eventCounter = 0;

function generateEvent(counter) {
  const values = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT'];
  const coin = values[counter % values.length];
  const price = (Math.random() * 1000 + 100).toFixed(2);
  return {
    id: counter,
    coin,
    price,
    timestamp: new Date().toISOString(),
  };
}

// Tick every 1.5 seconds
setInterval(() => {
  eventCounter++;
  currentEvent = generateEvent(eventCounter);
  notifyLongPollers();
  notifySSEClients();
  notifyWebSocketClients();
}, 1500);

// ─────────────────────────────────────────────
// POLLING endpoint
// Client calls this repeatedly on its own timer.
// Server just returns current state immediately.
// ─────────────────────────────────────────────
app.get('/api/polling', (req, res) => {
  res.json({ ...currentEvent, method: 'polling' });
});

// ─────────────────────────────────────────────
// LONG POLLING endpoint
// Client calls → server holds the connection open
// until a new event arrives, then responds.
// Client immediately requests again after response.
// ─────────────────────────────────────────────
const longPollers = new Set();

function notifyLongPollers() {
  for (const { res, timeout } of longPollers) {
    clearTimeout(timeout);
    res.json({ ...currentEvent, method: 'long-polling' });
  }
  longPollers.clear();
}

app.get('/api/long-polling', (req, res) => {
  // Timeout after 30s to avoid hanging forever
  const timeout = setTimeout(() => {
    longPollers.delete(entry);
    res.json({ ...currentEvent, method: 'long-polling', timedOut: true });
  }, 30000);

  const entry = { res, timeout };
  longPollers.add(entry);

  req.on('close', () => {
    clearTimeout(timeout);
    longPollers.delete(entry);
  });
});

// ─────────────────────────────────────────────
// SSE endpoint
// Server pushes events to the client over a
// persistent HTTP connection using text/event-stream.
// ─────────────────────────────────────────────
const sseClients = new Set();

function notifySSEClients() {
  const data = JSON.stringify({ ...currentEvent, method: 'sse' });
  for (const res of sseClients) {
    res.write(`data: ${data}\n\n`);
  }
}

app.get('/api/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send a connected confirmation immediately
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE stream connected', timestamp: new Date().toISOString() })}\n\n`);

  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// ─────────────────────────────────────────────
// WEBSOCKET endpoint
// Full-duplex persistent connection.
// Server pushes events AND client can send messages.
// ─────────────────────────────────────────────
function notifyWebSocketClients() {
  const data = JSON.stringify({ ...currentEvent, method: 'websocket' });
  for (const client of wss.clients) {
    if (client.readyState === 1) { // OPEN
      client.send(data);
    }
  }
}

wss.on('connection', (ws, req) => {
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'WebSocket connected! You can also send messages.',
    timestamp: new Date().toISOString(),
    method: 'websocket',
  }));

  // Handle messages from client (bidirectional demo)
  ws.on('message', (raw) => {
    const msg = raw.toString();
    // Echo back with server timestamp
    ws.send(JSON.stringify({
      type: 'echo',
      original: msg,
      message: `Server received: "${msg}"`,
      timestamp: new Date().toISOString(),
      method: 'websocket',
    }));
  });
});

server.listen(PORT, () => {
  console.log(`\nDemo server running at http://localhost:${PORT}\n`);
  console.log('Endpoints:');
  console.log('  GET  /api/polling      → Polling');
  console.log('  GET  /api/long-polling → Long Polling');
  console.log('  GET  /api/sse          → Server-Sent Events');
  console.log('  WS   /ws               → WebSocket\n');
});
