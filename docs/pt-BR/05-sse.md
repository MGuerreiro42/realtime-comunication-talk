# SSE — Server-Sent Events

## De onde veio

Em 2004, a web já tinha o problema de tempo real mas não tinha solução nativa. A resposta da época foi o **Comet** — um termo guarda-chuva para hacks sobre HTTP/1.1, principalmente long polling e streaming de respostas HTTP que nunca encerravam. O Gmail lançado em 2004 usava Comet. O Google Talk na web usava Comet. Funcionava, mas era uma gambiarra — cada implementação era diferente, frágil, e difícil de operar.

Ian Hickson, então editor da spec HTML5 no WHATWG, propôs em 2004 uma forma padronizada de fazer exatamente o que o Comet já fazia na prática: uma API nativa no browser para receber eventos do servidor por HTTP. A proposta virou a spec de Server-Sent Events, publicada como recomendação W3C em 2015 — mas implementada nos browsers muito antes disso.

A pergunta "por que não fizemos isso desde o começo?" tem uma resposta simples: a web foi projetada para documentos estáticos. Ninguém em 1991 imaginava dashboards ao vivo, feeds de notificação ou geração de texto token a token. O SSE é a formalização do que a web precisou inventar quando cresceu além dos documentos.

---

## O que é

SSE é um padrão W3C que permite ao servidor enviar dados para o cliente continuamente por uma conexão HTTP persistente. É unidirecional: servidor → cliente. O cliente abre a conexão uma vez e fica ouvindo.

Ao contrário do WebSocket, SSE não é um protocolo novo — é HTTP puro com uma resposta que nunca termina.

---

## O protocolo no nível de rede

O servidor responde com `Content-Type: text/event-stream` e mantém a conexão aberta, enviando dados no formato de texto simples:

```
data: Olá mundo\n\n

data: {"user": "miguel", "msg": "oi"}\n\n

event: user-joined\n
data: {"user": "claudia"}\n\n

id: 42\n
data: payload importante\n\n

: isso é um comentário, ignorado pelo cliente\n\n
```

### Regras do formato

- Cada campo é `chave: valor\n`
- Campos disponíveis: `data`, `event`, `id`, `retry`
- Um evento termina com uma linha em branco (`\n\n`)
- Múltiplas linhas de `data` são concatenadas com `\n`
- Linhas começando com `:` são comentários (úteis para keep-alive)

---

## A API do lado do cliente: EventSource

```javascript
const source = new EventSource('/api/events');

// Evento genérico (sem "event:" field)
source.onmessage = (event) => {
  console.log(event.data);     // string
  console.log(event.lastEventId); // id do último evento
};

// Eventos nomeados (com "event: nome")
source.addEventListener('user-joined', (event) => {
  const user = JSON.parse(event.data);
  renderUserJoined(user);
});

// Erros e reconexão
source.onerror = (err) => {
  // EventSource reconecta automaticamente
  // este callback é chamado durante a tentativa
  if (source.readyState === EventSource.CLOSED) {
    console.log('conexão encerrada permanentemente');
  }
};

// Encerrar manualmente
source.close();
```

---

## Reconexão automática: o detalhe mais importante

EventSource tem reconexão automática built-in. Quando a conexão cai, o browser espera um delay (padrão 3 segundos, configurável via `retry:` field) e reconecta automaticamente, enviando o header `Last-Event-ID` com o último id recebido.

```
// Servidor envia:
id: 100\n
data: mensagem A\n\n

id: 101\n
data: mensagem B\n\n

// Conexão cai aqui

// Cliente reconecta com:
GET /api/events HTTP/1.1
Last-Event-ID: 101

// Servidor pode retomar do evento 101:
id: 102\n
data: mensagem C\n\n  ← sem perder nada
```

Isso é poderoso: com IDs bem implementados no servidor, o cliente nunca perde mensagens mesmo com reconexões.

```javascript
// Server-side: respeitando Last-Event-ID
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const lastId = parseInt(req.headers['last-event-id']) || 0;
  
  // Replay de mensagens perdidas
  const missed = messageStore.getFrom(lastId);
  missed.forEach(msg => {
    res.write(`id: ${msg.id}\ndata: ${JSON.stringify(msg)}\n\n`);
  });

  // Registra o cliente para receber novas mensagens
  const clientId = addClient(res);
  
  req.on('close', () => removeClient(clientId));
});
```

---

## Implementação servidor completa (Node.js)

```javascript
const clients = new Map();
let eventId = 0;

// Broadcast para todos os clientes conectados
function broadcast(eventType, data) {
  eventId++;
  const payload = `id: ${eventId}\nevent: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  
  clients.forEach((res, clientId) => {
    try {
      res.write(payload);
    } catch (e) {
      clients.delete(clientId);
    }
  });
}

