import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import pino from 'pino';
import { CoinDCXWebSocketClient } from '../websocket-client.js';

class MockSocket {
  public sentMessages: string[] = [];
  private readonly listeners = new Map<string, Array<(event: unknown) => void>>();

  addEventListener(type: string, listener: (event: unknown) => void): void {
    const handlers = this.listeners.get(type) ?? [];
    handlers.push(listener);
    this.listeners.set(type, handlers);
  }

  removeEventListener(type: string, listener: (event: unknown) => void): void {
    const handlers = this.listeners.get(type) ?? [];
    this.listeners.set(
      type,
      handlers.filter((handler) => handler !== listener),
    );
  }

  send(data: string): void {
    this.sentMessages.push(data);
  }

  close(): void {
    this.emit('close', {});
  }

  emitOpen(): void {
    this.emit('open', {});
  }

  emitMessage(data: string): void {
    this.emit('message', { data });
  }

  private emit(type: string, event: unknown): void {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }
}

describe('CoinDCXWebSocketClient', () => {
  const originalWebSocket = globalThis.WebSocket;

  beforeEach(() => {
    globalThis.WebSocket = class {
      constructor(public readonly url: string) {
        (globalThis as typeof globalThis & { __mockSocket?: MockSocket }).__mockSocket = new MockSocket();
      }

      addEventListener(type: string, listener: (event: unknown) => void): void {
        (globalThis as typeof globalThis & { __mockSocket?: MockSocket }).__mockSocket?.addEventListener(type, listener);
      }

      removeEventListener(type: string, listener: (event: unknown) => void): void {
        (globalThis as typeof globalThis & { __mockSocket?: MockSocket }).__mockSocket?.removeEventListener(type, listener);
      }

      send(data: string): void {
        (globalThis as typeof globalThis & { __mockSocket?: MockSocket }).__mockSocket?.send(data);
      }

      close(): void {
        (globalThis as typeof globalThis & { __mockSocket?: MockSocket }).__mockSocket?.close();
      }
    } as unknown as typeof WebSocket;
  });

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket;
    delete (globalThis as typeof globalThis & { __mockSocket?: MockSocket }).__mockSocket;
  });

  it('subscribes to ticker streams and emits ticker updates', async () => {
    const client = new CoinDCXWebSocketClient(pino({ level: 'silent' }), { wsUrl: 'wss://example.test' });
    const events: unknown[] = [];

    client.on('ticker', (payload) => {
      events.push(payload);
    });

    await client.connect();
    await client.subscribeToTicker('BTC/INR');

    const socket = (globalThis as typeof globalThis & { __mockSocket?: MockSocket }).__mockSocket;
    socket?.emitOpen();
    socket?.emitMessage(JSON.stringify({ channel: 'ticker', symbol: 'BTC/INR', lastPrice: '5000000' }));

    expect(socket?.sentMessages[0]).toContain('subscribe');
    expect(events).toHaveLength(1);
    expect((events[0] as { symbol: string }).symbol).toBe('BTC/INR');
  });
});
