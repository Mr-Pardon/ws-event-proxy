## ws-event-proxy

An **protocol-agnostic WebSocket event proxy** with request/response mapping, event routing and stream subscription support.

一个**与具体协议无关的 WebSocket 事件代理层**，支持请求/响应映射、事件路由以及流式订阅场景。

---

## 🌍 Language / 语言

- [English](#english)
- [中文说明](#中文说明)

---

## English

### ✨ Features

- **Protocol abstraction**: `requestId` / `responseId` / optional ready lifecycle
- **Request–response**: one-shot promise-style `send`
- **Stream / subscription tasks**: `subscribeTask` with optional ack (`waitAck`)
- **Rule-based routing**: flexible rule object / predicate functions
- **Browser & Node.js** compatible
- **Zero dependencies**, pure ESM

---

### 📦 Installation

```bash
npm install ws-event-proxy
```

---

### 🚀 Quick Start

```js
import WebSocket from 'ws'
import { proxy } from 'ws-event-proxy'

const ws = new WebSocket('wss://example.com')
const wsProxy = new proxy()

ws.on('open', () => {
  wsProxy.bind(ws)
})

await wsProxy.send({ action: 'ping' })
```

---

### 🔌 API Overview

- **`new proxy(protocol?)`**
  - `protocol` (optional): protocol adapter, defaults to `BaseProtocol`.
- **`proxy.bind(ws)`**
  - Bind a WebSocket instance (browser `WebSocket` or `ws` in Node.js).
- **`proxy.send(payload, options?)`**
  - `options.timeout` (default `10000`)
  - `options.expectResponse` (default `true`)
  - Returns a `Promise` resolved with the mapped response, or `undefined` if `expectResponse = false` or no `requestId`.
- **`proxy.subscribeEvent(rule, handler)`**
  - `rule`: key-value map, where values can be literal values or predicate functions `(value, event) => boolean`.
  - Returns an **unsubscribe** function.
- **`proxy.subscribeTask({ request, rule, handler, waitAck, timeout })`**
  - Sends `request` and subscribes to events matched by `rule`.
  - If `waitAck = true`, waits for a response (using `send`) before resolving.

Properties:

- **`proxy.connected`**: Promise resolved after `bind` is called.
- **`proxy.ready`**: Promise resolved when protocol-specific ready event is received (if `needReady = true`), otherwise already resolved.

---

### 🔁 Request / Response Mapping

```js
const MyProtocol = {
  buildRequest(payload, ctx) {
    return {
      ...payload,
      requestId: ctx.getCBIndex()
    }
  },

  getRequestId(request) {
    return request.requestId
  },

  getResponseId(response) {
    return response.requestId
  }
}

const wsProxy = new proxy(MyProtocol)

const result = await wsProxy.send(
  { action: 'queryStatus' },
  { timeout: 5000 }
)
```

---

### 📡 Stream / Subscription Tasks

```js
const unsubscribe = await wsProxy.subscribeTask({
  request: { action: 'subscribeStatus' },
  rule: { type: 'status' },
  handler(event) {
    console.log('status update:', event)
  }
})

// Stop listening
unsubscribe()
```

By default, stream subscriptions **do not** participate in response mapping.  
You can enable ack waiting by passing `{ waitAck: true }`.

---

### 🧭 Event Routing

Custom predicate rules are supported:

```js
wsProxy.subscribeEvent(
  {
    type: 'notification',
    status: value => value === 0
  },
  event => {
    console.log(event)
  }
)
```

---

### ⏳ Ready Lifecycle (Optional)

```js
const ProtocolWithReady = {
  needReady: true,

  isReadyEvent(event) {
    return event.type === 'ready'
  }
}

const wsProxy = new proxy(ProtocolWithReady)

await wsProxy.send({ action: 'doSomething' })
```

---

### 🔌 Protocol Adapter (`BaseProtocol`)

```js
const BaseProtocol = {
  needReady: false,

  /**
   * @type {Array}
   * @property {Object} route
   * @property {Object} route.rule
   * @property {Function} route.handler
   */
  systemRoutes: Object.freeze([]),

  buildRequest(payload, ctx) {
    return payload
  },

  getRequestId(request) {
    return null
  },

  getResponseId(response) {
    return null
  },

  isReadyEvent(event) {
    return false
  }
}
```

---

### 📄 License

MIT

---

## 中文说明

### ✨ 特性

- **协议适配层**：支持 `requestId` / `responseId` / Ready 生命周期
- **单次请求-响应**：基于 Promise 的 `send`
- **流式任务 / 状态订阅**：`subscribeTask` 支持可选确认 (`waitAck`)
- **基于规则的事件路由**：规则对象 + 自定义谓词函数
- **同时支持浏览器与 Node.js**
- **无任何第三方依赖**，纯 ESM

---

### 📦 安装

```bash
npm install ws-event-proxy
```

---

### 🚀 快速上手

```js
import WebSocket from 'ws'
import { proxy } from 'ws-event-proxy'

const ws = new WebSocket('wss://example.com')
const wsProxy = new proxy()

ws.on('open', () => {
  wsProxy.bind(ws)
})

await wsProxy.send({ action: 'ping' })
```

---

### 🔌 API 概览

- **`new proxy(protocol?)`**
  - `protocol`：可选协议适配器，默认使用 `BaseProtocol`。
- **`proxy.bind(ws)`**
  - 绑定 WebSocket 实例（浏览器原生 `WebSocket` 或 Node.js `ws`）。
- **`proxy.send(payload, options?)`**
  - `options.timeout`：超时时间，默认 `10000` ms
  - `options.expectResponse`：是否期望响应，默认 `true`
  - 返回一个 `Promise`，有映射响应时 resolve，无响应时返回 `undefined`。
- **`proxy.subscribeEvent(rule, handler)`**
  - `rule`：键值匹配规则，value 可以是字面值或函数 `(value, event) => boolean`。
  - 返回 **取消订阅函数**。
- **`proxy.subscribeTask({ request, rule, handler, waitAck, timeout })`**
  - 发送 `request` 请求并基于 `rule` 订阅后续事件。
  - `waitAck = true` 时，会等待一次确认响应（内部复用 `send`）。

常用属性：

- **`proxy.connected`**：`bind` 调用后 resolve 的 Promise。
- **`proxy.ready`**：若 `needReady = true`，在收到 Ready 事件后 resolve，否则为已 resolve 的 Promise。

---

### 🔁 请求 / 响应映射

```js
const CustomProtocol = {
  buildRequest(payload, ctx) {
    return {
      ...payload,
      requestId: ctx.getCBIndex()
    }
  },

  getRequestId(req) {
    return req.requestId
  },

  getResponseId(res) {
    return res.requestId
  }
}

const wsProxy = new proxy(CustomProtocol)

const res = await wsProxy.send({ action: 'queryStatus' })
```

---

### 📡 流式订阅任务

```js
const unsubscribe = await wsProxy.subscribeTask({
  request: { action: 'subscribeStatus' },
  rule: { type: 'status' },
  handler(event) {
    console.log('实时状态:', event)
  }
})

// 取消订阅
unsubscribe()
```

默认情况下，流订阅 **不会** 参与响应映射，可通过 `{ waitAck: true }` 启用确认。

---

### 🧭 事件路由机制

支持自定义匹配规则：

```js
wsProxy.subscribeEvent(
  {
    type: 'notification',
    status: value => value === 0
  },
  event => {
    console.log(event)
  }
)
```

---

### ⏳ Ready 生命周期（可选）

```js
const ReadyProtocol = {
  needReady: true,

  isReadyEvent(event) {
    return event.type === 'ready'
  }
}

const wsProxy = new proxy(ReadyProtocol)

await wsProxy.send({ action: 'start' })
```

---

### 🔌 协议适配层 (`BaseProtocol`)

```js
const BaseProtocol = {
  needReady: false,

  /**
   * @type {Array}
   * @property {Object} route
   * @property {Object} route.rule
   * @property {Function} route.handler
   */
  systemRoutes: Object.freeze([]),

  /**
   * @param {Object} payload 
   * @param {Object} ctx 
   * @returns {Object}
   */
  buildRequest(payload, ctx) {
    return payload
  },

  /**
   * @param {Object} request
   * @returns {String | Number | null}
   */
  getRequestId(request) {
    return null
  },

  /**
   * @param {Object} response
   * @returns {String | Number | null}
   */
  getResponseId(response) {
    return null
  },

  /**
   * @param {Object} event
   * @returns {Boolean}
   */
  isReadyEvent(event) {
    return false
  }
}
```

---

### 📄 License

MIT

