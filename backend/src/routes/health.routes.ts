import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.status(200).json({
    success: true,
    message: 'Digital Gyaan API is running',
    timestamp: new Date().toISOString(),
    database: dbStates[mongoose.connection.readyState],
  });
});

export default router;
