# Polling e Long Polling: As Gambiarras que Funcionam

## Short Polling — a força bruta

A solução mais óbvia para o problema de tempo real: se o servidor não pode me avisar, eu fico perguntando.

```javascript
// Client-side: pergunta a cada 2 segundos
setInterval(async () => {
  const response = await fetch('/api/messages/new');
  const data = await response.json();
  if (data.messages.length > 0) {
    renderMessages(data.messages);
  }
}, 2000);
```

### Quando funciona bem
- Dados que atualizam em intervalos previsíveis (ex: dashboard que refresh a cada 30s)
- Sistemas legados onde você não controla o servidor
- Prototipagem rápida

### Os problemas reais
- **Latência inerente**: no pior caso, o usuário espera `intervalo` inteiro pela atualização
- **Overhead constante**: 1.000 usuários com polling de 1s = 1.000 req/s só de overhead
- **Respostas vazias**: a maioria dos requests retorna "nada de novo" — banda e CPU desperdiçados
- **Não escala**: o custo cresce linearmente com usuários × frequência

---

## Long Polling — a gambiarra elegante

A evolução do polling: em vez de responder imediatamente, o servidor *segura* o request até ter algo pra dizer.

```
Polling normal:
Cliente ──► Servidor: "tem novidade?"
Servidor ──► Cliente: "não" (imediato)
(repete 2 segundos depois)

Long Polling:
Cliente ──► Servidor: "me avisa quando tiver novidade"
Servidor: ... (segura a conexão aberta) ...
(30 segundos depois, chega uma mensagem)
Servidor ──► Cliente: "aqui está" 
Cliente ──► Servidor: "me avisa quando tiver novidade" (reconecta imediatamente)
```

```javascript
// Server-side (Node.js simplificado)
app.get('/api/poll', (req, res) => {
  const timeout = setTimeout(() => {
    res.json({ messages: [] }); // timeout sem novidade
  }, 30000);

  // Quando chega mensagem nova, resolve o request pendente
  messageQueue.once('message', (msg) => {
    clearTimeout(timeout);
    res.json({ messages: [msg] });
  });
});

// Client-side
async function longPoll() {
  try {
    const response = await fetch('/api/poll');
    const data = await response.json();
    if (data.messages.length > 0) {
      renderMessages(data.messages);
    }
  } finally {
    longPoll(); // reconecta imediatamente
  }
}
```

### Vantagens sobre polling simples
- Latência quase zero para entrega (responde no instante que tem dado)
- Menos requests quando dados são esporádicos
- Funciona com qualquer proxy, firewall, CDN — é HTTP puro

### Problemas que permanecem
- **Conexões abertas no servidor**: 10.000 usuários = 10.000 conexões abertas esperando. Em servidores com modelo thread-per-connection (Java clássico, PHP), isso é catastrófico. Com event loop (Node.js, Nginx), é gerenciável mas ainda custoso.
- **Complexidade no servidor**: gerenciar requests pendentes, timeouts, reconexões
- **Overhead de HTTP**: cada "ciclo" ainda tem handshake, headers, etc.
- **Problemas com proxies**: alguns proxies têm timeout agressivo e fecham conexões longas

---

## Onde Long Polling ainda faz sentido hoje

Não é tecnologia morta. É a base do **Comet** que o Gmail usou por anos. O próprio **Pusher** usava long polling como fallback. Em 2024, alguns sistemas de notificação preferem long polling a WebSocket por ser mais simples de operar atrás de infraestrutura corporativa (proxies, firewalls, load balancers com sticky session).

A escolha não é sempre "use a tecnologia mais nova" — é entender os trade-offs do seu contexto.
