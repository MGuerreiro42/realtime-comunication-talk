# Comunicação em Tempo Real na Web

Material de apresentação e demo interativa comparando as quatro principais abordagens de comunicação em tempo real na web: Polling, Long Polling, Server-Sent Events e WebSocket.

---

## Conteúdo do repositório

```
/
├── docs/                  # Material da apresentação (Markdown / Obsidian)
│   ├── 00-indice.md
│   ├── 01-o-problema.md
│   ├── 02-http-classico.md
│   ├── 03-polling-long-polling.md
│   ├── 04a-http-1-e-2.md
│   ├── 04b-http3-quic.md
│   ├── 05-sse.md
│   ├── 06-websocket.md
│   ├── 07-alem-do-basico.md
│   ├── 08-como-escolher.md
│   ├── 09-demo.md
│   └── 10-seguranca.md
└── demo/
    ├── server.js
    └── public/
        └── index.html
```

---

## Demo

Servidor Node.js com quatro endpoints rodando em paralelo, e um frontend que conecta em todos simultaneamente e mostra o comportamento de cada um em tempo real.

O servidor simula um feed de preços de criptomoedas — um novo evento a cada 1,5 segundo — e o cliente exibe como cada tecnologia recebe esses eventos, com contadores de requisições, latência medida e um visualizador de conexões acumuladas que torna visível o custo de cada abordagem.

### O que cada painel mostra

**Polling** — o cliente faz um GET a cada 2 segundos independente de ter dado novo. O contador de requisições sobe continuamente, mesmo em silêncio. É o custo do modelo pull na sua forma mais crua.

**Long Polling** — o cliente abre uma requisição e o servidor segura até ter um evento. O request fica "aguardando" no Network tab do DevTools. Quando o dado chega, o cliente reconecta imediatamente. Latência próxima de zero, mas uma nova requisição HTTP por evento.

**SSE** — uma única conexão HTTP persistente. O servidor envia eventos conforme surgem. O contador de requisições fica em 1 para sempre — é o ponto do slide.

**WebSocket** — conexão full-duplex. Além de receber os eventos do servidor, você pode enviar mensagens e ver o echo com timestamp do servidor, ilustrando a bidirecionalidade que SSE não tem.

### Como rodar

```bash
cd demo
npm install
node server.js
```

Abra `http://localhost:3000` e inicie os painéis que quiser comparar. Deixar o Network tab do DevTools aberto junto é recomendado — a diferença entre "uma requisição que nunca fecha" (SSE) e "uma requisição por evento" (Long Polling) fica imediatamente visível.

### Endpoints

| Método | Path | Descrição |
|---|---|---|
| GET | `/api/polling` | Retorna estado atual imediatamente |
| GET | `/api/long-polling` | Segura até o próximo evento |
| GET | `/api/sse` | Stream `text/event-stream` persistente |
| WS | `/ws` | Conexão WebSocket full-duplex |

---

## Material

Os arquivos em `docs/` formam uma narrativa linear do problema até as tecnologias de próxima geração, pensada para engenheiros com familiaridade em desenvolvimento web.

A ordem de leitura sugerida está em [`docs/00-indice.md`](docs/00-indice.md). Os arquivos são compatíveis com Obsidian — os links `[[]]` funcionam se você abrir a pasta `docs/` como vault.

O módulo [`05-sse.md`](docs/05-sse.md) inclui uma implementação de hook React (`useSSE`) com exponential backoff, jitter para evitar thundering herd, callbacks estáveis via `useLatestRef` e cleanup de memory leaks — além da explicação de por que cada uma dessas salvaguardas existe.

---

## Tecnologias

- Node.js com `express` e `ws`
- Frontend sem framework ou build step — HTML, CSS e JS puro
