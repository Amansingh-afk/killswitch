import { Position } from './dhan-client';

export interface MTMResult {
  mtm: number;
}

export function calculateMTM(positions: Position[]): MTMResult {
  const tradingPositions = positions.filter((p) => {
    const productType = (p.productType || '').toUpperCase();
    return productType !== 'CNC' && productType !== '';
  });

  let totalMTM = 0;

  tradingPositions.forEach((p) => {
    totalMTM += Number(p.unrealizedProfit || 0);
  });

  return {
    mtm: totalMTM,
  };
}

