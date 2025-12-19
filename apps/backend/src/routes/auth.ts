import { Router, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import { encrypt } from '../utils/encryption';
import { AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  dhanToken: z.string().optional(),
  dhanClientId: z.string().optional(),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  dhanToken: z.string().optional(),
  dhanClientId: z.string().optional(),
});

router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const { email, password, dhanToken, dhanClientId } = data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError(400, 'User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let accessTokenEncrypted = null;
    if (dhanToken && process.env.ENCRYPTION_KEY) {
      accessTokenEncrypted = encrypt(dhanToken, process.env.ENCRYPTION_KEY);
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        dhanClientId: dhanClientId || null,
        accessTokenEncrypted,
      },
    });

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new AppError(500, 'JWT_SECRET not configured');
    }
    const payload = { userId: user.userId };
    const secret: string = jwtSecret;
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    const options: SignOptions = { expiresIn: expiresIn as SignOptions['expiresIn'] };
    const token: string = jwt.sign(payload, secret, options);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      user: {
        userId: user.userId,
        email: user.email,
        dhanClientId: user.dhanClientId,
        riskThreshold: user.riskThreshold,
        killSwitchEnabled: user.killSwitchEnabled,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const { email, password, dhanToken, dhanClientId } = data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError(401, 'Invalid credentials');
    }

    let accessTokenEncrypted = user.accessTokenEncrypted;
    if (dhanToken && process.env.ENCRYPTION_KEY) {
      accessTokenEncrypted = encrypt(dhanToken, process.env.ENCRYPTION_KEY);
      
      await prisma.user.update({
        where: { userId: user.userId },
        data: {
          accessTokenEncrypted,
          ...(dhanClientId && { dhanClientId }),
        },
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new AppError(500, 'JWT_SECRET not configured');
    }
    const payload = { userId: user.userId };
    const secret: string = jwtSecret;
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    const options: SignOptions = { expiresIn: expiresIn as SignOptions['expiresIn'] };
    const token: string = jwt.sign(payload, secret, options);

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    };
    
    res.cookie('token', token, cookieOptions);

    res.json({
      success: true,
      user: {
        userId: user.userId,
        email: user.email,
        dhanClientId: user.dhanClientId,
        riskThreshold: user.riskThreshold,
        killSwitchEnabled: user.killSwitchEnabled,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (_req: AuthRequest, res: Response) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
});

export { router as authRoutes };

