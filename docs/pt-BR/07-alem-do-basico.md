# Além do Básico: WebRTC, gRPC Streaming, GraphQL Subscriptions e WebTransport

## Por que mencionar essas tecnologias

WebSocket e SSE resolvem a maioria dos casos. Mas entender onde elas se encaixam (e onde não se encaixam) é sinal de maturidade técnica.

---

## WebRTC — Peer-to-Peer na Web

### O que é

WebRTC (Web Real-Time Communication) é uma API e protocolo que permite comunicação direta entre browsers, sem passar pelo servidor para os dados. É a tecnologia por trás de Google Meet, Discord no browser, e qualquer videochamada web.

### Como funciona

```
Modelo WebSocket/SSE:
Cliente A ──► Servidor ──► Cliente B

Modelo WebRTC (após estabelecer conexão):
Cliente A ◄────────────────► Cliente B
         (conexão direta P2P)
```

O servidor ainda é necessário para a fase de *signaling* — os peers precisam trocar metadados (ICE candidates, SDP offers) para se descobrir e negociar a conexão. Depois disso, os dados fluem diretamente.

### Protocolos por baixo

```
WebRTC usa:
- DTLS (TLS sobre UDP) para criptografia
- SRTP para mídia (áudio/vídeo)
- SCTP sobre DTLS para dados (data channels)
- ICE/STUN/TURN para NAT traversal
```

**STUN**: descobre o IP público do cliente atrás de NAT  
**TURN**: relay de fallback quando P2P direto não é possível (NATs simétricos, firewalls)  
**ICE**: orquestra STUN/TURN para encontrar o melhor caminho

### Quando usar

- Videochamadas e streaming de áudio/vídeo
- Transferência de arquivos P2P
- Jogos com requisitos de latência extremamente baixa
- Qualquer caso onde você quer evitar que dados sensíveis passem pelo servidor

### Quando *não* usar

WebRTC tem complexidade de implementação significativa — NAT traversal, fallbacks, codec negotiation, reconnection. Para casos que não precisam de P2P ou de latência de vídeo, é overkill.

---

## gRPC Streaming — HTTP/2 para microsserviços

### O que é

gRPC é um framework de RPC (Remote Procedure Call) do Google que usa HTTP/2 como transporte e Protocol Buffers como serialização. Suporta quatro modos de comunicação:

```protobuf
service ChatService {
  // Unary (req/response normal)
  rpc GetMessage (MessageRequest) returns (Message);
  
  // Server streaming (servidor envia múltiplos responses)
  rpc WatchMessages (WatchRequest) returns (stream Message);
  
  // Client streaming (cliente envia múltiplos requests)
  rpc SendBatch (stream MessageRequest) returns (BatchResult);
  
  // Bidirectional streaming (full-duplex)
  rpc Chat (stream ChatMessage) returns (stream ChatMessage);
}
```

### Por que é relevante para tempo real

Server streaming e bidirectional streaming são formas de comunicação em tempo real sobre HTTP/2. Com Protocol Buffers, o overhead de serialização é mínimo comparado a JSON.

### A limitação na web

gRPC padrão não funciona no browser. O browser não expõe APIs de HTTP/2 de baixo nível suficiente. A solução é **gRPC-Web**, que usa um proxy (Envoy, por exemplo) para converter entre gRPC-Web (que o browser consegue fazer) e gRPC real.

### Quando usar

gRPC streaming é a escolha natural quando:
- Você já usa gRPC na comunicação entre microsserviços
- Performance de serialização importa (Protocol Buffers vs JSON)
- Contrato forte via `.proto` files é desejável
- Client não é o browser (mobile nativo, backend-to-backend, CLI tools)

---

## GraphQL Subscriptions — Abstração sobre WebSocket

### O que é

GraphQL Subscriptions é uma feature da spec GraphQL que permite ao cliente se inscrever em eventos. A implementação mais comum usa WebSocket por baixo (biblioteca `graphql-ws` ou o legado `subscriptions-transport-ws`).

```graphql
subscription {
  messageAdded(roomId: "geral") {
    id
    text
    author {
      name
      avatar
    }
  }
}
```

### Como funciona

```
Cliente ──► WebSocket ──► GraphQL Subscription Server
                         (resolve o subscription, conecta ao pub/sub)
                         
Evento ocorre ──► pub/sub ──► servidor resolve e filtra ──► cliente
```

### O que adiciona sobre WebSocket puro

- **Tipagem e schema**: os dados que chegam têm shape conhecido e validado
- **Filtragem no servidor**: o cliente declara exatamente quais campos quer
- **Integração com o grafo de dados**: subscriptions podem resolver relações (como `author` no exemplo acima)
- **Ferramentas**: GraphiQL, Apollo DevTools, geração de tipos TypeScript

### Custo

Toda a complexidade do WebSocket + complexidade do GraphQL. Faz sentido quando você já usa GraphQL — adicionar subscriptions é natural. Do zero só para tempo real, é over-engineered.

---

## WebTransport — O Futuro (e ainda presente)

### O que é

WebTransport é uma API W3C experimental (suporte no Chrome e Firefox, não no Safari ainda) que usa QUIC como transporte. É uma alternativa moderna ao WebSocket projetada para HTTP/3.

```javascript
const transport = new WebTransport('https://exemplo.com/wt');
await transport.ready;

// Streams bidirecionais (como WebSocket)
const stream = await transport.createBidirectionalStream();
const writer = stream.writable.getWriter();
await writer.write(new Uint8Array([1, 2, 3]));

// Datagrams (como UDP — sem garantia de entrega, sem ordem)
const writer = transport.datagrams.writable.getWriter();
await writer.write(new Uint8Array([1, 2, 3]));
```

### O que tem de diferente

- **Datagrams**: envio sem garantia de ordem ou entrega (ideal para jogos, telemetria onde dado antigo é inútil)
- **Múltiplos streams independentes**: sem head-of-line blocking entre streams (herança do QUIC)
- **Connection migration**: muda de rede sem reconectar

### Status atual

Suporte no Chrome e Firefox. Safari não tem suporte (em 2024). Para produção, ainda é cedo — mas é a direção que WebSocket provavelmente seguirá.

---

## Resumo: onde cada um se encaixa

| Tecnologia | Transport | Direção | Latência | Caso de uso |
|---|---|---|---|---|
| Long Polling | HTTP/1.1 | S→C | ~100ms+ | Fallback, sistemas legados |
| SSE | HTTP | S→C | ~50ms | Notificações, feeds, LLM streaming |
| WebSocket | TCP | Bidirecional | ~10ms | Chat, jogos, colaboração |
| WebRTC | UDP (DTLS) | P2P | ~5ms | Vídeo, voz, P2P |
| gRPC Streaming | HTTP/2 | Ambos | ~10ms | Microsserviços, não-browser |
| WebTransport | QUIC | Ambos + datagrams | ~5ms | Próxima geração |
