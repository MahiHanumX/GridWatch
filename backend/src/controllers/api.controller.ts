import { Request, Response } from 'express';
import { prisma } from '../db';
import { sseEvents } from '../routes';

export class ApiController {
    
    static getSensors = async (req: any, res: Response) => {
        try {
            const where = req.user.role === 'operator' ? { zoneId: req.user.zoneId } : {};
            const sensors = await prisma.sensor.findMany({ where, include: { zone: true } });
            res.json(sensors);
        } catch (e) { res.status(500).json({ error: 'Error fetching sensors' }); }
    };

    static async updateSensorRules(req: any, res: Response) {
        const { id } = req.params;
        const { ruleAMinVoltage, ruleAMaxVoltage, ruleAMinTemp, ruleAMaxTemp, ruleBChangeThreshold } = req.body;
        try {
            if (req.user.role === 'operator') {
                const sensor = await prisma.sensor.findUnique({ where: { id } });
                if (!sensor || sensor.zoneId !== req.user.zoneId) {
                    return res.status(403).json({ error: 'Forbidden' });
                }
            }
            const updated = await prisma.sensor.update({
                where: { id },
                data: {
                    ruleAMinVoltage: ruleAMinVoltage !== undefined ? (ruleAMinVoltage === null ? null : Number(ruleAMinVoltage)) : undefined,
                    ruleAMaxVoltage: ruleAMaxVoltage !== undefined ? (ruleAMaxVoltage === null ? null : Number(ruleAMaxVoltage)) : undefined,
                    ruleAMinTemp: ruleAMinTemp !== undefined ? (ruleAMinTemp === null ? null : Number(ruleAMinTemp)) : undefined,
                    ruleAMaxTemp: ruleAMaxTemp !== undefined ? (ruleAMaxTemp === null ? null : Number(ruleAMaxTemp)) : undefined,
                    ruleBChangeThreshold: ruleBChangeThreshold !== undefined ? (ruleBChangeThreshold === null ? null : Number(ruleBChangeThreshold)) : undefined,
                }
            });
            res.json(updated);
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static getAlerts = async (req: any, res: Response) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 100;
            
            const where: any = req.user.role === 'operator' ? { sensor: { zoneId: req.user.zoneId } } : {};
            
            if (req.query.status) {
                where.status = req.query.status;
            } else {
                where.status = { in: ['open', 'acknowledged'] };
            }
            if (req.query.severity) {
                where.severity = req.query.severity;
            }
            where.isSuppressed = false;

            const alerts = await prisma.alert.findMany({
                where,
                include: { anomaly: true, sensor: true },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: (page - 1) * limit
            });
            
            const total = await prisma.alert.count({ where });
            
            res.json({ data: alerts, page, limit, total });
        } catch (e) { res.status(500).json({ error: 'Error fetching alerts' }); }
    };
    static async getHistory(req: any, res: Response) {
        const { from, to } = req.query;
        const { id } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = 100;

        if (!from || !to) return res.status(400).json({ error: 'Missing from/to' });

        try {
            if (req.user.role === 'operator') {
                const sensor = await prisma.sensor.findUnique({ where: { id } });
                if (!sensor || sensor.zoneId !== req.user.zoneId) {
                    return res.status(403).json({ error: 'Forbidden' });
                }
            }

            const readings = await prisma.reading.findMany({
                where: {
                    sensorId: id,
                    timestamp: {
                        gte: new Date(from as string),
                        lte: new Date(to as string)
                    }
                },
                orderBy: { timestamp: 'desc' },
                take: limit,
                skip: (page - 1) * limit,
                include: {
                    anomalies: {
                        include: { alerts: true }
                    }
                }
            });

            const data = readings.map((r: any) => ({
                id: r.id,
                sensorId: r.sensorId,
                voltage: r.voltage,
                current: r.current,
                temperature: r.temperature,
                statusCode: r.statusCode,
                timestamp: r.timestamp,
                createdAt: r.createdAt,
                has_anomaly: r.anomalies.length > 0,
                anomalies: r.anomalies.map((an: any) => ({
                    id: an.id,
                    ruleType: an.ruleType,
                    description: an.description,
                    isSuppressed: an.isSuppressed,
                    alertId: an.alerts.length > 0 ? an.alerts[0].id : null,
                    alertStatus: an.alerts.length > 0 ? an.alerts[0].status : null,
                    alertSeverity: an.alerts.length > 0 ? an.alerts[0].severity : null
                }))
            }));

            res.json({ data, page, limit });
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async createSuppression(req: any, res: Response) {
        const { sensor_id, start_time, end_time } = req.body;
        try {
            if (req.user.role === 'operator') {
                const sensor = await prisma.sensor.findUnique({ where: { id: sensor_id } });
                if (!sensor || sensor.zoneId !== req.user.zoneId) {
                    return res.status(403).json({ error: 'Forbidden' });
                }
            }

            await prisma.$transaction(async (tx: any) => {
                await tx.suppression.create({
                    data: {
                        sensorId: sensor_id,
                        startTime: new Date(start_time),
                        endTime: new Date(end_time),
                        createdBy: req.user.id
                    }
                });

                const openAlerts = await tx.alert.findMany({
                    where: { sensorId: sensor_id, status: { in: ['open', 'acknowledged'] }, isSuppressed: false }
                });

                for (const a of openAlerts) {
                    await tx.alert.update({
                        where: { id: a.id },
                        data: { isSuppressed: true, updatedAt: new Date() }
                    });
                    
                    await tx.anomaly.update({
                        where: { id: a.anomalyId },
                        data: { isSuppressed: true }
                    });
                }
            });
            
            res.status(201).json({ status: 'success' });
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async transitionAlert(req: any, res: Response) {
        const { id } = req.params;
        const { status } = req.body;
        
        const valid = ['open', 'acknowledged', 'resolved'];
        if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

        try {
            await prisma.$transaction(async (tx: any) => {
                const alert = await tx.alert.findUnique({ 
                    where: { id },
                    include: { sensor: true }
                });
                if (!alert) throw new Error("Not found");
                
                if (req.user.role === 'operator' && alert.sensor.zoneId !== req.user.zoneId) {
                    throw new Error("Forbidden");
                }
                
                if (alert.status === status) return; // Ignore if same status
                
                const validTransitions: any = {
                    'open': ['acknowledged', 'resolved'],
                    'acknowledged': ['resolved'],
                    'resolved': []
                };

                if (!validTransitions[alert.status].includes(status)) {
                    throw new Error("Invalid transition");
                }
                
                await tx.alert.update({
                    where: { id },
                    data: { status, updatedAt: new Date() }
                });
                
                await tx.alertAuditLog.create({
                    data: {
                        alertId: id,
                        fromStatus: alert.status,
                        toStatus: status,
                        changedBy: req.user.id
                    }
                });
            });
            res.json({ status: 'success' });
        } catch (e: any) {
            if (e.message === 'Not found') return res.status(404).json({ error: 'Not found' });
            if (e.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' });
            if (e.message === 'Invalid transition') return res.status(400).json({ error: 'Invalid transition' });
            
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async getAlertAudit(req: any, res: Response) {
        const { id } = req.params;
        try {
            if (req.user.role === 'operator') {
                const alert = await prisma.alert.findUnique({
                    where: { id },
                    include: { sensor: true }
                });
                if (!alert || alert.sensor.zoneId !== req.user.zoneId) {
                    return res.status(403).json({ error: 'Forbidden' });
                }
            }

            const auditLogs = await prisma.alertAuditLog.findMany({
                where: { alertId: id },
                include: { user: true },
                orderBy: { changedAt: 'asc' }
            });
            res.json(auditLogs);
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static sseLive(req: any, res: Response) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders(); 

        res.write('retry: 10000\n\n');

        const onEvent = (data: any) => {
            if (req.user.role === 'operator' && data.zone_id !== req.user.zoneId) return; 
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        sseEvents.on('update', onEvent);

        req.on('close', () => {
            sseEvents.off('update', onEvent);
        });
    }
}
