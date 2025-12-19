import { PrismaClient } from '@prisma/client';
import { getDhanClient } from '../services/dhan-client';
import { acquireLock, releaseLock } from '../utils/redis';
import { AppError } from '../middleware/error-handler';

const prisma = new PrismaClient();

export async function executeKillSwitch(userId: string): Promise<void> {
  const lockKey = `user:${userId}:kill_lock`;

  try {
    const lockAcquired = await acquireLock(lockKey);
    
    if (!lockAcquired) {
      throw new AppError(409, 'Kill switch already in progress');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // const dailyState = await prisma.dailyRiskState.findUnique({
    //   where: {
    //     userId_tradingDate: {
    //       userId,
    //       tradingDate: today,
    //     },
    //   },
    // });

    // if (dailyState?.killStatus) {
    //   throw new AppError(400, 'Kill switch already activated today');
    // }

    const dhanClient = await getDhanClient(userId);

    await dhanClient.closeAllPositions();

    await new Promise((resolve) => setTimeout(resolve, 2000));

    await dhanClient.triggerKillSwitch();

    const [positions, startingBalance] = await Promise.all([
      dhanClient.getPositions(),
      dhanClient.getSodLimit(),
    ]);
    const { calculateMTM } = await import('../services/mtm-calculator');
    const { mtm } = calculateMTM(positions);
    const lossPercent = mtm < 0 && startingBalance > 0 
      ? (Math.abs(mtm) / startingBalance) * 100 
      : 0;

    await prisma.dailyRiskState.upsert({
      where: {
        userId_tradingDate: {
          userId,
          tradingDate: today,
        },
      },
      update: {
        killStatus: true,
        mtm,
        invested: startingBalance,
        lossPercent,
      },
      create: {
        userId,
        tradingDate: today,
        killStatus: true,
        mtm,
        invested: startingBalance,
        lossPercent,
      },
    });

    await prisma.killEvent.create({
      data: {
        userId,
        triggerMtm: mtm,
        triggerLossPercent: lossPercent,
      },
    });
  } finally {
    await releaseLock(lockKey);
  }
}

