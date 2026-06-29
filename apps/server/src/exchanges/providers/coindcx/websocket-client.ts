import { WebSocketClient } from '../../transport/websocket-client.js';
import type { Logger } from 'pino';

export interface CoinDCXWebSocketClientOptions {
  heartbeatIntervalMs?: number;
  reconnectMaxAttempts?: number;
  reconnectBaseDelayMs?: number;
  wsUrl?: string;
}

export type CoinDCXWebSocketEventHandler = (data: Record<string, unknown>) => void;

export class CoinDCXWebSocketClient extends WebSocketClient {
  private baseWsUrl = 'wss://ws.coindcx.com';
  private readonly handlers = new Map<string, Set<CoinDCXWebSocketEventHandler>>();
  private ws: WebSocket | null = null;

  constructor(
    private readonly logger: Logger,
    options: CoinDCXWebSocketClientOptions = {},
  ) {
    super({
      heartbeatIntervalMs: options.heartbeatIntervalMs ?? 30000,
      reconnectMaxAttempts: options.reconnectMaxAttempts ?? 5,
      reconnectBaseDelayMs: options.reconnectBaseDelayMs ?? 1000,
    });
    this.baseWsUrl = options.wsUrl ?? this.baseWsUrl;
  }

  on(eventType: string, handler: CoinDCXWebSocketEventHandler): this {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
    return this;
  }

  off(eventType: string, handler: CoinDCXWebSocketEventHandler): this {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
    return this;
  }

  async subscribeToTicker(symbol: string): Promise<void> {
    const channel = `ticker:${symbol}`;
    this.logger.debug({ channel }, 'Subscribing to CoinDCX ticker stream');
    await this.subscribe(channel);
  }

  protected async openConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.logger.info('Opening CoinDCX WebSocket connection');

        const WebSocketLib = globalThis.WebSocket;
        if (!WebSocketLib) {
          reject(new Error('WebSocket implementation is unavailable'));
          return;
        }

        this.ws = new WebSocketLib(this.baseWsUrl);

        const handleOpen = (): void => {
          this.logger.info('CoinDCX WebSocket connected');
          this.ws?.removeEventListener('open', handleOpen);
          this.ws?.removeEventListener('error', handleError);
          this.state = 'connected';
          resolve();
        };

        const handleError = (error: Event | Error): void => {
          this.logger.error({ error }, 'CoinDCX WebSocket connection error');
          this.ws?.removeEventListener('open', handleOpen);
          this.ws?.removeEventListener('error', handleError);
          reject(error instanceof Error ? error : new Error('WebSocket connection error'));
        };

        const handleMessage = (event: MessageEvent | { data: string }): void => {
          try {
            const raw = (event as MessageEvent).data ?? (event as { data: string }).data;
            const data = JSON.parse(raw as string) as Record<string, unknown>;
            this.emitHandlers(data);
          } catch (error) {
            this.logger.error({ error }, 'Failed to parse CoinDCX WebSocket message');
          }
        };

        const handleClose = (): void => {
          this.logger.warn('CoinDCX WebSocket disconnected');
          this.emit('disconnected');
        };

        this.ws.addEventListener('open', handleOpen);
        this.ws.addEventListener('error', handleError as unknown as EventListener);
        this.ws.addEventListener('message', handleMessage as unknown as EventListener);
        this.ws.addEventListener('close', handleClose as unknown as EventListener);

        this.state = 'connected';
        resolve();
      } catch (error) {
        this.logger.error({ error }, 'Failed to create CoinDCX WebSocket');
        reject(error);
      }
    });
  }

  protected async closeConnection(): Promise<void> {
    return new Promise((resolve) => {
      if (this.ws) {
        try {
          this.ws.close();
        } catch (error) {
          this.logger.error({ error }, 'Error closing CoinDCX WebSocket');
        }
      }
      this.ws = null;
      resolve();
    });
  }

  protected async write(payload: unknown): Promise<void> {
    if (!this.ws || this.state !== 'connected') {
      throw new Error('WebSocket is not connected');
    }

    this.ws.send(JSON.stringify(payload));
  }

  protected async subscribeInternal(channel: string): Promise<void> {
    if (!this.ws || this.state !== 'connected') {
      throw new Error('WebSocket is not connected');
    }

    this.ws.send(JSON.stringify({ method: 'subscribe', channel }));
  }

  private emitHandlers(data: Record<string, unknown>): void {
    const channel = String(data.channel ?? '');
    const handlers = this.handlers.get(channel);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }

    const wildcardHandlers = this.handlers.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach((handler) => handler(data));
    }
  }
}
