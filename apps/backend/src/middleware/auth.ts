import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error-handler';

export interface AuthRequest extends Request {
  userId?: string;
}

export const authenticate = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      throw new AppError(401, 'Authentication required');
    }

    if (!process.env.JWT_SECRET) {
      throw new AppError(500, 'JWT_SECRET not configured');
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    ) as { userId: string };

    req.userId = decoded.userId;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(401, 'Invalid or expired token');
  }
};

