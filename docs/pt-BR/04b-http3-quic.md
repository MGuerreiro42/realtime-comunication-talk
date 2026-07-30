# HTTP/3 e QUIC — Trocando o Chão

## O que ficou para resolver

HTTP/2 resolveu multiplexing na camada de aplicação, mas não tocou no transporte. Todos os streams ainda compartilham uma única conexão TCP — e TCP foi projetado em 1974 para uma rede diferente, com premissas diferentes. HTTP/3 resolve isso abandonando o TCP por completo.

---

## A mudança radical: substituir TCP por QUIC

QUIC é um protocolo de transporte implementado sobre UDP que reimplementa confiabilidade, controle de fluxo e multiplexing do zero — com as lições dos últimos 50 anos de TCP.

```
HTTP/1.1:  [HTTP] ──► [TCP] ──► [IP]
HTTP/2:    [HTTP] ──► [TCP] ──► [IP]    (mesmo stack de transporte)
HTTP/3:    [HTTP] ──► [QUIC] ──► [UDP] ──► [IP]
```

---

## Por que UDP como base?

UDP é não-confiável por design — não garante entrega, ordem ou integridade. Isso soa como regressão, mas é exatamente o que dá liberdade ao QUIC: implementar confiabilidade de forma mais inteligente que o TCP.

TCP é confiável por conexão. Se um pacote é perdido, toda a conexão para até ele ser retransmitido — todos os streams de HTTP/2 bloqueiam.

QUIC é confiável por stream. Se um pacote do Stream 1 é perdido, apenas o Stream 1 espera a retransmissão. Streams 2, 3, 4 continuam fluindo normalmente.

```
HTTP/2 sobre TCP — perda de pacote:
Stream 1: ──────── ✗ pacote perdido ──── ⏳ bloqueado
Stream 2: ──────────────────────────── ⏳ bloqueado (sem culpa)
Stream 3: ──────────────────────────── ⏳ bloqueado (sem culpa)

HTTP/3 sobre QUIC — mesma perda:
Stream 1: ──────── ✗ pacote perdido ──── ⏳ retransmitindo
Stream 2: ──────────────────────────────────────► continua
Stream 3: ──────────────────────────────────────► continua
```

Head-of-line blocking resolvido de verdade, no nível do transporte.

---

## 0-RTT Handshake

TCP + TLS 1.3 exige no mínimo 1 RTT para TCP e 1 RTT para TLS antes de trafegar qualquer dado da aplicação:

```
Cliente                          Servidor
  │─── SYN ────────────────────────►│
  │◄── SYN-ACK ─────────────────────│   TCP: 1 RTT
  │─── ACK + ClientHello ──────────►│
  │◄── ServerHello + Certificado ───│   TLS: 1 RTT
  │─── Finished ───────────────────►│
  │◄── [dados da aplicação] ────────│
```

QUIC integra o handshake criptográfico no próprio protocolo. Em sessão nova: 1 RTT. Em reconexão com sessão prévia: **0-RTT** — o cliente já tem os parâmetros criptográficos da sessão anterior e manda dados no primeiro pacote.

Para SSE e WebSocket, isso reduz o custo de reconexão — relevante especialmente em mobile, onde reconexões são frequentes.

---

## Connection Migration

Conexões TCP são identificadas pelo par `IP origem:porta origem`. Quando você sai do Wi-Fi e cai no 4G, seu IP muda — a conexão TCP é encerrada e precisa ser reestabelecida do zero.

Conexões QUIC são identificadas por um **Connection ID** opaco, escolhido pelo cliente. Quando a rede muda e o IP muda, o Connection ID permanece o mesmo. O QUIC detecta a mudança de caminho e continua a conexão sem interrupcão.

Para aplicações em tempo real no mobile, isso é significativo: uma reconexão de SSE ou WebSocket sobre TCP paga o custo de handshake completo. Sobre QUIC, a transição é transparente.

---

## Impacto consolidado para tempo real

| | HTTP/1.1 | HTTP/2 | HTTP/3 / QUIC |
|---|---|---|---|
| SSE: limite de conexões simultâneas | 6 por domínio | Sem limite prático | Sem limite prático |
| Head-of-line blocking | Na conexão TCP | Na conexão TCP | Resolvido por stream |
| Latência de nova conexão | 2-3 RTTs | 2-3 RTTs | 1 RTT / 0-RTT |
| Mudança de rede (Wi-Fi → 4G) | Reconexão completa | Reconexão completa | Transparente (Connection ID) |
| WebSocket | Upgrade HTTP → WS | Ainda sobre TCP | WebTransport como sucessor |

---

## WebSocket e HTTP/3 — a lacuna

WebSocket foi projetado para HTTP/1.1 e usa um mecanismo de upgrade que não se encaixa bem no modelo de streams do HTTP/2 e HTTP/3. Tecnicamente existe uma RFC para WebSocket sobre HTTP/2 (RFC 8441), mas o suporte é limitado.

O sucessor pensado para esse gap é o **WebTransport** — API W3C sobre QUIC que oferece streams bidirecionais e datagrams, sem o legado do handshake de upgrade do WebSocket. Suporte atual: Chrome e Firefox. Safari ainda não. Para produção em 2025, ainda é cedo, mas é a direção.

---

## Adoção atual

HTTP/2 está em aproximadamente 65% do tráfego web global. HTTP/3 está em torno de 30%, com Cloudflare, Google e Meta já servindo por padrão. Se você está atrás de Cloudflare ou em qualquer CDN moderna, provavelmente já está em HTTP/3 sem ter configurado nada.

QUIC também é usado independentemente do HTTP: Google usou uma versão proprietária (gQUIC) por anos antes da padronização, e Microsoft Teams e outros produtos o adotaram para comunicação em tempo real de baixa latência.
