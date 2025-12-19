export type RiskStatus = 'SAFE' | 'TRIGGER';

export function evaluateRisk(
  mtm: number,
  startingBalance: number,
  threshold: number
): RiskStatus {
  if (startingBalance === 0) {
    return 'SAFE';
  }

  const lossPercent = mtm < 0 ? (Math.abs(mtm) / startingBalance) * 100 : 0;

  if (mtm < 0 && lossPercent >= threshold) {
    return 'TRIGGER';
  }

  return 'SAFE';
}

