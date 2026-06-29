import { createHmac } from 'node:crypto';
import { decryptJson, encryptJson } from '@/core/crypto.js';

export type SupportedExchangeName = 'Binance' | 'CoinDCX' | 'Bybit' | 'OKX';

export interface ExchangeCredentialPayload {
  apiKey: string;
  secretKey: string;
  passphrase?: string;
  permissions?: string[];
}

export interface ExchangeBalance {
  asset: string;
  free: number;
  locked: number;
  total: number;
}

export interface ExchangeBalanceSnapshot {
  exchangeName: SupportedExchangeName;
  balances: ExchangeBalance[];
  fetchedAt: string;
  error?: string;
}

const exchangeNameMap: Record<SupportedExchangeName, string> = {
  Binance: 'BINANCE',
  CoinDCX: 'COINDCX',
  Bybit: 'BYBIT',
  OKX: 'OKX',
};

export const supportedExchanges: SupportedExchangeName[] = ['Binance', 'CoinDCX', 'Bybit', 'OKX'];

export function encryptCredentials(payload: ExchangeCredentialPayload): string {
  return encryptJson(payload);
}

export function decryptCredentials(encrypted: string): ExchangeCredentialPayload {
  return decryptJson<ExchangeCredentialPayload>(encrypted);
}

export function toRuntimeExchangeName(exchangeName: SupportedExchangeName): string {
  return exchangeNameMap[exchangeName];
}

async function validateBinanceCredentials(credentials: ExchangeCredentialPayload): Promise<void> {
  const timestamp = Date.now();
  const query = `timestamp=${timestamp}`;
  const signature = createHmac('sha256', credentials.secretKey).update(query).digest('hex');
  const response = await fetch(
    `https://api.binance.com/api/v3/account?${query}&signature=${signature}`,
    {
      headers: { 'X-MBX-APIKEY': credentials.apiKey },
    },
  );

  if (!response.ok) {
    throw new Error('Binance rejected the API credentials.');
  }
}

async function validateCoinDCXCredentials(credentials: ExchangeCredentialPayload): Promise<void> {
  const body = JSON.stringify({ timestamp: Date.now() });
  const signature = createHmac('sha256', credentials.secretKey).update(body).digest('hex');
  const response = await fetch('https://api.coindcx.com/exchange/v1/users/balances', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AUTH-APIKEY': credentials.apiKey,
      'X-AUTH-SIGNATURE': signature,
    },
    body,
  });

  if (!response.ok) {
    throw new Error('CoinDCX rejected the API credentials.');
  }
}

async function validateBybitCredentials(credentials: ExchangeCredentialPayload): Promise<void> {
  const timestamp = Date.now().toString();
  const recvWindow = '5000';
  const query = `accountType=UNIFIED&timestamp=${timestamp}&recvWindow=${recvWindow}`;
  const signature = createHmac('sha256', credentials.secretKey)
    .update(timestamp + credentials.apiKey + recvWindow + query)
    .digest('hex');
  const response = await fetch(`https://api.bybit.com/v5/account/wallet-balance?${query}`, {
    headers: {
      'X-BAPI-API-KEY': credentials.apiKey,
      'X-BAPI-SIGN': signature,
      'X-BAPI-TIMESTAMP': timestamp,
      'X-BAPI-RECV-WINDOW': recvWindow,
    },
  });

  if (!response.ok) {
    throw new Error('Bybit rejected the API credentials.');
  }
}

async function validateOkxCredentials(credentials: ExchangeCredentialPayload): Promise<void> {
  const timestamp = new Date().toISOString();
  const method = 'GET';
  const requestPath = '/api/v5/account/balance';
  const passphrase = credentials.passphrase ?? '';
  const prehash = `${timestamp}${method}${requestPath}`;
  const signature = createHmac('sha256', credentials.secretKey).update(prehash).digest('base64');
  const response = await fetch(`https://www.okx.com${requestPath}`, {
    headers: {
      'OK-ACCESS-KEY': credentials.apiKey,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': passphrase,
    },
  });

  if (!response.ok) {
    throw new Error('OKX rejected the API credentials.');
  }
}

export async function validateExchangeCredentials(
  exchangeName: SupportedExchangeName,
  credentials: ExchangeCredentialPayload,
): Promise<void> {
  switch (exchangeName) {
    case 'Binance':
      await validateBinanceCredentials(credentials);
      return;
    case 'CoinDCX':
      await validateCoinDCXCredentials(credentials);
      return;
    case 'Bybit':
      await validateBybitCredentials(credentials);
      return;
    case 'OKX':
      await validateOkxCredentials(credentials);
      return;
    default:
      throw new Error(`Unsupported exchange: ${exchangeName}`);
  }
}

