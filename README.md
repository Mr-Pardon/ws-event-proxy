# ws-event-proxy

[![npm version](https://img.shields.io/npm/v/ws-event-proxy.svg)](https://www.npmjs.com/package/ws-event-proxy)
[![license](https://img.shields.io/npm/l/ws-event-proxy.svg)](https://www.npmjs.com/package/ws-event-proxy)

[English](#english) | [简体中文](#简体中文)

A lightweight, protocol-agnostic, event-driven message proxy for WebSocket, suitable for both browsers and Node.js.

一个轻量级、协议无关、事件驱动的 WebSocket 消息代理。适配浏览器和 Node.js 环境。

---

## English

`ws-event-proxy` is a lightweight, protocol-agnostic, event-driven WebSocket message proxy.
By adopting a protocol adapter pattern, it allows you to handle different WebSocket message structures in a unified way, while providing request–response handling, event subscription, and streaming task processing.

### ✨ Core Features

- **Protocol-agnostic**: Supports different application-level message structures via custom `protocol` adapters.
- **Flexible sending modes**: The `send` method supports fire-and-forget or request–response modes based on protocol configuration.
- **Event subscription**: Easily subscribe to and handle server-pushed events using `subscribeEvent`.
- **Streaming tasks**: Use `subscribeTask` to send task requests and subscribe to server-side event streams.
- **Lifecycle control**: Supports custom ready events, ensuring messages are sent only after both the WebSocket and server are ready.
- **Isomorphic usage**: Works seamlessly in both browser and Node.js environments.
- **Lightweight**: Minimal core implementation with zero external dependencies.

### 📦 Installation

```bash
npm install ws-event-proxy
```

### 🚀 Usage

#### 1. Protocol Configuration & Instantiation

The core idea of `ws-event-proxy` is to customize message behavior via a `protocol` adapter.

By defining a protocol, you can switch the message sending behavior to a Promise-based request–response model, enabling automatic request/response matching and timeout handling.

Without any protocol configuration, `ws-event-proxy` defaults to Fire-and-Forget mode.

When instantiating `ws-event-proxy`, you may provide a custom protocol adapter.
If omitted, BaseProtocol is used by default.

```js
import { proxy as WebSocketProxy } from 'ws-event-proxy'

const myProtocol = {
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

const proxy = new WebSocketProxy(myProtocol)
```

After instantiation, bind the WebSocket instance once the connection is established.

```js
const ws = new WebSocket('ws://your-websocket-endpoint')
ws.on('open', () => {
  proxy.bind(ws)
})
```

#### 2. Sending Messages

The `send` method supports Fire-and-Forget and Request–Response modes.

When both `getRequestId` and `getResponseId` are provided, `send` defaults to request–response mode and returns a Promise.

```js
const response = await proxy.send({
  action: 'getUser',
  userId: 123
})
```

To explicitly enable Fire-and-Forget mode:

```js
proxy.send(
  { action: 'sendMessage', data: {} },
  { expectResponse: false }
)
```

#### 3. Event Subscription

```js
const unsubscribe = proxy.subscribeEvent(
  {
    type: 'notification',
    status: value => value !== 0
  },
  event => {
    console.log(event)
  }
)

unsubscribe()
```

#### 4. Streaming Task Subscription

```js
const unsubscribe = proxy.subscribeTask({
  request: { action: 'getStatusRealTime' },
  rule: {
    type: 'status',
    status: value => value !== 0
  },
  handler: event => {
    console.log(event)
  }
})

unsubscribe()
```

#### 5. Ready Lifecycle

```js
const ReadyProtocol = {
  needReady: true,
  isReadyEvent(event) {
    return event.type === 'ready'
  }
}

const wsProxy = new proxy(ReadyProtocol)

wsProxy.send({ action: 'start' })

const ws = new WebSocket(url)
ws.on('open', () => {
  wsProxy.bind(ws)
})
```

### 🔌 Protocol Adapter Layer

```js
const BaseProtocol = {
  needReady: false,

  systemRoutes: Object.freeze([]),

  buildRequest(payload, ctx) {
    return payload
  },

  getRequestId() {
    return null
  },

  getResponseId() {
    return null
  },

  isReadyEvent() {
    return false
  }
}
```

### 📖 API Reference

#### new proxy(protocol?)

- protocol (optional): Object implementing BaseProtocol.
  To enable request–response behavior, both getRequestId and getResponseId must be implemented.

#### proxy.bind(ws)

- ws: A standard WebSocket instance.

#### async proxy.send(payload, options?)

- payload: Data to send.
- options:
  - timeout: Response timeout in ms (default 10000)
  - expectResponse: true for request–response, false for fire-and-forget

Returns Promise or undefined.

#### proxy.subscribeEvent(rule, handler)

Returns an unsubscribe function.

#### proxy.subscribeTask(options)

Returns an unsubscribe function.

### 📄 License

MIT

---

## 简体中文

`ws-event-proxy` 是一个轻量级、协议无关、事件驱动的 WebSocket 消息代理。它通过协议适配器模式，让您可以轻松处理各类 WebSocket 消息，并提供强大的请求-响应、事件订阅和流式任务处理机制。

### ✨ 核心功能

- **协议无关**:  通过自定义 `protocol` 适配器，支持不同的应用层消息结构。
- **灵活的发送模式**：`send` 方法可根据协议配置，支持即发即忘或请求-响应模式。
- **事件订阅**: 使用 `subscribeEvent` 方法，根据消息内容轻松订阅和处理推送事件。
- **流式订阅**: 使用`subscribeTask`发送流式任务请求，并订阅服务端返回的事件流。
- **生命周期**: 支持**自定义就绪事件**，确保在连接就绪前等待ws连接与服务端就绪。
- **同构应用**: 可在浏览器和 Node.js 环境中无缝工作。
- **轻量级**:  核心代码简洁，无任何外部依赖。

### 📦 安装

```bash
npm install ws-event-proxy
```

### 🚀 使用方法

#### 1. 协议配置与实例化

`ws-event-proxy` 的核心设计在于：  
通过自定义 `protocol` 适配器，可将消息发送模式调整为基于 Promise 的**请求-响应模式（request-response）**，用于自动匹配请求和响应、处理超时等场景。

在未配置协议的情况下，`ws-event-proxy` 默认采用 **即发即忘（Fire-and-Forget）** 模式。

可以在实例化`ws-event-proxy`时，提供自定义的协议适配器，默认采用[`BaseProtocol`](#协议适配层)。

```javascript
import { proxy as WebSocketProxy } from 'ws-event-proxy';

const myProtocol = {
  // 消息构筑器
  buildRequest(payload, ctx) {
    return {
      ...payload,
      // 可采用内置的回调索引，也可以自定义
      requestId: ctx.getCBIndex()
    }
  }

  // 告诉 proxy 如何从发出的消息中提取唯一 ID
  getRequestId(request) {
    return request.requestId;
  }

  // 告诉 proxy 如何从收到的消息中提取唯一 ID
  getResponseId(response) {
    return response.requestId;
  }
}

const proxy = new WebSocketProxy(myProtocol);

```

实例化完成后仅需在`websocket`连接成功后，调用`bind`方法绑定ws实例即可。

```javascript
const ws = new WebSocket('ws://your-websocket-endpoint');
ws.on('open', () => {
  proxy.bind(ws);
  console.log('WebSocket connected and proxy bound.');
});
```

#### 2. 发送消息

`send` 方法提供了两种模式：**即发即忘模式** 和 **请求-响应模式**。
在协议配置了对应的`getRequestId`和`getResponseId`的情况下，`send`会默认启用**请求-响应模式**，返回一个 Promise，用于等待响应，**可配置对应的超时时间**。

```javascript
// 2. 发送请求-响应消息
async function getUserInfo() {
  try {
    // 可通过配置 buildRequest 方法，自定义添加 requestId 字段
    const response = await proxy.send({ action: 'getUser', userId: 123 });
    console.log('Received user info:', response);
  } catch (error) {
    console.error(error.message); // 例如: 'request timeout'
  }
}
```

也可以通过配置 `expectResponse: false` 显式启用**即发即忘模式(Fire-and-Forget)**。

```javascript
proxy.send({ 
  action: 'sendMessage',
  data: {}
}, { expectResponse: false });
```

#### 3. 订阅事件

**支持匹配多条规则**，`rule`的`value`可以是**字面值或函数** `(value, event) => boolean`。

```javascript
// 订阅所有 'notification' 类型的事件，且 status 不为 0
const unsubscribe = proxy.subscribeEvent(
  { 
    type: 'notification',
    status: value => value != 0
  },
  (event) => {
    console.log('Status Error:', event);
  }
);

// 取消订阅
unsubscribe();
```

#### 4. 订阅任务流

`subscribeTask` 方法用于发送任务请求并订阅由服务器推送的任务流。**支持匹配多条规则**，`value`可以是**字面值或函数** `(value, event) => boolean`。

```javascript
const unsubscribe = proxy.subscribeTask({
  request: {
    action: 'getStatusRealTime'
  },
  rule: {
    type: 'status',
    status: value => value != 0
  },
  handler: (event) => {
    console.log('Status Error:', event);
  }
})

unsubscribe();
```

#### 5. Ready 生命周期

在某些场景下，可能需要在发送任何消息之前，**先等待服务器确认连接已准备就绪**。可以通过配置`needReady: true`和`isReadyEvent`，使 `ws-event-proxy` 在发送任何消息之前，等待服务器返回就绪状态。

这意味着`send`本质上是在向`proxy`注册一个发送任务，`proxy`会在ws连接就绪且满足`isReadyEvent`条件时，才开始发送任务。因此完全可以先`send`再`new WebSocket(url)`。

```js
const ReadyProtocol = {
  needReady: true,
  
  isReadyEvent(event) {
    return event.type === 'ready'
  }
}

const wsProxy = new proxy(ReadyProtocol)

wsProxy.send({ action: 'start' })

const ws = new WebSocket(url)
ws.on('open', () => {
  wsProxy.bind(ws)
})
```

### 🔌协议适配层

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

### 📖 API 参考

#### `new proxy(protocol?)`

- `protocol` (可选): 实现了 `BaseProtocol` 接口的对象。**若要使用 `send` 方法的 `Promise` 请求-响应功能，您必须提供一个实现了 `getRequestId` 和 `getResponseId` 的协议。**

#### `proxy.bind(ws)`

- `ws`: 一个标准的 WebSocket 实例。

#### `async proxy.send(payload, options?)`

发送消息。该方法支持两种操作模式：**请求-响应** 和 **即发即忘** (Fire-and-Forget)。

- `payload`: 要发送的数据对象。
- `options` (可选):
  - `timeout`: (Number) 在“请求-响应”模式下，等待响应的超时时间，默认 `10000`ms。
  - `expectResponse`: (Boolean) 决定了操作模式。
    - `true` (默认): 启用 **请求-响应** 模式。
    - `false`: 启用 **即发即忘** 模式。

- **返回**: `Promise<Object>` | `undefined`

#### `proxy.subscribeEvent(rule, handler)`

- `rule`: 一个用于匹配事件的对象。
- `handler`: `(event) => void`，当事件匹配时触发的回调。
- **返回**: `Function`，调用此函数可取消订阅。

#### `proxy.subscribeTask(options)`

- `options`:
  - `request`: (Object) 任务请求对象。
  - `rule`: (Object) 用于匹配任务流事件的对象。
  - `handler`: `(event) => void`，当事件匹配时触发的回调。
- **返回**: `Function`，调用此函数可取消订阅。

### 📄 许可证

MIT
