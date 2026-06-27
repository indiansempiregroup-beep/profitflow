import { EventEmitter } from 'node:events';

export interface WebSocketClientOptions {
  heartbeatIntervalMs?: number;
  reconnectMaxAttempts?: number;
  reconnectBaseDelayMs?: number;
  heartbeatPayload?: unknown;
}

export abstract class WebSocketClient extends EventEmitter {
  protected state: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  protected reconnectAttempts = 0;
  protected heartbeatTimer?: NodeJS.Timeout;

  constructor(protected readonly options: WebSocketClientOptions = {}) {
    super();
  }

  async connect(): Promise<void> {
    if (this.state === 'connected') {
      return;
    }

    this.state = 'connecting';

    try {
      await this.openConnection();
      this.state = 'connected';
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.emit('connected');
    } catch (error) {
      this.state = 'disconnected';
      await this.handleReconnect(error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.stopHeartbeat();
    this.state = 'disconnected';
    await this.closeConnection();
    this.emit('disconnected');
  }

  async send(payload: unknown): Promise<void> {
    if (this.state !== 'connected') {
      throw new Error('WebSocket is not connected');
    }

    await this.write(payload);
  }

  async subscribe(channel: string): Promise<void> {
    if (this.state !== 'connected') {
      throw new Error('WebSocket is not connected');
    }

    await this.subscribeInternal(channel);
  }

  isConnected(): boolean {
    return this.state === 'connected';
  }

  protected async handleReconnect(error: unknown): Promise<void> {
    const maxAttempts = this.options.reconnectMaxAttempts ?? 3;
    if (this.reconnectAttempts >= maxAttempts) {
      this.emit('error', error);
      return;
    }

    const delayMs = this.calculateBackoff(this.reconnectAttempts);
    this.reconnectAttempts += 1;
    await this.delay(delayMs);
    await this.connect();
  }

  protected calculateBackoff(attempt: number): number {
    const base = this.options.reconnectBaseDelayMs ?? 250;
    return base * 2 ** attempt;
  }

  protected startHeartbeat(): void {
    this.stopHeartbeat();
    const intervalMs = this.options.heartbeatIntervalMs ?? 30000;
    this.heartbeatTimer = setInterval(() => {
      void this.send(this.options.heartbeatPayload ?? { type: 'ping' }).catch((error) => {
        this.emit('error', error);
      });
    }, intervalMs);
  }

  protected stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected abstract openConnection(): Promise<void>;
  protected abstract closeConnection(): Promise<void>;
  protected abstract write(payload: unknown): Promise<void>;
  protected abstract subscribeInternal(channel: string): Promise<void>;
}
