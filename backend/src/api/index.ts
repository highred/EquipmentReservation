import { Router } from 'express';
import usersRouter from './users';
import equipmentRouter from './equipment';
import reservationsRouter from './reservations';
import aiRouter from './ai';

const router: Router = Router();

router.use('/users', usersRouter);
router.use('/equipment', equipmentRouter);
router.use('/reservations', reservationsRouter);
router.use('/ai', aiRouter);

export default router;