import { describe, it, expect, vi, beforeEach } from 'vitest';
import pino from 'pino';

// Create a minimal WebSocket mock compatible with the implementation
class MockWebSocket {
  url: string;
  listeners: Record<string, Function[]> = {};
  onclose: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    setTimeout(() => this.emit('open', {}), 0);
  }

  addEventListener(event: string, handler: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(handler);
  }

  removeEventListener(event: string, handler: Function) {
    const arr = this.listeners[event];
    if (!arr) return;
    this.listeners[event] = arr.filter((h) => h !== handler);
  }

  send(data: string) {
    // echo back a subscription confirmation for SUBSCRIBE
    try {
      const parsed = JSON.parse(data);
      if (parsed && parsed.method === 'SUBSCRIBE') {
        const resp = JSON.stringify({ result: null, id: parsed.id });
        this.emit('message', { data: resp });
      }
    } catch (e) {
      // ignore
    }
  }

  close() {
    this.emit('close', {});
    if (typeof this.onclose === 'function') this.onclose();
  }

  emit(event: string, payload: any) {
    const handlers = this.listeners[event] ?? [];
    handlers.forEach((h) => h(payload));
  }
}

vi.mock('ws', () => {
  return {
    default: MockWebSocket,
  };
});

import { BinanceWebSocketClient } from '../websocket-client.js';

describe('BinanceWebSocketClient', () => {
  let logger: pino.Logger;

  beforeEach(() => {
    logger = pino({ level: 'silent' });
  });

  it('connects and subscribes to ticker', async () => {
    const client = new BinanceWebSocketClient(logger, { wsUrl: 'wss://example' });

    await client.connect();
    expect(client.isConnected()).toBe(true);

    let received = false;
    client.on('ticker', (data) => {
      received = true;
    });

    await client.subscribeToTicker('BTCUSDT');

    // allow async message handling
    await new Promise((r) => setTimeout(r, 10));

    expect(received).toBe(false); // no real ticker data sent by mock

    await client.disconnect();
    expect(client.isConnected()).toBe(false);
  });

  it('handles subscribe errors when disconnected', async () => {
    const client = new BinanceWebSocketClient(logger, { wsUrl: 'wss://example' });
    await expect(client.subscribe('btcusdt@ticker')).rejects.toThrow();
  });
});