async function fetchBinanceBalances(
  credentials: ExchangeCredentialPayload,
): Promise<ExchangeBalance[]> {
  const timestamp = Date.now();
  const query = `timestamp=${timestamp}`;
  const signature = createHmac('sha256', credentials.secretKey).update(query).digest('hex');
  const response = await fetch(
    `https://api.binance.com/api/v3/account?${query}&signature=${signature}`,
    {
      headers: { 'X-MBX-APIKEY': credentials.apiKey },
    },
  );

  if (!response.ok) {
    throw new Error('Unable to fetch Binance balances.');
  }

  const data = (await response.json()) as {
    balances?: Array<{ asset: string; free: string; locked: string }>;
  };
  return (data.balances ?? [])
    .map((balance) => ({
      asset: balance.asset,
      free: Number(balance.free),
      locked: Number(balance.locked),
      total: Number(balance.free) + Number(balance.locked),
    }))
    .filter((balance) => balance.total > 0)
    .sort((a, b) => b.total - a.total);
}

async function fetchCoinDCXBalances(
  credentials: ExchangeCredentialPayload,
): Promise<ExchangeBalance[]> {
  const body = JSON.stringify({ timestamp: Date.now() });
  const signature = createHmac('sha256', credentials.secretKey).update(body).digest('hex');
  const response = await fetch('https://api.coindcx.com/exchange/v1/users/balances', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AUTH-APIKEY': credentials.apiKey,
      'X-AUTH-SIGNATURE': signature,
    },
    body,
  });

  if (!response.ok) {
    throw new Error('Unable to fetch CoinDCX balances.');
  }

  const data = (await response.json()) as Array<{
    currency: string;
    balance: string;
    locked_balance?: string;
  }>;
  return data
    .map((balance) => ({
      asset: balance.currency,
      free: Number(balance.balance),
      locked: Number(balance.locked_balance ?? 0),
      total: Number(balance.balance) + Number(balance.locked_balance ?? 0),
    }))
    .filter((balance) => balance.total > 0)
    .sort((a, b) => b.total - a.total);
}

async function fetchBybitBalances(
  credentials: ExchangeCredentialPayload,
): Promise<ExchangeBalance[]> {
  const timestamp = Date.now().toString();
  const recvWindow = '5000';
  const query = `accountType=UNIFIED&timestamp=${timestamp}&recvWindow=${recvWindow}`;
  const signature = createHmac('sha256', credentials.secretKey)
    .update(timestamp + credentials.apiKey + recvWindow + query)
    .digest('hex');
  const response = await fetch(`https://api.bybit.com/v5/account/wallet-balance?${query}`, {
    headers: {
      'X-BAPI-API-KEY': credentials.apiKey,
      'X-BAPI-SIGN': signature,
      'X-BAPI-TIMESTAMP': timestamp,
      'X-BAPI-RECV-WINDOW': recvWindow,
    },
  });

  if (!response.ok) {
    throw new Error('Unable to fetch Bybit balances.');
  }

  const data = (await response.json()) as {
    result?: {
      list?: Array<{ coin?: Array<{ coin: string; walletBalance: string; locked: string }> }>;
    };
  };
  const coins = data.result?.list?.[0]?.coin ?? [];
  return coins
    .map((coin) => ({
      asset: coin.coin,
      free: Number(coin.walletBalance) - Number(coin.locked),
      locked: Number(coin.locked),
      total: Number(coin.walletBalance),
    }))
    .filter((balance) => balance.total > 0)
    .sort((a, b) => b.total - a.total);
}

async function fetchOkxBalances(
  credentials: ExchangeCredentialPayload,
): Promise<ExchangeBalance[]> {
  const timestamp = new Date().toISOString();
  const method = 'GET';
  const requestPath = '/api/v5/account/balance';
  const passphrase = credentials.passphrase ?? '';
  const prehash = `${timestamp}${method}${requestPath}`;
  const signature = createHmac('sha256', credentials.secretKey).update(prehash).digest('base64');
  const response = await fetch(`https://www.okx.com${requestPath}`, {
    headers: {
      'OK-ACCESS-KEY': credentials.apiKey,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': passphrase,
    },
  });

  if (!response.ok) {
    throw new Error('Unable to fetch OKX balances.');
  }

  const data = (await response.json()) as {
    data?: Array<{
      details?: Array<{ ccy: string; availBal: string; frozenBal: string; eq: string }>;
    }>;
  };
  const details = data.data?.[0]?.details ?? [];
  return details
    .map((detail) => ({
      asset: detail.ccy,
      free: Number(detail.availBal),
      locked: Number(detail.frozenBal),
      total: Number(detail.eq),
    }))
    .filter((balance) => balance.total > 0)
    .sort((a, b) => b.total - a.total);
}

export async function fetchExchangeBalances(
  exchangeName: SupportedExchangeName,
  credentials: ExchangeCredentialPayload,
): Promise<ExchangeBalance[]> {
  switch (exchangeName) {
    case 'Binance':
      return fetchBinanceBalances(credentials);
    case 'CoinDCX':
      return fetchCoinDCXBalances(credentials);
    case 'Bybit':
      return fetchBybitBalances(credentials);
    case 'OKX':
      return fetchOkxBalances(credentials);
    default:
      throw new Error(`Unsupported exchange: ${exchangeName}`);
  }
}
