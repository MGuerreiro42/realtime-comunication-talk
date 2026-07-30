# Como Escolher: Comparativo e Árvore de Decisão

## O erro mais comum

A maioria das pessoas ouve "tempo real" e vai direto para WebSocket. WebSocket é poderoso, mas carrega complexidade operacional que frequentemente não é necessária. A pergunta certa não é "qual tecnologia é mais moderna?" mas "qual resolve meu problema com o menor custo?"

---

## Comparativo técnico detalhado

### Overhead de protocolo

```
Long Polling (por ciclo):
- TCP handshake (se nova conexão): ~3 RTTs
- HTTP headers: ~200-800 bytes por request/response
- Uma resposta com dado + uma com vazio = 2x overhead quando não tem dado

SSE (por evento):
- Conexão estabelecida uma vez: ~3 RTTs inicial
- Evento: apenas os bytes do evento + \n\n
- Headers HTTP: apenas no estabelecimento
- Keep-alive: `: keep-alive\n\n` = ~16 bytes a cada N segundos

WebSocket (por mensagem):
- Handshake: ~3 RTTs + overhead do Upgrade
- Frame overhead: 2-14 bytes por mensagem (vs ~200-800 bytes de headers HTTP)
- Melhor para alta frequência de mensagens pequenas
```

### Comparação de infraestrutura

```
SSE:
✓ Funciona com qualquer load balancer sem configuração
✓ Stateless: qualquer servidor pode receber a reconexão
✓ Funciona com HTTPS/proxies corporativos sem problema
✗ Unidirecional (cliente usa fetch separado para enviar)

WebSocket:
✓ Full-duplex, uma conexão para tudo
✓ Menor overhead por mensagem em alta frequência
✗ Pub/sub entre instâncias para escala horizontal
✗ Alguns proxies corporativos bloqueiam
✗ Stateful: reconexão precisa re-estabelecer contexto
```

---

## Árvore de decisão

```
Precisa de comunicação em tempo real?
│
├── Dados chegam em intervalos regulares e previsíveis?
│   └── SIM ──► Short Polling (simples, previsível, fácil de raciocinar)
│
├── Dados fluem principalmente Servidor → Cliente?
│   └── SIM ──► SSE
│       ├── Precisa de autenticação com headers customizados?
│       │   └── SIM ──► fetch + ReadableStream (superset do SSE)
│       └── Não ──► EventSource (mais simples, reconexão automática) 
│
├── Precisa de comunicação bidirecional de baixa latência?
│   └── SIM ──► WebSocket
│       ├── Já usa GraphQL?
│       │   └── SIM ──► GraphQL Subscriptions
│       ├── Microsserviços / não-browser?
│       │   └── SIM ──► gRPC Streaming
│       └── Não ──► WebSocket puro ou Socket.io
│
├── Precisa de vídeo/voz ou P2P?
│   └── SIM ──► WebRTC
│
└── Pode esperar adoção mais ampla?
    └── SIM ──► WebTransport (QUIC, próxima geração)
```

---

## Casos de uso reais e a escolha certa

### Chat (tipo Slack, WhatsApp Web)

**WebSocket** — bidirecional, usuário digita e recebe mensagens. Mas note: o WhatsApp Web usa uma variação de Long Polling com BOSH (XMPP sobre HTTP) em alguns contextos. A "resposta certa" às vezes surpreende.

### Notificações push (tipo GitHub, Jira)

**SSE** — o servidor manda avisos, o cliente não precisa responder pelo mesmo canal. Reconexão automática é ideal aqui.

### Dashboard de monitoramento (tipo Datadog, Grafana)

**SSE** ou **WebSocket** dependendo do volume. Grafana usa WebSocket. Um dashboard simples com 10 métricas: SSE funciona perfeitamente.

### Colaboração ao vivo (tipo Google Docs, Figma)

**WebSocket** — múltiplos cursores, edições simultâneas, presença de usuários. A bidirecionalidade é fundamental. Figma especificamente usa um protocolo binário customizado sobre WebSocket.

