/**
 * Protocol Adapter
 */
export const BaseProtocol = {
  /**
   * 是否需要 ready 生命周期
   */
  needReady: false,

  /**
   * 是否打印发送/接收消息
   */
  logSend: false,
  logReceive: false,

  /**
   * 系统路由
   * @type {Array}
   * @property {Object} route 路由对象
   * @property {Object} route.rule 匹配规则
   * @property {Function} route.handler hundler 处理函数
   */
  systemRoutes: Object.freeze([]),

  /**
   * 构建请求
   * @param {Object} payload 请求体
   * @param {Object} ctx 上下文
   * @returns {Object} 构建后的请求体
   */
  buildRequest(payload, ctx) {
    return payload
  },

  /**
   * 从请求中提取 requestId
   * @param {Object} request 请求体
   * @returns {String | Number | null}
   */
  getRequestId(request) {
    return null
  },
  /**
   * 从响应中提取 responseId
   * @param {Object} response 响应体
   * @returns {String | Number | null}
   */
  getResponseId(response) {
    return null
  },

  /**
   * 代表进入Ready状态的事件
   * @param {Object} event
   * @returns {Boolean}
   */
  isReadyEvent(event) {
    return false
  }
}