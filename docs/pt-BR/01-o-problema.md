# O Problema: Por Que Tempo Real?

## A web foi projetada para documentos, não para conversas

A arquitetura original da web é simples: o cliente pergunta, o servidor responde, a conexão encerra. Esse modelo funciona perfeitamente para carregar uma página HTML, buscar um produto num catálogo ou enviar um formulário. O problema aparece quando a informação muda no servidor e o cliente precisa saber disso *agora* — sem ter perguntado.

---

## Casos de uso que quebram o modelo clássico

- **Chat e mensagens** — uma mensagem nova chega a qualquer momento, de qualquer remetente
- **Dashboards e monitoramento** — métricas de CPU, requests/s, erros em tempo real
- **Notificações** — o servidor precisa "empurrar" um evento pro cliente
- **Colaboração ao vivo** — Google Docs, Figma, múltiplos cursores na tela
- **Trading e finanças** — cotações que mudam em milissegundos
- **Jogos multiplayer** — estado compartilhado com latência mínima
- **Feeds ao vivo** — placares, eleições, resultados em tempo real

---

## O gap fundamental

```
Modelo clássico:
Cliente ──── request ────► Servidor
Cliente ◄─── response ─── Servidor
(fim de papo)

O que precisamos:
Servidor ──── push ──────► Cliente  (sem o cliente ter pedido)
```

Esse gap — a incapacidade do servidor de iniciar comunicação — é o problema central que todas as tecnologias desta apresentação tentam resolver, cada uma com suas trocas.

---

## Por que isso importa além do UX

A alternativa ingênua é o cliente ficar perguntando repetidamente: *"tem novidade? tem novidade? tem novidade?"*. Isso funciona, mas tem custo real:

- Carga desnecessária no servidor
- Latência inerente (você só descobre a novidade no próximo ciclo de polling)
- Desperdício de banda com respostas vazias
- Escalabilidade limitada: 10.000 clientes perguntando a cada segundo = 10.000 req/s de overhead puro

A escolha da tecnologia de tempo real tem impacto direto em custo de infraestrutura, experiência do usuário e complexidade do sistema.
