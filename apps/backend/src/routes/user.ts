import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import { authenticate, AuthRequest } from '../middleware/auth';
import { encrypt } from '../utils/encryption';
import { getDhanClient } from '../services/dhan-client';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

const updateSettingsSchema = z.object({
  riskThreshold: z.number().min(0).max(100).optional(),
  dhanToken: z.string().optional(),
  dhanClientId: z.string().optional(),
  killSwitchEnabled: z.boolean().optional(),
});

router.get('/profile', async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { userId: req.userId! },
      select: {
        userId: true,
        email: true,
        dhanClientId: true,
        riskThreshold: true,
        killSwitchEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

router.put('/settings', async (req: AuthRequest, res, next) => {
  try {
    const data = updateSettingsSchema.parse(req.body);
    const updateData: any = {};

    if (data.riskThreshold !== undefined) {
      updateData.riskThreshold = data.riskThreshold;
    }

    if (data.dhanToken) {
      if (!process.env.ENCRYPTION_KEY) {
        throw new AppError(500, 'Encryption key not configured on server');
      }
      
      const encryptionKey = process.env.ENCRYPTION_KEY;
      if (!encryptionKey || encryptionKey.trim().length === 0) {
        throw new AppError(500, 'Encryption key is empty');
      }

      try {
        updateData.accessTokenEncrypted = encrypt(data.dhanToken, encryptionKey);
      } catch (encryptError: any) {
        throw new AppError(500, `Failed to encrypt token: ${encryptError.message}`);
      }
    }

    if (data.dhanClientId !== undefined) {
      updateData.dhanClientId = data.dhanClientId || null;
    }

    if (data.killSwitchEnabled !== undefined) {
      updateData.killSwitchEnabled = data.killSwitchEnabled;
    }

    const user = await prisma.user.update({
      where: { userId: req.userId! },
      data: updateData,
      select: {
        userId: true,
        email: true,
        dhanClientId: true,
        riskThreshold: true,
        killSwitchEnabled: true,
        updatedAt: true,
      },
    });

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

router.post('/renew-token', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    
    const dhanClient = await getDhanClient(userId);
    const newToken = await dhanClient.renewToken();

    if (!process.env.ENCRYPTION_KEY) {
      throw new AppError(500, 'Encryption key not configured on server');
    }

    const encryptedToken = encrypt(newToken, process.env.ENCRYPTION_KEY);

    await prisma.user.update({
      where: { userId },
      data: { accessTokenEncrypted: encryptedToken },
    });

    res.json({ 
      success: true, 
      message: 'Token renewed successfully. New token valid for 24 hours.' 
    });
  } catch (error) {
    next(error);
  }
});

export { router as userRoutes };

