import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getDhanClient } from '../services/dhan-client';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const dhanClient = await getDhanClient(req.userId!);
    const positions = await dhanClient.getPositions();
    
    res.json({ success: true, positions });
  } catch (error) {
    next(error);
  }
});

export { router as positionsRoutes };

