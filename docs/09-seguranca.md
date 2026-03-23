# Segurança em Conexões de Tempo Real

## Por que merece atenção separada

SSE e WebSocket têm modelos de segurança diferentes do HTTP clássico em pontos que não são óbvios. Aplicar as mesmas premissas de um endpoint REST a um endpoint SSE ou WebSocket é o caminho direto para vulnerabilidades em produção.

---

## SSE e CORS

O `EventSource` segue a política de CORS, mas com um comportamento específico: ele sempre faz um request *simples* (sem preflight), independente do destino ser cross-origin. Isso significa que o servidor precisa estar preparado para validar a origem ele mesmo.

```javascript
// O browser envia automaticamente o header Origin:
GET /api/events HTTP/1.1
Origin: https://meuapp.com

// Servidor precisa validar e responder:
Access-Control-Allow-Origin: https://meuapp.com
// ou
Access-Control-Allow-Origin: *  // não recomendado para dados sensíveis
```

Sem o header `Access-Control-Allow-Origin` correto, o browser bloqueia a resposta — mas o request já chegou ao servidor. Em implementações descuidadas, o servidor pode processar o request antes de o browser rejeitar a resposta.

Além disso, `EventSource` **sempre envia cookies** para requests same-origin, e envia cookies para cross-origin se o servidor responder com `Access-Control-Allow-Credentials: true`. Isso expõe a um vetor de ataque se a validação de CORS for permissiva demais.

---

## WebSocket e a ausência de verificação de Origin por padrão

Este é o ponto mais crítico e menos conhecido: o **handshake de upgrade do WebSocket não verifica o header `Origin` automaticamente**. O browser envia o header, mas cabe ao servidor decidir o que fazer com ele.

```http
GET /ws HTTP/1.1
Host: api.meuapp.com
Origin: https://site-malicioso.com   ← browser envia, servidor ignora por padrão
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
```

Diferente de fetch/XHR, onde o browser bloqueia requests cross-origin sem CORS, **o WebSocket não tem esse bloqueio automático**. Se o servidor aceitar o upgrade sem verificar Origin, qualquer site pode abrir uma conexão WebSocket com ele usando as credenciais (cookies) do usuário — um CSRF via WebSocket.

```javascript
// Servidor Node.js: verificação de Origin obrigatória
wss.on('connection', (ws, req) => {
  const origin = req.headers.origin;
  const allowedOrigins = ['https://meuapp.com', 'https://staging.meuapp.com'];

  if (!allowedOrigins.includes(origin)) {
    ws.close(1008, 'Origin não autorizada');
    return;
  }

  // ... resto da lógica
});
```

Bibliotecas como `ws` não fazem essa validação por você. Socket.io faz, por padrão — é um dos motivos pelos quais ele ainda tem espaço mesmo com WebSocket nativo disponível.

---

## Autenticação: o problema dos headers

Nem SSE nem WebSocket nativo suportam headers customizados no momento da conexão. Isso complica a autenticação via `Authorization: Bearer`.

### Para SSE

```javascript
// ❌ Não funciona — EventSource não aceita headers
const es = new EventSource('/api/events', {
  headers: { Authorization: `Bearer ${token}` } // ignorado
});

// ✅ Opção 1: token na query string
// Funciona, mas o token aparece em logs de servidor e de proxy
const es = new EventSource(`/api/events?token=${token}`);

// ✅ Opção 2: cookie HttpOnly (same-origin)
// O EventSource envia cookies automaticamente — a opção mais segura
// para aplicações same-origin

// ✅ Opção 3: fetch + ReadableStream
// Suporta headers completos, mas sem reconexão automática
const response = await fetch('/api/events', {
  headers: { Authorization: `Bearer ${token}` }
});
```

### Para WebSocket

```javascript
// ❌ Não funciona
const ws = new WebSocket('wss://api.com/ws', {
  headers: { Authorization: `Bearer ${token}` } // ignorado pelo browser
});

// ✅ Opção 1: token na query string (mesmas ressalvas)
const ws = new WebSocket(`wss://api.com/ws?token=${token}`);

// ✅ Opção 2: enviar token como primeira mensagem após conectar
ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'auth', token }));
};
// Servidor rejeita qualquer mensagem antes de receber autenticação

// ✅ Opção 3: cookie HttpOnly (same-origin, mais seguro)
```

---

## `wss://` vs `ws://` — não é opcional

`ws://` trafega em texto puro, sem criptografia. Qualquer proxy, roteador ou ponto de rede no caminho pode ler e injetar mensagens. Em 2025, não existe argumento para usar `ws://` fora de localhost.

Além da criptografia em trânsito, `wss://` tem outro benefício: proxies corporativos geralmente bloqueiam `ws://` mas permitem `wss://` (porque não conseguem inspecionar o conteúdo de HTTPS).

```javascript
// ❌ Nunca em produção
const ws = new WebSocket('ws://api.meuapp.com/ws');

// ✅ Sempre
const ws = new WebSocket('wss://api.meuapp.com/ws');
```

---

## Rate limiting e DoS em conexões persistentes

Endpoints SSE e WebSocket têm superfície de ataque diferente de endpoints REST. Um cliente malicioso pode:

- Abrir milhares de conexões SSE simultâneas (cada uma mantém estado no servidor)
- Enviar mensagens WebSocket em alta frequência sem throttling

Mitigações necessárias em produção:

```javascript
// Limite de conexões por IP (SSE)
const connectionsByIp = new Map();

app.get('/api/events', (req, res) => {
  const ip = req.ip;
  const count = connectionsByIp.get(ip) || 0;

  if (count >= 10) {
    return res.status(429).json({ error: 'Too many connections' });
  }

  connectionsByIp.set(ip, count + 1);
  req.on('close', () => {
    const current = connectionsByIp.get(ip) || 1;
    connectionsByIp.set(ip, current - 1);
  });

  // ... setup SSE normal
});

// Rate limiting de mensagens (WebSocket)
ws.on('message', (data) => {
  const now = Date.now();
  if (now - ws.lastMessage < 50) { // máximo 20 msgs/s
    ws.close(1008, 'Rate limit exceeded');
    return;
  }
  ws.lastMessage = now;
  // ... processa mensagem
});
```

---

## Resumo das considerações de segurança

| Ponto | SSE | WebSocket |
|---|---|---|
| CORS | Segue política de CORS, sem preflight | Não tem verificação automática de Origin |
| CSRF | Mitigado pelo CORS quando configurado | **Vulnerável se Origin não for validada no servidor** |
| Autenticação | Query string ou cookie | Query string, cookie, ou primeira mensagem |
| Criptografia | Sempre HTTPS (SSE é HTTP) | Sempre `wss://` |
| Rate limiting | Por IP/sessão no servidor | Por IP + por frequência de mensagens |
