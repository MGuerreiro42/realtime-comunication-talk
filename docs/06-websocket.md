# WebSocket — Full-Duplex de Verdade

## O que é

WebSocket é um protocolo de comunicação bidirecional, full-duplex, que opera sobre uma única conexão TCP persistente. A RFC 6455 foi padronizada em 2011. Ao contrário do SSE, WebSocket não é HTTP — começa como HTTP (o handshake) e depois *troca de protocolo*.

---

## O handshake de upgrade

A conexão WebSocket começa com um HTTP request especial:

```http
GET /ws HTTP/1.1
Host: exemplo.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```

O servidor responde com 101 Switching Protocols:

```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

A partir desse momento, a conexão TCP é "sequestrada" pelo protocolo WebSocket. HTTP não existe mais nessa conexão.

```
Antes do upgrade:  [TCP] ──► [HTTP]
Depois do upgrade: [TCP] ──► [WebSocket frames]
```

---

## O protocolo de frames

WebSocket transmite **frames**, não texto HTTP. Cada frame tem:

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-------+-+-------------+-------------------------------+
|F|R|R|R| opcode|M| Payload len |    Extended payload length    |
|I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
|N|V|V|V|       |S|             |   (if payload len==126/127)   |
| |1|2|3|       |K|             |                               |
+-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - -+
```

Opcodes importantes:
- `0x1` — frame de texto
- `0x2` — frame binário  
- `0x8` — close
- `0x9` — ping
- `0xA` — pong

Frames do cliente para servidor são sempre mascarados (XOR com chave aleatória) — medida de segurança contra cache poisoning em proxies HTTP.

---

## API do cliente

```javascript
const ws = new WebSocket('wss://exemplo.com/ws');

ws.onopen = () => {
  console.log('conectado');
  
  // Enviar texto
  ws.send(JSON.stringify({ type: 'join', room: 'geral' }));
  
  // Enviar binário
  const buffer = new ArrayBuffer(8);
  ws.send(buffer);
};

ws.onmessage = (event) => {
  if (typeof event.data === 'string') {
    const msg = JSON.parse(event.data);
    handleMessage(msg);
  } else {
    // ArrayBuffer ou Blob (binário)
    handleBinary(event.data);
  }
};

ws.onclose = (event) => {
  console.log(`fechado: ${event.code} - ${event.reason}`);
  // Reconexão NÃO é automática — você precisa implementar
  setTimeout(reconnect, 3000);
};

ws.onerror = (error) => {
  console.error('WebSocket error', error);
};

// Fechar com código
ws.close(1000, 'sessão encerrada normalmente');
```

---

## WebSocket é stateful — isso muda tudo na infra

Ao contrário de HTTP, onde qualquer servidor pode responder qualquer request, uma conexão WebSocket está amarrada a uma instância do servidor. Isso tem implicações sérias:

**Sticky sessions obrigatórias**: seu load balancer precisa garantir que um cliente sempre vai para o mesmo servidor. Se o servidor cair, a conexão cai.

**Escala horizontal é complexa**: para que servidor A possa enviar mensagem para um cliente conectado no servidor B, você precisa de um mecanismo de pub/sub entre instâncias (Redis Pub/Sub, NATS, etc).

```
Cliente 1 ──► Servidor A
Cliente 2 ──► Servidor B

Servidor A quer enviar mensagem pra todos?
Servidor A ──► Redis (PUBLISH) ──► Servidor B (SUBSCRIBE) ──► Cliente 2
```

---

## Servidor WebSocket (Node.js com ws)

```javascript
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`cliente conectado: ${ip}`);

  // Heartbeat: detectar conexões zumbis
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', (data, isBinary) => {
    if (isBinary) {
      handleBinary(ws, data);
    } else {
      const msg = JSON.parse(data.toString());
      handleMessage(ws, msg);
    }
  });

  ws.on('close', (code, reason) => {
    cleanup(ws);
  });
});

// Ping a cada 30s para detectar conexões mortas
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => clearInterval(interval));
```

---

## Subprotocolos e extensões

WebSocket suporta subprotocolos negociados no handshake:

```http
Sec-WebSocket-Protocol: chat, superchat
```

Exemplos de subprotocolos:
- **STOMP** (Simple Text Oriented Messaging Protocol) — muito usado com Spring/Java
- **MQTT over WebSocket** — IoT
- **GraphQL over WebSocket** (graphql-ws) — subscriptions

Extensões:
- **permessage-deflate** — compressão por mensagem (reduz banda significativamente)

---

## Reconexão — você é responsável

Diferente do EventSource, WebSocket não reconecta automaticamente. Você precisa implementar reconexão com backoff exponencial:

```javascript
function createWebSocket(url) {
  const ws = new WebSocket(url);
  let retries = 0;

  ws.onclose = () => {
    const delay = Math.min(1000 * Math.pow(2, retries), 30000);
    retries++;
    console.log(`reconectando em ${delay}ms`);
    setTimeout(() => createWebSocket(url), delay);
  };

  ws.onopen = () => { retries = 0; };

  return ws;
}
```

---

## Quando WebSocket é a escolha certa

WebSocket é necessário quando:
- Comunicação bidirecional com baixa latência é fundamental (jogos, colaboração ao vivo, trading)
- Você precisa enviar dados binários sem overhead de encoding
- Alta frequência de mensagens nos dois sentidos (mais eficiente que SSE + fetch paralelos)
- Você precisa de subprotocolos (STOMP, MQTT)

WebSocket é overkill quando:
- Dados fluem principalmente servidor → cliente
- Reconexão automática é importante
- Você está atrás de infraestrutura corporativa com proxies restritivos
- Simplicidade operacional importa mais que performance