### Streaming de LLM (tipo ChatGPT, Claude)

**SSE** — o modelo gera tokens e o servidor envia conforme gera. Unidirecional por natureza. É exatamente o que a OpenAI API e a Anthropic API usam.

### Videochamada

**WebRTC** — sem discussão.

### Placar ao vivo (tipo ESPN, globo.com)

**SSE** — servidor empurra atualizações, cliente só exibe. Simples, robusto, escala bem.

### Trading de alta frequência

**WebSocket** com protocolo binário customizado, ou até UDP com protocolo proprietário. Latência é mais importante que confiabilidade aqui.

---

## A conversa que você não quer ter com ops

Antes de escolher WebSocket em produção, pense:

1. Seu load balancer suporta sticky sessions? Qual o custo operacional?
2. Como você vai fazer deploy sem derrubar conexões abertas? (graceful shutdown)
3. Quando o servidor reiniciar, como os clientes saberão que precisam reconectar e re-estabelecer estado?
4. Como você vai debugar? (WebSocket não aparece no painel de Network do DevTools da mesma forma que requests HTTP)
5. Se você escalar para 3 instâncias, como uma instância manda mensagem pro cliente na outra?

SSE resolve 1-3 automaticamente (é HTTP stateless, reconexão automática com Last-Event-ID). 4 e 5 ainda existem, mas são menores.

---

## Socket.io — quando a abstração vale o custo

Socket.io aparece em quase toda discussão sobre WebSocket, então vale um posicionamento claro: ele não é WebSocket, é uma abstração sobre WebSocket (com fallback para long polling quando WebSocket não está disponível).

O que ele adiciona sobre WebSocket puro:

- **Reconexão automática com backoff** — que o WebSocket nativo não tem
- **Rooms e namespaces** — agrupamento lógico de conexões sem você implementar
- **Verificação de Origin por padrão** — mitiga o problema de CSRF mencionado em segurança
- **Eventos nomeados** — em vez de um canal único, você tem `socket.emit('mensagem', data)` e `socket.on('mensagem', handler)`
- **Broadcast** facilitado — `io.to('sala').emit(...)` sem gerenciar a lista manualmente

O custo: é uma dependência não-trivial (~30KB minificado no cliente), adiciona um protocolo próprio sobre o WebSocket (os primeiros bytes de cada mensagem são metadados do Socket.io), e cria acoplamento — cliente e servidor precisam ambos usar Socket.io.

Faz sentido quando você precisa de rooms, broadcast por grupo, ou quer a reconexão automática sem implementar. Não faz sentido quando você tem controle total do servidor e da infra, ou quando performance de protocolo importa (aquele overhead de metadados em alta frequência some).

Uma observação prática: muito código legado usa Socket.io não porque precisava das features, mas porque era o tutorial mais fácil de encontrar em 2015. Em 2025, WebSocket nativo com uma biblioteca simples de reconexão resolve o mesmo problema com menos camadas.

---

## O argumento para "SSE first"

A recomendação padrão deveria ser: comece com SSE. Se você atingir uma limitação real — bidirecionalidade genuína de baixa latência, dados binários em alta frequência, necessidade de subprotocolos — então avalie WebSocket.

A maioria das aplicações nunca vai atingir essa limitação. E há um dado que ilustra isso bem: o ChatGPT, Claude, Copilot, Gemini — todos os grandes produtos de LLM usam SSE para streaming de tokens. São sistemas com dezenas de milhões de conexões simultâneas, construídos por engenheiros que tinham WebSocket como opção, e escolheram SSE. Não por acidente: o fluxo é unidirecional por natureza, reconexão automática com Last-Event-ID é valiosa, e a simplicidade operacional de HTTP puro escala sem fricção.

A escolha da tecnologia de tempo real não é sobre o que é mais impressionante — é sobre o que resolve o problema com o menor custo total: de implementação, de operação e de manutenção.