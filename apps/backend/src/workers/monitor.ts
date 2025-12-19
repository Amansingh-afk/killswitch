import { PrismaClient } from '@prisma/client';
import { getDhanClient } from '../services/dhan-client';
import { calculateMTM } from '../services/mtm-calculator';
import { evaluateRisk } from '../services/risk-rules';
import { executeKillSwitch } from '../executors/kill-executor';
import { AppError } from '../middleware/error-handler';

const prisma = new PrismaClient();

const MONITOR_INTERVAL = 500; // Target interval between cycles
const MIN_INTERVAL = 100;     // Minimum delay between cycles

const lastWarningTime = new Map<string, number>();
const WARNING_COOLDOWN = 5 * 60 * 1000;

let isMonitoring = false;

async function monitorUser(userId: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { userId },
    });

    if (!user || !user.accessTokenEncrypted) {
      return;
    }

    if (!user.killSwitchEnabled) {
      return;
    }

    const dhanClient = await getDhanClient(userId);
    
    const [positions, startingBalance] = await Promise.all([
      dhanClient.getPositions(),
      dhanClient.getSodLimit(),
    ]);

    const { mtm } = calculateMTM(positions);

    const lossPercent = mtm < 0 && startingBalance > 0 
      ? (Math.abs(mtm) / startingBalance) * 100 
      : 0;

    const riskStatus = evaluateRisk(mtm, startingBalance, Number(user.riskThreshold));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyState = await prisma.dailyRiskState.upsert({
      where: {
        userId_tradingDate: {
          userId,
          tradingDate: today,
        },
      },
      update: {
        mtm,
        invested: startingBalance,
        lossPercent,
        killStatus: riskStatus === 'TRIGGER',
      },
      create: {
        userId,
        tradingDate: today,
        mtm,
        invested: startingBalance,
        lossPercent,
        killStatus: riskStatus === 'TRIGGER',
      },
    });

    console.log('Daily state', dailyState);
    if (riskStatus === 'TRIGGER' && !dailyState.killStatus) {
      console.log('Triggering kill switch for user', userId);
      await executeKillSwitch(userId);
    }
  } catch (error) {
    if (error instanceof AppError) {
      if (error.statusCode === 400) {
        return;
      }
      if (error.statusCode === 401) {
        const now = Date.now();
        const lastWarning = lastWarningTime.get(userId) || 0;
        if (now - lastWarning > WARNING_COOLDOWN) {
          lastWarningTime.set(userId, now);
        }
        return;
      }
      if (error.statusCode === 404) {
        return;
      }
    }
  }
}

async function runMonitoringCycle(): Promise<void> {
  const cycleStart = Date.now();
  
  try {
    const users = await prisma.user.findMany({
      where: {
        accessTokenEncrypted: {
          not: null,
        },
        dhanClientId: {
          not: null,
        },
        killSwitchEnabled: true,
      },
      select: {
        userId: true,
      },
    });

    if (users.length > 0) {
      await Promise.allSettled(users.map((user) => monitorUser(user.userId)));
    }
  } catch (error) {
    console.error('[Monitor] Cycle error:', error);
  }

  // Schedule next cycle (no overlap - waits for this cycle to complete)
  if (isMonitoring) {
    const elapsed = Date.now() - cycleStart;
    const nextDelay = Math.max(MONITOR_INTERVAL - elapsed, MIN_INTERVAL);
    setTimeout(runMonitoringCycle, nextDelay);
  }
}

export async function startMonitoring(): Promise<void> {
  if (isMonitoring) {
    console.log('[Monitor] Already running');
    return;
  }
  
  isMonitoring = true;
  console.log(`[Monitor] Started with ${MONITOR_INTERVAL}ms target interval`);
  
  // Start the first cycle
  runMonitoringCycle();
}

export function stopMonitoring(): void {
  isMonitoring = false;
  console.log('[Monitor] Stopped');
}