app.get('/api/events', (req, res) => {
  // Headers obrigatórios
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Desativa buffer do Nginx
  });

  // Keep-alive a cada 15s (evita timeout de proxies)
  const keepAlive = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 15000);

  const clientId = Date.now();
  clients.set(clientId, res);

  req.on('close', () => {
    clearInterval(keepAlive);
    clients.delete(clientId);
  });
});
```

---

## SSE com autenticação

EventSource não suporta headers customizados. Isso é uma limitação real — você não pode passar `Authorization: Bearer token`. As alternativas:

```javascript
// Opção 1: token na query string (menos seguro, aparece em logs)
const source = new EventSource(`/api/events?token=${jwt}`);

// Opção 2: cookie (funciona bem se mesma origem)
// O EventSource envia cookies automaticamente (same-origin)

// Opção 3: fetch com ReadableStream (mais moderno, headers completos)
const response = await fetch('/api/events', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const text = decoder.decode(value);
  parseSSEEvents(text); // parser manual do formato text/event-stream
}
```

---

## Limitações do SSE

**Unidirecional**: o cliente não pode enviar dados pela mesma conexão. Se precisar de comunicação bidirecional, você usa SSE para receber + fetch/POST para enviar. Isso é perfeitamente válido — é o que muitos sistemas de chat fazem.

**Sem suporte a dados binários**: SSE é texto puro. Binários precisam ser base64 ou similar.

**Sem suporte nativo no IE**: Edge sim, IE não. Em 2024 isso raramente importa.

**Limitação de 6 conexões em HTTP/1.1**: cada aba que abre um EventSource ocupa uma das 6 conexões disponíveis por domínio. Resolvido em HTTP/2.

**Proxies corporativos**: alguns proxies fazem buffer da resposta esperando ela terminar antes de repassar ao cliente. `X-Accel-Buffering: no` resolve para Nginx. Para outros proxies, você pode precisar de HTTPS (que proxies não conseguem inspecionar e bufferizar).

---

## Implementação em produção: além do EventSource puro

O `EventSource` nativo é simples, mas em produção ele cobre mal algumas situações críticas: não tem controle de quantas tentativas de reconexão fazer, não tem backoff configurável, e não tem como estabilizar callbacks sem causar reconexões desnecessárias. O hook abaixo encapsula o `EventSource` resolvendo esses problemas.

---

## Exponential Backoff — por que o intervalo fixo é insuficiente

O comportamento padrão do `EventSource` é reconectar em 3 segundos fixos. O problema: se o servidor caiu, todos os clientes conectados vão reconectar juntos, exatamente no mesmo momento, criando um pico de carga no exato instante em que o servidor voltou — possivelmente derrubando ele de novo.

Exponential backoff resolve isso aumentando o intervalo a cada tentativa fracassada:

```
tentativa 1: espera baseDelay * 2⁰ = 1000ms
tentativa 2: espera baseDelay * 2¹ = 2000ms
tentativa 3: espera baseDelay * 2² = 4000ms
tentativa 4: espera baseDelay * 2³ = 8000ms
...até maxDelay (ex: 30000ms)
```

```typescript
const calculateDelay = (attempt: number): number => {
  const exponentialDelay = Math.min(baseDelay * 2 ** attempt, maxDelay);
  const jitter = exponentialDelay * 0.1 * (Math.random() * 2 - 1);
  return Math.floor(exponentialDelay + jitter);
};
```

Quando a conexão é estabelecida com sucesso, o contador reseta:

```typescript
eventSource.onopen = () => {
  retryCountRef.current = 0; // volta do zero se conectou
  setIsConnected(true);
  setError(null);
};
```

---

## Thundering Herd — o problema que o jitter resolve

Mesmo com backoff exponencial, se todos os clientes usam os mesmos valores de `baseDelay` e `maxDelay`, eles ainda vão acumular nos mesmos instantes. Imagine 5.000 usuários todos com `baseDelay = 1000ms`: na tentativa 1, todos esperam exatamente 1 segundo e reconectam juntos.

O jitter quebra essa sincronização adicionando ruído aleatório ao delay calculado:

```typescript
// ±10% do delay calculado, aleatório por cliente
const jitter = exponentialDelay * 0.1 * (Math.random() * 2 - 1);
```

Com isso, clientes que tentariam reconectar todos ao mesmo tempo ficam distribuídos numa janela de tempo:

```
Sem jitter:     ||||||||||| (spike)    t=1000ms
Com jitter:     . . . . . . . . . .   t=900ms a t=1100ms
```

O resultado é que o servidor recebe as reconexões gradualmente, em vez de um spike que pode causar cascata de falhas.

---

## Máximo de tentativas e estado de erro fatal

Reconectar indefinidamente não é sempre o comportamento correto. Se o servidor está permanentemente indisponível ou a URL mudou, ficar tentando para sempre é desperdício e pode confundir o usuário.

```typescript
if (retryCountRef.current < maxRetries) {
  const delay = calculateDelay(retryCountRef.current);
  retryCountRef.current += 1;
  retryTimeoutRef.current = setTimeout(connect, delay);
} else {
  const fatalError = new Error(
    `SSE: Conexão falhou após ${maxRetries} tentativas`,
  );
  setError(fatalError);
  callbacksRef.current.onError?.(fatalError);
}
```

Após `maxRetries` tentativas, o hook expõe o erro via estado — a UI pode então mostrar um feedback ao usuário ("Sem conexão com o servidor") e oferecer um botão de retry manual, em vez de ficar tentando silenciosamente em background.

---

## Callbacks estáveis com useLatestRef — sem reconexões desnecessárias

Um problema sutil no React: se `onMessage`, `onError` ou `parseMessage` forem passados como funções inline, eles mudam de referência a cada render. Se esses callbacks estivessem no array de dependências do `useEffect`, a conexão SSE seria fechada e reaberta a cada render do componente pai — comportamento silencioso e difícil de debugar.

A solução é o padrão `useLatestRef`: guardar os callbacks em um ref que sempre aponta para a versão mais recente, sem precisar incluí-los nas dependências do effect:

```typescript
// callbacksRef.current sempre tem a versão mais recente dos callbacks
const callbacksRef = useLatestRef({
  parseMessage,
  onMessage,
  onError,
  onConnect,
  onDisconnect,
});

