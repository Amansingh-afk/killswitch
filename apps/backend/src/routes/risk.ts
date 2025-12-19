import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getDhanClient } from '../services/dhan-client';
import { calculateMTM } from '../services/mtm-calculator';
import { evaluateRisk } from '../services/risk-rules';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error-handler';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

router.get('/status', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    
    const user = await prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const dhanClient = await getDhanClient(userId);
    const [positions, balance] = await Promise.all([
      dhanClient.getPositions(),
      dhanClient.getBalance(),
    ]);

    const { mtm } = calculateMTM(positions);
    const startingBalance = balance.sodLimit;

    const lossPercent = mtm < 0 && startingBalance > 0 
      ? (Math.abs(mtm) / startingBalance) * 100 
      : 0;

    const riskStatus = evaluateRisk(
      mtm,
      startingBalance,
      Number(user.riskThreshold)
    );

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

    res.json({
      success: true,
      risk: {
        mtm: Number(mtm),
        startingBalance: Number(startingBalance),
        lossPercent: Number(lossPercent),
        riskStatus,
        threshold: Number(user.riskThreshold),
        killStatus: dailyState.killStatus,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/events', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const page = parseInt(req.query.page as string) || 1;
    const offset = parseInt(req.query.offset as string);
    
    const skip = offset !== undefined && !req.query.page ? offset : (page - 1) * limit;
    const currentPage = offset !== undefined && !req.query.page ? Math.floor(offset / limit) + 1 : page;

    const [total, events] = await Promise.all([
      prisma.killEvent.count({
        where: { userId },
      }),
      prisma.killEvent.findMany({
        where: { userId },
        orderBy: { executionTime: 'desc' },
        take: limit,
        skip: skip,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      events: events.map((event) => ({
        id: event.id,
        triggerMtm: event.triggerMtm ? Number(event.triggerMtm) : null,
        triggerLossPercent: event.triggerLossPercent
          ? Number(event.triggerLossPercent)
          : null,
        executionTime: event.executionTime,
      })),
      pagination: {
        total,
        totalPages,
        currentPage,
        limit,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/history', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const days = Math.min(parseInt(req.query.days as string) || 30, 90);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const history = await prisma.dailyRiskState.findMany({
      where: {
        userId,
        tradingDate: {
          gte: startDate,
        },
      },
      orderBy: {
        tradingDate: 'asc',
      },
    });

    res.json({
      success: true,
      history: history.map((state) => ({
        tradingDate: state.tradingDate.toISOString().split('T')[0],
        mtm: Number(state.mtm),
        invested: Number(state.invested),
        lossPercent: Number(state.lossPercent),
        killStatus: state.killStatus,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/reset', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await prisma.dailyRiskState.updateMany({
      where: {
        userId,
        tradingDate: today,
      },
      data: {
        mtm: 0,
        invested: 0,
        lossPercent: 0,
        killStatus: false,
      },
    });

    res.json({
      success: true,
      message: 'Daily risk state reset successfully',
      recordsUpdated: result.count,
    });
  } catch (error) {
    next(error);
  }
});

export { router as riskRoutes };

