import { Router } from 'express';
import { ApiController } from './controllers/api.controller';
import { prisma } from './db';
import { EventEmitter as SysEmitter } from 'events';

export const apiRouter = Router();
export const sseEvents = new SysEmitter();

const authMiddleware = async (req: any, res: any, next: any) => {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(401).json({ error: 'Unauthorized' });
        req.user = user;
        next();
    } catch(e) {
        res.status(500).json({ error: 'Server error' });
    }
};

apiRouter.get('/users', async (req: any, res: any) => {
    res.json(await prisma.user.findMany({ include: { zone: true } }));
});

apiRouter.use(authMiddleware);

apiRouter.get('/sensors', ApiController.getSensors);
apiRouter.post('/sensors/:id/rules', ApiController.updateSensorRules);
apiRouter.get('/alerts', ApiController.getAlerts);
apiRouter.get('/sensors/:id/history', ApiController.getHistory);
apiRouter.post('/suppression', ApiController.createSuppression);
apiRouter.post('/alerts/:id/transition', ApiController.transitionAlert);
apiRouter.get('/alerts/:id/audit', ApiController.getAlertAudit);
apiRouter.get('/live', ApiController.sseLive);
