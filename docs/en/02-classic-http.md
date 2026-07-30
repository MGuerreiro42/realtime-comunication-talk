# Classic HTTP: How the Web Actually Works

## The request/response model

HTTP is an application-layer protocol built on top of TCP. The core idea is stateless: each request is independent, the server doesn't hold state between them. This was a deliberate design decision — simplicity, horizontal scalability, cacheability.

```
1. Client opens a TCP connection with the server
2. Client sends an HTTP request
3. Server processes and sends an HTTP response
4. Connection closes (HTTP/1.0) or stays available for the next request (HTTP/1.1 keep-alive)
```

---

## Anatomy of an HTTP Request

```http
GET /api/messages HTTP/1.1
Host: example.com
Accept: application/json
Authorization: Bearer eyJhbGc...
Connection: keep-alive
```

- **Method**: what you want to do (GET, POST, PUT, DELETE...)
- **Path**: where you want to do it
- **Headers**: request metadata
- **Body**: data (on POST/PUT)

---

## Anatomy of an HTTP Response

```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 39
Cache-Control: no-cache

{"messages": [{"id": 1, "text": "Hello world"}]}
```

---

## What "stateless" means in practice

Every request needs to carry everything the server needs to know — authentication, context, preferences. The server doesn't remember you between requests. That's why cookies, JWT tokens, and sessions exist: they're ways to *simulate* state on top of a protocol that was designed without it.

This is good for horizontal scaling: any server instance can answer any request, because none of them holds client state.

---

## The full lifecycle of a web request

```
DNS lookup         ~20-120ms  (only on the first time)
TCP handshake      ~1 RTT     (SYN, SYN-ACK, ACK)
TLS handshake      ~1-2 RTT   (if HTTPS)
HTTP request       ~1 RTT
Processing         variable
HTTP response      variable

Minimum total: ~3-4 RTTs before receiving any data
```

This overhead is the context for understanding why polling is expensive — you pay this cost on every cycle.

---

## The fundamental limitation for real-time

HTTP/1.1 is half-duplex by design: on a given connection, either the client is sending or the server is responding. Never both at once, and never the server initiating. The request *has* to come first.

This isn't a bug — it's a design choice that works for 95% of the web's use cases. The problem is the remaining 5%, which is exactly what we're discussing here.
