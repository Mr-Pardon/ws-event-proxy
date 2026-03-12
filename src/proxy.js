import { BaseProtocol } from './protocol.js'

export class WSProxy {

  /**
   * webSocket 消息代理
   * @param {Object} ws webSocket 实例
   */

  constructor(protocol = BaseProtocol) {
    this.__ws = null
    this.__routes = []
    this.__resolves = new Map()
    this.callbackIndex = 10000

    this.__protocol = this.createProtocol(protocol)
    this.registerSystemRoutes()

    this.connected = new Promise(res => {
      this.__connectedResolve = res
    })

    this.ready = this.__protocol.needReady
      ? new Promise(res => {
        this.__readyResolve = res
      })
      : Promise.resolve()
  }

  /**
   * 绑定 webSocket 实例
   * @param {Object} ws webSocket 实例
   */
  bind(ws) {
    this.__ws = ws

    if (typeof ws.addEventListener === 'function') {
      ws.addEventListener('message', e => this.onMessage(e.data))
    } else if (typeof ws.on === 'function') {
      ws.on('message', data => this.onMessage(data))
    }

    this.__connectedResolve?.()
    this.__connectedResolve = null
  }

  /**
   * 发送请求
   * @param {Object} payload 请求体
   * @param {Object} options 选项对象
   * @param {Number} options.timeout (可选) 超时时间，默认10000ms
   * @param {Boolean} options.expectResponse (可选) 期望响应，默认true
   * @returns {Promise} 请求结果
   */

  async send(payload, { timeout = 10000, expectResponse = true } = {}) {
    await this.connected
    await this.ready

    if (!this.__ws) {
      throw new Error('[proxy] WebSocket not bound')
    }

    const msg = this.__protocol.buildRequest(payload, {
      getCBIndex: () => this.getCBIndex(),
    })

    const requestId = this.__protocol.getRequestId(msg)

    if (requestId != null && expectResponse) {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          this.__resolves.delete(requestId)
          reject(new Error('request timeout'))
        }, timeout)

        this.__resolves.set(requestId, event => {
          clearTimeout(timer)
          resolve(event)
        })