// No handler, lê do ref — não da closure
eventSource.onmessage = (event: MessageEvent) => {
  const { parseMessage: parse, onMessage } = callbacksRef.current;
  // ...
};
```

O `connect` só reconecta quando `url`, `maxRetries`, `baseDelay` ou `maxDelay` mudam — valores que de fato definem uma conexão diferente. Mudanças nos callbacks não causam reconexão.

---

## Cleanup e prevenção de memory leaks

Dois recursos precisam ser limpos quando o componente desmonta ou a URL muda: o `EventSource` aberto e o `setTimeout` de reconexão pendente.

```typescript
const disconnect = useCallback(() => {
  // Cancela retry pendente
  if (retryTimeoutRef.current) {
    clearTimeout(retryTimeoutRef.current);
    retryTimeoutRef.current = undefined;
  }
  // Fecha conexão SSE
  if (eventSourceRef.current) {
    eventSourceRef.current.close();
    eventSourceRef.current = null;
  }
  setIsConnected(false);
}, []);

useEffect(() => {
  if (!enabled || !url) {
    disconnect();
    return;
  }
  connect();
  return disconnect; // cleanup automático no unmount
}, [url, enabled, connect, disconnect]);
```

Sem isso, um componente que desmonta durante uma tentativa de reconexão deixaria um `setTimeout` órfão chamando `connect()` em um componente já morto — com a conexão estabelecida e sem ninguém para fechar.

---

## O fluxo completo em produção

```
Conexão estabelecida
        │
        ▼
    onopen → retryCount = 0, isConnected = true
        │
   (servidor cai)
        │
        ▼
    onerror → close EventSource, isConnected = false
        │
        ├── retryCount < maxRetries?
        │       │
        │      SIM → calculateDelay(retryCount) com jitter
        │             retryCount++
        │             setTimeout(connect, delay)
        │             (cada cliente com delay ligeiramente diferente)
        │
        └── NÃO → setError(fatalError), onError(fatalError)
                   UI mostra estado de erro
```

---

## Uso do hook

```tsx
const { data, isConnected, error } = useSSE<Coordinates>({
  url: `https://api.example.com/tracking/${shippingUuid}`,
  enabled: !!shippingUuid,
  parseMessage: (event) => {
    const parsed = JSON.parse(event.data);
    // retornar null descarta o evento sem atualizar estado
    return parsed.type === 'LOCATION_UPDATE' ? parsed.data : null;
  },
  onConnect: () => analytics.track('sse_connected'),
  onDisconnect: () => analytics.track('sse_disconnected'),
  onError: (err) => logger.error('SSE fatal', err),
  maxRetries: 5,
  baseDelay: 1000,   // 1s na primeira tentativa
  maxDelay: 30000,   // teto de 30s
});

if (error) return <ConnectionError onRetry={() => window.location.reload()} />;
if (!isConnected) return <Reconnecting />;
return <TrackingMap coordinates={data} />;
```

---

## Quando SSE é a escolha certa

SSE brilha quando:

- O fluxo de dados é predominantemente servidor → cliente
- Você quer simplicidade operacional (é HTTP puro, funciona com qualquer load balancer, CDN, proxy)
- Reconexão automática com replay é importante
- Você está num ambiente com restrições de firewall (WebSocket às vezes é bloqueado; SSE nunca)
- Streaming de LLMs (ChatGPT, Claude) — literalmente esse padrão

A maioria das aplicações que "acha que precisa de WebSocket" funciona perfeitamente com SSE + fetch para dados do cliente.

