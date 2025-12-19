import { PrismaClient } from '@prisma/client';
import { decrypt } from '../utils/encryption';
import { AppError } from '../middleware/error-handler';
import { getCachedSodBalance, setCachedSodBalance } from '../utils/redis';

const prisma = new PrismaClient();

const BASE_URL = process.env.DHAN_API_BASE_URL || 'https://api.dhan.co';
const API_VERSION = process.env.DHAN_API_VERSION || '/v2';

export interface Position {
  dhanClientId: string;
  tradingSymbol: string;
  securityId: string;
  positionType: 'LONG' | 'SHORT' | 'CLOSED';
  exchangeSegment: string;
  productType: string;
  netQty: number;
  costPrice: number;
  buyAvg: number;
  sellAvg: number;
  unrealizedProfit: number;
  realizedProfit: number;
  [key: string]: any;
}

export interface Balance {
  availableBalance: number;
  sodLimit: number;
  utilizedAmount: number;
  withdrawableBalance: number;
  collateralAmount: number;
  receiveableAmount: number;
  blockedPayoutAmount: number;
}

class DhanClient {
  private accessToken: string;
  private dhanClientId: string;

  constructor(accessToken: string, dhanClientId: string) {
    this.accessToken = accessToken;
    this.dhanClientId = dhanClientId;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${API_VERSION}${path}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'access-token': this.accessToken,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
      const errorMessage = typeof errorData === 'object' && errorData !== null && 'message' in errorData
        ? String(errorData.message)
        : 'Dhan API request failed';
      
      if (response.status === 401) {
        throw new AppError(400, 'Dhan API token is invalid or expired. Please update your Dhan token in settings.');
      }
      
      throw new AppError(response.status, errorMessage);
    }

    return response.json() as Promise<T>;
  }

  async getPositions(): Promise<Position[]> {
    const data = await this.request<Position[]>('/positions');
    return Array.isArray(data) ? data : [];
  }

  async getBalance(): Promise<Balance> {
    const data = await this.request<any>('/fundlimit');
    const balance = {
      availableBalance: data.availabelBalance || 0,
      sodLimit: data.sodLimit || 0,
      utilizedAmount: data.utilizedAmount || 0,
      withdrawableBalance: data.withdrawableBalance || 0,
      collateralAmount: data.collateralAmount || 0,
      receiveableAmount: data.receiveableAmount || 0,
      blockedPayoutAmount: data.blockedPayoutAmount || 0,
    };
    
    // Cache SOD balance for future calls
    if (balance.sodLimit > 0) {
      await setCachedSodBalance(this.dhanClientId, balance.sodLimit);
    }
    
    return balance;
  }

  async getSodLimit(): Promise<number> {
    const cached = await getCachedSodBalance(this.dhanClientId);
    if (cached !== null && cached > 0) {
      return cached;
    }
    
    const balance = await this.getBalance();
    return balance.sodLimit;
  }

  async closeAllPositions(): Promise<void> {
    const positions = await this.getPositions();
    
    const tradingPositions = positions.filter((p) => {
      const productType = (p.productType || '').toUpperCase();
      return productType !== 'CNC' && productType !== '' && Math.abs(p.netQty || 0) > 0;
    });

    for (const position of tradingPositions) {
      const netQty = Number(position.netQty || 0);
      if (netQty === 0) continue;

      const transactionType = netQty > 0 ? 'SELL' : 'BUY';
      const quantity = Math.abs(netQty);

      const orderData: any = {
        dhanClientId: position.dhanClientId || this.dhanClientId,
        transactionType,
        exchangeSegment: position.exchangeSegment,
        productType: position.productType,
        orderType: 'MARKET',
        validity: 'DAY',
        tradingSymbol: position.tradingSymbol,
        securityId: position.securityId,
        quantity,
      };

      if (position.drvExpiryDate && position.drvExpiryDate !== '0001-01-01') {
        orderData.drvExpiryDate = position.drvExpiryDate;
      }
      if (position.drvOptionType && position.drvOptionType !== 'NA') {
        orderData.drvOptionType = position.drvOptionType;
        orderData.drvStrikePrice = position.drvStrikePrice || 0;
      }

      await this.request('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });

      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  async triggerKillSwitch(): Promise<void> {
    const url = `${BASE_URL}${API_VERSION}/killswitch?killSwitchStatus=ACTIVATE`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'access-token': this.accessToken,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
      const errorMessage = typeof errorData === 'object' && errorData !== null && 'message' in errorData
        ? String(errorData.message)
        : 'Dhan API request failed';
      
      if (response.status === 401) {
        throw new AppError(400, 'Dhan API token is invalid or expired. Please update your Dhan token in settings.');
      }
      
      throw new AppError(response.status, errorMessage);
    }
  }

  async renewToken(): Promise<string> {
    const url = `${BASE_URL}${API_VERSION}/RenewToken`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'access-token': this.accessToken,
        'dhanClientId': this.dhanClientId,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
      const errorMessage = typeof errorData === 'object' && errorData !== null && 'message' in errorData
        ? String(errorData.message)
        : 'Token renewal failed';
      
      if (response.status === 401) {
        throw new AppError(401, 'Current token is invalid. Please generate a new token from Dhan Web.');
      }
      
      throw new AppError(response.status, errorMessage);
    }

    const data = await response.json() as { access_token?: string; accessToken?: string };
    return data.access_token || data.accessToken || '';
  }

  getClientId(): string {
    return this.dhanClientId;
  }
}

export async function getDhanClient(userId: string): Promise<DhanClient> {
  const user = await prisma.user.findUnique({
    where: { userId },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  if (!user.accessTokenEncrypted || !user.dhanClientId) {
    throw new AppError(400, 'Dhan token not configured. Please add your Dhan token in settings.');
  }

  if (!process.env.ENCRYPTION_KEY) {
    throw new AppError(500, 'Encryption key not configured');
  }

  const accessToken = decrypt(user.accessTokenEncrypted, process.env.ENCRYPTION_KEY);

  return new DhanClient(accessToken, user.dhanClientId);
}

