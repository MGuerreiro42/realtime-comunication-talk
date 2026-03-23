# HTTP/1.1 e HTTP/2 — O Chão Que SSE e WebSocket Pisam

## Por que versões de HTTP importam aqui

SSE e WebSocket não existem no vácuo — ambos são construídos sobre HTTP e TCP. As limitações do HTTP/1.1 são parte do motivo pelo qual WebSocket existe. E as melhorias do HTTP/2 mudam o comportamento do SSE em produção de formas que você precisa conhecer. Entender o protocolo de transporte é entender por que as APIs são do jeito que são.

---

## HTTP/1.1 (1997) — O padrão que durou décadas

### O que trouxe sobre HTTP/1.0

Keep-alive por padrão: a conexão TCP é reutilizável entre requests, sem precisar fazer novo handshake a cada um. Pipelining: tecnicamente é possível enviar múltiplos requests sem esperar a resposta do anterior.

### Os problemas que carregou

**Head-of-line blocking**: o pipelining nunca funcionou na prática porque as respostas precisam chegar em ordem. Se o primeiro request é lento, todos os outros ficam represados, mesmo que já estejam prontos no servidor.

```
Request 1 (lento) ──────────────────────► Response 1
Request 2 (rápido) ──► (esperando R1) ─── Response 2
Request 3 (rápido) ──► (esperando R1) ──────── Response 3
```

**Limite de 6 conexões por domínio**: browsers limitam conexões TCP paralelas por domínio. Com HTTP/1.1, cada `EventSource` que você abre ocupa uma dessas 6 — o que se torna um problema real em aplicações com múltiplas streams SSE simultâneas (múltiplas abas, múltiplos componentes).

**Headers repetitivos em texto puro**: cada request reenvia User-Agent, Accept, Cookie, Authorization... sem nenhuma compressão. Em alta frequência, o overhead de headers pode ser maior que o payload.

---

## HTTP/2 (2015) — A reescrita binária

### Multiplexing real

A mudança mais importante: HTTP/2 é um protocolo binário com o conceito de **streams** sobre uma única conexão TCP. Múltiplos requests e responses trafegam em paralelo, intercalados, sem bloquear uns aos outros.

```
HTTP/1.1 (precisa de 6 conexões TCP para paralelismo):
Conn1: ──[req1]──[res1]──[req7]──...
Conn2: ──[req2]──[res2]──[req8]──...
...

HTTP/2 (1 conexão TCP, N streams simultâneos):
Stream1: ──[req1]──────────────[res1]──
Stream2: ────[req2]──[res2]────────────
Stream3: ──────[req3]──[res3]──────────
(tudo na mesma conexão TCP)
```

### Header compression (HPACK)

Cliente e servidor mantêm um dicionário compartilhado de headers. Headers repetidos como `User-Agent` e `Authorization` são enviados como índice de referência, não como texto completo. Redução típica de 80-90% no tamanho dos headers.

### Server Push (e por que morreu)

O servidor podia enviar recursos pro cliente antes de ele pedir — por exemplo, junto com o HTML já mandar o CSS e JS. Na prática foi problemático: o servidor não sabe o que está em cache no cliente, e push desnecessário desperdiça banda. O Chrome removeu suporte em 2022.

### O problema que HTTP/2 não resolveu

Head-of-line blocking **no nível TCP**. O multiplexing opera na camada de aplicação, mas todos os streams compartilham a mesma conexão TCP. Se um pacote TCP é perdido em trânsito, o TCP precisa retransmiti-lo — e todos os streams ficam bloqueados até a retransmissão ser concluída. Em redes com perda de pacotes (Wi-Fi instável, 4G fraco), HTTP/2 pode ser **mais lento** que HTTP/1.1 com múltiplas conexões.

Esse problema só é resolvido com HTTP/3. Veremos depois de entender SSE e WebSocket.

---

## O que muda para SSE com HTTP/2

Em HTTP/1.1, cada `EventSource` abre uma conexão TCP separada. Com 6 abas abertas no mesmo domínio, todas usando SSE, você esgotou o limite — a sétima aba fica esperando uma conexão liberar.

Em HTTP/2, múltiplos EventSources compartilham a mesma conexão TCP via streams. O limite prático deixa de existir.

```
HTTP/1.1:
Aba 1: Conexão TCP 1 ──► SSE stream
Aba 2: Conexão TCP 2 ──► SSE stream
...
Aba 6: Conexão TCP 6 ──► SSE stream
Aba 7: ⏳ esperando

HTTP/2:
Conexão TCP única:
  Stream 1 ──► SSE aba 1
  Stream 2 ──► SSE aba 2
  Stream 3 ──► SSE aba 3
  ...sem limite prático
```

Esse é um dos motivos pelos quais SSE ficou mais viável em produção nos últimos anos — a maioria dos servidores modernos já serve HTTP/2 por padrão.
