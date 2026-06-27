import { WebSocketClient } from '../../transport/websocket-client.js';
import type { Logger } from 'pino';
import type { BinanceWebSocketMessage, BinanceWebSocketTickerData, BinanceWebSocketDepthData } from './types.js';
import { BinanceWebSocketError } from './errors.js';

export interface BinanceWebSocketClientOptions {
  heartbeatIntervalMs?: number;
  reconnectMaxAttempts?: number;
  reconnectBaseDelayMs?: number;
  wsUrl?: string;
}

export type BinanceWebSocketEventHandler = (data: BinanceWebSocketMessage) => void;

export class BinanceWebSocketClient extends WebSocketClient {
  private readonly baseWsUrl = 'wss://stream.binance.com:9443/ws';
  private readonly handlers = new Map<string, Set<BinanceWebSocketEventHandler>>();
  private ws: WebSocket | null = null;

  constructor(
    private readonly logger: Logger,
    options: BinanceWebSocketClientOptions = {},
  ) {
    super({
      heartbeatIntervalMs: options.heartbeatIntervalMs ?? 30000,
      reconnectMaxAttempts: options.reconnectMaxAttempts ?? 5,
      reconnectBaseDelayMs: options.reconnectBaseDelayMs ?? 1000,
    });
    this.baseWsUrl = options.wsUrl ?? this.baseWsUrl;
  }

  on(eventType: string, handler: BinanceWebSocketEventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
  }

  off(eventType: string, handler: BinanceWebSocketEventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  async subscribeToTicker(symbol: string): Promise<void> {
    const channel = `${symbol.toLowerCase()}@ticker`;
    this.logger.debug({ channel }, 'Subscribing to ticker stream');
    await this.subscribe(channel);
  }

  async subscribeToDepth(symbol: string, level: number = 20): Promise<void> {
    const channel = `${symbol.toLowerCase()}@depth${level}`;
    this.logger.debug({ channel }, 'Subscribing to depth stream');
    await this.subscribe(channel);
  }

  protected async openConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      void this.resolveWebSocketImplementation()
        .then((wsImpl) => {
          if (!wsImpl) {
            reject(new Error('WebSocket implementation is unavailable'));
            return;
          }

          try {
            this.logger.info('Opening Binance WebSocket connection');
            this.ws = new (wsImpl as new (url: string) => WebSocket)(this.baseWsUrl);

            const handleOpen = (): void => {
              this.logger.info('Binance WebSocket connected');
              this.ws?.removeEventListener('open', handleOpen);
              this.ws?.removeEventListener('error', handleError);
              this.state = 'connected';
              resolve();
            };

            const handleError = (error: Error): void => {
              this.logger.error({ error }, 'Binance WebSocket connection error');
              this.ws?.removeEventListener('open', handleOpen);
              this.ws?.removeEventListener('error', handleError);
              reject(error);
            };

            const handleMessage = (event: { data: string }): void => {
              try {
                const data = JSON.parse(event.data) as BinanceWebSocketMessage;
                this.emitHandlers(data);
              } catch (error) {
                this.logger.error({ error }, 'Failed to parse WebSocket message');
                this.emit('error', new BinanceWebSocketError('Failed to parse WebSocket message', error as unknown));
              }
            };

            const handleClose = (): void => {
              this.logger.warn('Binance WebSocket disconnected');
              this.emit('disconnected');
            };

            this.ws.addEventListener('open', handleOpen);
            this.ws.addEventListener('error', handleError);
            this.ws.addEventListener('message', handleMessage);
            this.ws.addEventListener('close', handleClose);
          } catch (error) {
            this.logger.error({ error }, 'Failed to create WebSocket');
            reject(error);
          }
        })
        .catch((error) => {
          this.logger.error({ error }, 'Failed to resolve WebSocket implementation');
          reject(error);
        });
    });
  }

  private async resolveWebSocketImplementation(): Promise<new (url: string) => WebSocket | undefined> {
    try {
      const wsModule = await import('ws');
      return (wsModule.default ?? wsModule) as new (url: string) => WebSocket;
    } catch {
      if (typeof globalThis.WebSocket !== 'undefined') {
        return globalThis.WebSocket as new (url: string) => WebSocket;
      }

      return undefined;
    }
  }

  protected async closeConnection(): Promise<void> {
    return new Promise((resolve) => {
      if (this.ws) {
        const timeout = setTimeout(() => {
          this.logger.warn('WebSocket close timeout, forcing closure');
          this.ws = null;
          resolve();
        }, 5000);

        this.ws.onclose = (): void => {
          clearTimeout(timeout);
          this.logger.debug('WebSocket closed');
          this.ws = null;
          resolve();
        };

        try {
          this.ws.close();
        } catch (error) {
          clearTimeout(timeout);
          this.logger.error({ error }, 'Error closing WebSocket');
          this.ws = null;
          resolve();
        }
      } else {
        resolve();
      }
    });
  }

  protected async write(payload: unknown): Promise<void> {
    if (!this.ws || this.state !== 'connected') {
      throw new Error('WebSocket is not connected');
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws!.send(JSON.stringify(payload));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  protected async subscribeInternal(channel: string): Promise<void> {
    if (!this.ws) {
      throw new Error('WebSocket is not connected');
    }

    if (this.state !== 'connected') {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      const subscribeMessage = {
        method: 'SUBSCRIBE',
        params: [channel],
        id: Math.floor(Math.random() * 1000000),
      };

      try {
        this.ws!.send(JSON.stringify(subscribeMessage));
        this.logger.debug({ channel }, 'Subscription request sent');
        resolve();
      } catch (error) {
        this.logger.error({ channel, error }, 'Failed to send subscription request');
        reject(error);
      }
    });
  }

  private emitHandlers(data: BinanceWebSocketMessage): void {
    const eventType = data.e as string;

    if (eventType === '24hrTicker') {
      const tickerData = data as BinanceWebSocketTickerData;
      const handlers = this.handlers.get('ticker');
      if (handlers) {
        handlers.forEach((handler) => handler(tickerData));
      }
    } else if (eventType === 'depthUpdate') {
      const depthData = data as BinanceWebSocketDepthData;
      const handlers = this.handlers.get('depth');
      if (handlers) {
        handlers.forEach((handler) => handler(depthData));
      }
    }

    // Also emit to wildcard handlers
    const wildcardHandlers = this.handlers.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach((handler) => handler(data));
    }
  }
}
