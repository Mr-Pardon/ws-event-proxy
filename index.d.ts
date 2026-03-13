export type RulePredicate<E = any> = (value: any, event: E) => boolean

export type RouteRule<E = any> = Record<string, any | RulePredicate<E>>

export interface SystemRoute<E = any> {
  rule: RouteRule<E>
  handler: (event: E) => void
}

export interface Protocol<E = any, Req = any, Res = any> {
  /**
   * Whether a ready lifecycle is required.
   */
  needReady?: boolean

  /**
   * Whether to log sending.
   */
  logSend?: boolean

  /**
   * Whether to log receiving.
   */
  logReceive?: boolean

  /**
   * Built-in system routes. They are registered with higher priority.
   */
  systemRoutes?: ReadonlyArray<SystemRoute<E>>

  /**
   * Build a request payload before sending.
   */
  buildRequest?(payload: Req, ctx: { getCBIndex(): number }): any

  /**
   * Extract requestId from an outgoing request.
   */
  getRequestId?(request: any): string | number | null

  /**
   * Extract responseId from an incoming response.
   */
  getResponseId?(response: any): string | number | null

  /**
   * Determine whether an incoming event represents "ready".
   */
  isReadyEvent?(event: E): boolean
}

export interface WebSocketLike {
  send(data: string): void
  addEventListener?(
    type: 'message',
    listener: (event: { data: any }) => void
  ): void
  on?(event: 'message', listener: (data: any) => void): void
}

export interface SendOptions {
  timeout?: number
  expectResponse?: boolean
}

export interface SubscribeTaskOptions<E = any, Req = any> {
  request: Req
  rule: RouteRule<E>
  handler: (event: E) => void
  waitAck?: boolean
  timeout?: number
}

export declare const BaseProtocol: Protocol

export declare class WSProxy<E = any, Req = any, Res = any> {
  constructor(protocol?: Protocol<E, Req, Res>)

  /**
   * Resolved after `bind` has been called.
   */
  connected: Promise<void>

  /**
   * Resolved after ready-event has been received
   * when `needReady` is enabled, otherwise already resolved.
   */
  ready: Promise<void>

  /**
   * Bind a WebSocket-like instance.
   */
  bind(ws: WebSocketLike): void

  /**
   * Handle an incoming message.
   */
  onMessage(message: any): void

  /**
   * Send a one-shot request.
   */
  send(payload: Req, options?: SendOptions): Promise<Res | any | undefined> | undefined

  /**
   * Subscribe events by rule.
   */
  subscribeEvent(rule: RouteRule<E>, handler: (event: E, proxy: WSProxy<E, Req, Res>) => void): () => boolean

  /**
   * Send a request and subscribe to a stream of events.
   */
  subscribeTask(options: SubscribeTaskOptions<E, Req>): Promise<() => boolean>
}

export {}


