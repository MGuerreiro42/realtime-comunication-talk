# Comunicação em Tempo Real na Web

## Estrutura da apresentação

Uma linha do tempo narrativa: do problema fundamental até as tecnologias de próxima geração.

---

## Módulos

| #   | Arquivo                     | Conteúdo                                                                                                                                                                       |
| --- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 01  | [[01-o-problema]]           | Por que HTTP clássico não serve para tempo real? Casos de uso, o gap fundamental, custo do polling ingênuo                                                                     |
| 02  | [[02-http-classico]]        | Anatomia do request/response, stateless por design, o ciclo completo de uma requisição, a limitação fundamental                                                                |
| 03  | [[03-polling-long-polling]] | Short polling (força bruta), Long Polling (gambiarra elegante), código de ambos, quando ainda fazem sentido                                                                    |
| 04a | [[04a-http-1-e-2]]          | HTTP/1.1 e HTTP/2 como contexto: head-of-line blocking, multiplexing, HPACK, e o que muda para SSE em HTTP/2                                                                   |
| 05  | [[05-sse]]                  | SSE: origem histórica, protocolo wire, EventSource API, reconexão com Last-Event-ID, autenticação, implementação em produção com exponential backoff, jitter e thundering herd |
| 06  | [[06-websocket]]            | WebSocket: handshake de upgrade, framing binário, implicações de infra stateful, reconexão manual, quando é a escolha certa                                                    |
| 04b | [[04b-http3-quic]]          | HTTP/3 e QUIC: substituição do TCP, head-of-line blocking resolvido por stream, 0-RTT, connection migration, impacto em tempo real                                             |
| 07  | [[07-alem-do-basico]]       | WebRTC (P2P, ICE/STUN/TURN), gRPC Streaming, GraphQL Subscriptions, WebTransport                                                                                               |
| 08  | [[08-como-escolher]]        | Comparativo técnico, árvore de decisão, casos de uso reais, Socket.io, fechamento                                                                                              |
| 09  | [[09-seguranca]]            | CORS em SSE, CSRF em WebSocket, autenticação sem headers, wss:// vs ws://, rate limiting                                                                                       |


---

## Linha do tempo da narrativa

```
01 — O Problema
      │
      ▼
02 — HTTP Clássico (o chão)
      │
      ▼
03 — Polling & Long Polling (as gambiarras)
      │
      ▼
04a — HTTP/1.1 → HTTP/2 (contexto de transporte)
      │
      ├──► 05 — SSE (unidirecional, simples, histórico)
      │
      └──► 06 — WebSocket (bidirecional, stateful)
                │
                ▼
           04b — HTTP/3 + QUIC (impacto em tudo que foi explicado)
                │
                ▼
           07 — Além do Básico (WebRTC, gRPC, GraphQL Subs, WebTransport)
                │
                ▼
           08 — Como Escolher (Socket.io, árvore de decisão, fechamento)
                │
                ▼
           10 — Segurança (CORS, CSRF, autenticação, rate limiting)
                │
                ▼
           09 — Demo ao vivo
```

---

## Mensagem central

> A escolha da tecnologia de tempo real não é sobre o que é mais impressionante — é sobre o que resolve o problema com o menor custo total: de implementação, de operação e de manutenção.