        this.sendMessage(msg)
      })
    }

    this.sendMessage(msg)
    return undefined
  }

  /**
   * 添加事件路由
   * @param {Object} rule 路由规则对象，属性值可以是：
   *   - 直接值：精确匹配事件对象的对应属性
   *   - 布尔值函数：自定义匹配逻辑，函数接收(event[key], event)两个参数
   * @param {Function} handler 事件匹配成功后的回调函数
   * @param {Boolean} system (可选) 指定为系统路由，默认false
   * @return {Function} 取消订阅函数
   */

  subscribeEvent(rule, handler, system = false) {
    const routeName = Symbol('route')
    this.__routes.push({
      name: routeName,
      match: this.createMatcher(rule),
      handler,
      system
    })

    return () => this.removeEventRoute(routeName)
  }

  /**
   * 移除事件路由
   * @param {String | Symbol} name 路由名称
   */

  removeEventRoute(name) {
    const index = this.__routes.findIndex(route => route.name === name)

    if (index === -1) return false

    if (this.__routes[index].system) {
      console.warn(`[proxy] Removing system route: ${String(name)}, this may affect the initialization behavior`)
    }

    this.__routes.splice(index, 1)
    return true
  }

  /**
   * 订阅stream任务，发送请求并添加事件路由
   * @param {Object} request 请求对象
   * @param {Object} rule 路由规则对象，属性值可以是：
   *   - 直接值：精确匹配事件对象的对应属性
   *   - 布尔值函数：自定义匹配逻辑，函数接收(event[key], event)两个参数
   * @param {Function} handler 事件匹配成功后的回调函数
   * @param {Boolean} waitAck (可选) 等待确认响应，默认false
   * @param {Number} timeout (可选) 超时时间，默认10000ms
   * @return {Function} 取消订阅函数
   */

  async subscribeTask({ request, rule, handler, waitAck = false, timeout }) {
    const unsubscribe = this.subscribeEvent(rule, handler)
    waitAck
      ? await this.send(request, { timeout })
      : this.send(request, { expectResponse: false })

    return unsubscribe
  }

  /**
   * webSocket 消息代理
   * @param {String} msg 消息字符串
   */

  onMessage(msg) {
    const event = this.parseMessage(msg)
    this.__protocol.logReceive
      && console.log('[proxy] onMessage:', event)
    if (!event) return

    if (this.__protocol.needReady && this.__protocol.isReadyEvent(event)) {
      this.__readyResolve?.()
      this.__readyResolve = null
      return
    }

    const responseId = this.__protocol.getResponseId(event)
    if (responseId != null && this.__resolves.has(responseId)) {
      this.__resolves.get(responseId)?.(event)
      this.__resolves.delete(responseId)
      return
    }

    this.dispatchByRule(event)
  }

  /**
   * 根据路由规则分发事件
   * @param {Object} event 事件对象
   */

  dispatchByRule(event) {
    /** 强调系统路由优先级 */
    const routes = [
      ...this.__routes.filter(r => r.system),
      ...this.__routes.filter(r => !r.system)
    ]

    routes.forEach(route => {
      if (route.match(event)) {
        route.handler(event, this)
      }
    })
  }

  /**
   * 创建规则匹配器
   * @param {Object} rule 路由规则
   * @returns {Function} 匹配函数
   */

  createMatcher(rule) {
    return event => {
      return Object.entries(rule).every(([key, value]) => {
        if (typeof value === 'function') {
          return value(event[key], event)
        }

        return event[key] === value
      })
    }
  }

  /**
   * 解析消息
   * @param {String | Buffer | ArrayBuffer | Uint8Array} msg 消息
   * @returns {Object | null} 解析后的消息对象
   */

  parseMessage(msg) {
    const text = this.toText(msg)
    if (!text) return null

    try {
      return JSON.parse(text)
    } catch {
      return null
    }
  }

  /**
   * 将消息转换为文本字符串
   * @param {String | Buffer | ArrayBuffer | Uint8Array} msg 消息
   * @returns {String | null} 文本字符串
   */

  toText(msg) {
    if (typeof msg === 'string') return msg

    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(msg)) {
      return msg.toString()
    }

    if (msg instanceof ArrayBuffer || msg instanceof Uint8Array) {
      return new TextDecoder().decode(msg)
    }

    if (typeof msg === 'object') {
      return JSON.stringify(msg)
    }

    return null
  }

  /**
   * 构筑协议
   * @param {Object} overrides 协议覆盖项
   * @returns {Object} 协议对象
   */
  createProtocol(overrides = {}) {
    const protocol = {
      ...BaseProtocol,
      ...overrides
    }

    if (protocol.getResponseId !== BaseProtocol.getResponseId &&
      protocol.getRequestId === BaseProtocol.getRequestId
    ) {
      console.warn('[proxy] Please check the protocol, getResponseId is defined but getRequestId is not defined, this may cause problems')
    }

    return protocol
  }

  /**
   * 注册系统路由
   */
  registerSystemRoutes() {
    if (this.__protocol.systemRoutes) {
      this.__protocol.systemRoutes.forEach(r => {
        this.subscribeEvent(r.rule, r.handler, true)
      })
    }
  }

  /**
   * 发送事件
   * @param {Object} msg 事件对象
   */
  sendMessage(msg) {
    const message = this.toText(msg)
    if (message == null) {
      console.warn('[proxy] sendMessage: unsupported message type', msg)
      return
    }

    this.__protocol.logSend && console.log('[proxy] sendMessage:', message)
    this.__ws.send(message)
  }

  /**
   * 获取回调索引
   * @returns {Number} 回调索引
   */

  getCBIndex() {
    return this.callbackIndex++
  }
}