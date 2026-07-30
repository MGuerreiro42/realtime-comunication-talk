# HTTP Clássico: Como a Web Realmente Funciona

## O modelo request/response

HTTP é um protocolo de camada de aplicação construído sobre TCP. A ideia central é stateless: cada requisição é independente, o servidor não guarda estado entre elas. Isso foi uma decisão deliberada de design — simplicidade, escalabilidade horizontal, cacheabilidade.

```
1. Cliente abre conexão TCP com o servidor
2. Cliente envia HTTP request
3. Servidor processa e envia HTTP response
4. Conexão encerra (HTTP/1.0) ou fica disponível pro próximo request (HTTP/1.1 keep-alive)
```

---

## Anatomia de um HTTP Request

```http
GET /api/messages HTTP/1.1
Host: exemplo.com
Accept: application/json
Authorization: Bearer eyJhbGc...
Connection: keep-alive
```

- **Método**: o que você quer fazer (GET, POST, PUT, DELETE...)
- **Path**: onde você quer fazer
- **Headers**: metadados da requisição
- **Body**: dados (em POST/PUT)

---

## Anatomia de um HTTP Response

```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 48
Cache-Control: no-cache

{"messages": [{"id": 1, "text": "Olá mundo"}]}
```

---

## O que é stateless na prática

Cada request precisa carregar tudo que o servidor precisa saber — autenticação, contexto, preferências. O servidor não lembra de você entre requests. Por isso existem cookies, tokens JWT, sessions: são formas de *simular* estado num protocolo que foi projetado sem ele.

Isso é bom para escala horizontal: qualquer instância do servidor pode responder qualquer request, porque nenhuma guarda estado do cliente.

---

## O ciclo completo de uma requisição web

```
DNS lookup         ~20-120ms  (só na primeira vez)
TCP handshake      ~1 RTT     (SYN, SYN-ACK, ACK)
TLS handshake      ~1-2 RTT   (se HTTPS)
HTTP request       ~1 RTT
Processamento      variável
HTTP response      variável

Total mínimo: ~3-4 RTTs antes de receber qualquer dado
```

Esse overhead é o contexto para entender por que polling é caro — você paga esse custo em cada ciclo.

---

## A limitação fundamental para tempo real

HTTP/1.1 é half-duplex por design: numa conexão, ou o cliente está enviando ou o servidor está respondendo. Nunca os dois ao mesmo tempo, nunca o servidor iniciando. O request *precisa* vir primeiro.

Isso não é um bug — é uma escolha de design que funciona para 95% dos casos de uso da web. O problema é o 5% restante, que é exatamente o que estamos discutindo.
