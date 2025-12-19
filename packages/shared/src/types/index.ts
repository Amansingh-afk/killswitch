// User types
export interface User {
  userId: string;
  email: string;
  dhanClientId: string | null;
  riskThreshold: number;
  killSwitchEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Position types
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

// Balance types
export interface Balance {
  availableBalance: number;
  sodLimit: number;
  utilizedAmount: number;
  withdrawableBalance: number;
  collateralAmount: number;
  receiveableAmount: number;
  blockedPayoutAmount: number;
}

// Risk types
export interface RiskStatus {
  mtm: number;
  startingBalance: number;
  lossPercent: number;
  riskStatus: 'SAFE' | 'TRIGGER';
  threshold: number;
  killStatus: boolean;
}

// Kill event types
export interface KillEvent {
  id: string;
  triggerMtm: number | null;
  triggerLossPercent: number | null;
  executionTime: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

