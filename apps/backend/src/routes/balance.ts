import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getDhanClient } from '../services/dhan-client';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const dhanClient = await getDhanClient(req.userId!);
    const balance = await dhanClient.getBalance();
    
    res.json({ success: true, balance });
  } catch (error) {
    next(error);
  }
});

export { router as balanceRoutes };

