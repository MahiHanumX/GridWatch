import { prisma } from '../db';

export class AnomalyService {

    static broadcastEvent = (event: string, data: any) => {
        const payload = { event, data };
        if (process.send) {
            process.send({ type: 'sse', payload });
        } else {
            const { sseEvents } = require('../routes');
            sseEvents.emit('update', payload);
        }
    };

    static async createAlert(tx: any, sensorId: string, anomalyId: string, severity: string, isSuppressed: boolean = false) {
        return tx.alert.create({
            data: {
                sensorId,
                anomalyId,
                severity,
                isSuppressed,
                auditLogs: {
                    create: {
                        toStatus: 'open'
                    }
                }
            }
        });
    }

    static async processBatch(readings: any[]) {
        try {
            for (const reading of readings) {
                const { sensor_id, voltage, current, temperature, status_code, timestamp } = reading;
                
                const sensor = await prisma.sensor.findUnique({
                    where: { id: sensor_id }
                });
                if (!sensor) continue;

                const readingRecord = await prisma.reading.findFirst({
                    where: { sensorId: sensor_id, timestamp: new Date(timestamp) }
                });

                const suppressions = await prisma.suppression.findMany({
                    where: {
                        sensorId: sensor_id,
                        startTime: { lte: new Date() },
                        endTime: { gte: new Date() }
                    }
                });
                const isSuppressed = suppressions.length > 0;

                let anomaliesDetected: { type: string, desc: string, severity: string }[] = [];

                if (sensor.ruleAMinVoltage && voltage < Number(sensor.ruleAMinVoltage) || 
                    sensor.ruleAMaxVoltage && voltage > Number(sensor.ruleAMaxVoltage)) {
                    anomaliesDetected.push({
                        type: 'A',
                        desc: `Voltage ${voltage} outside range`,
                        severity: 'critical'
                    });
                }
                
                if (sensor.ruleAMinTemp && temperature < Number(sensor.ruleAMinTemp) || 
                    sensor.ruleAMaxTemp && temperature > Number(sensor.ruleAMaxTemp)) {
                     anomaliesDetected.push({
                        type: 'A',
                        desc: `Temperature ${temperature} outside range`,
                        severity: 'critical'
                    });
                }

                if (sensor.ruleBChangeThreshold) {
                    const prev3 = await prisma.reading.findMany({
                        where: { sensorId: sensor_id, timestamp: { lt: new Date(timestamp) } },
                        orderBy: { timestamp: 'desc' },
                        take: 3
                    });
                    
                    if (prev3.length === 3) {
                        const threshold = Number(sensor.ruleBChangeThreshold);
                        const avgV = prev3.reduce((sum: number, r: any) => sum + Number(r.voltage), 0) / 3;
                        if (avgV > 0) {
                            const change = Math.abs((voltage - avgV) / avgV) * 100;
                            if (change > threshold) {
                                anomaliesDetected.push({
                                    type: 'B',
                                    desc: `Voltage changed by ${change.toFixed(2)}%`,
                                    severity: 'warning'
                                });
                            }
                        }
                        
                        const avgT = prev3.reduce((sum: number, r: any) => sum + Number(r.temperature), 0) / 3;
                        if (avgT > 0) {
                            const change = Math.abs((temperature - avgT) / avgT) * 100;
                            if (change > threshold) {
                                anomaliesDetected.push({
                                    type: 'B',
                                    desc: `Temperature changed by ${change.toFixed(2)}%`,
                                    severity: 'warning'
                                });
                            }
                        }
                        
                        const avgC = prev3.reduce((sum: number, r: any) => sum + Number(r.current), 0) / 3;
                        if (avgC > 0) {
                            const change = Math.abs((current - avgC) / avgC) * 100;
                            if (change > threshold) {
                                anomaliesDetected.push({
                                    type: 'B',
                                    desc: `Current changed by ${change.toFixed(2)}%`,
                                    severity: 'warning'
                                });
                            }
                        }
                    }
                }

                let expectedState = 'healthy';
                if (isSuppressed) {
                    expectedState = 'silent';
                } else if (anomaliesDetected.some(a => a.severity === 'critical')) {
                    expectedState = 'critical';
                } else if (anomaliesDetected.some(a => a.severity === 'warning')) {
                    expectedState = 'warning';
                }

                if (anomaliesDetected.length > 0) {
                    await prisma.$transaction(async (tx: any) => {
                        for (const an of anomaliesDetected) {
                            const anomaly = await tx.anomaly.create({
                                data: {
                                    sensorId: sensor_id,
                                    readingId: readingRecord ? readingRecord.id : null,
                                    ruleType: an.type,
                                    description: an.desc,
                                    isSuppressed
                                }
                            });
                            
                            await AnomalyService.createAlert(tx, sensor_id, anomaly.id, an.severity, isSuppressed);
                        }
                    });
                }

                if (sensor.state !== expectedState) {
                    if (!(expectedState === 'warning' && sensor.state === 'critical')) {
                        await prisma.sensor.update({
                            where: { id: sensor_id },
                            data: { state: expectedState }
                        });
                        AnomalyService.broadcastEvent('sensor_state_change', { 
                            sensor_id, 
                            state: expectedState, 
                            zone_id: sensor.zoneId 
                        });
                    }
                }
            }
        } catch (e) {
            console.error("Anomaly processing failed", e);
        }
    }

    static startPatternAbsenceDetection() {
        setInterval(async () => {
            try {
                const twoMinsAgo = new Date(Date.now() - 2 * 60000);
                const sensors = await prisma.sensor.findMany({
                    where: {
                        lastReadingAt: { lt: twoMinsAgo },
                        state: { not: 'critical' }
                    }
                });

                for (const sensor of sensors) {
                    await prisma.$transaction(async (tx: any) => {
                        const suppressions = await tx.suppression.findMany({
                            where: {
                                sensorId: sensor.id,
                                startTime: { lte: new Date() },
                                endTime: { gte: new Date() }
                            }
                        });
                        const isSuppressed = suppressions.length > 0;

                        const anomaly = await tx.anomaly.create({
                            data: {
                                sensorId: sensor.id,
                                ruleType: 'C',
                                description: 'No reading for > 2 mins',
                                isSuppressed
                            }
                        });
                        await AnomalyService.createAlert(tx, sensor.id, anomaly.id, 'critical', isSuppressed);
                        
                        let expectedState = isSuppressed ? 'silent' : 'critical';
                        await tx.sensor.update({
                            where: { id: sensor.id },
                            data: { state: expectedState }
                        });
                        if (!isSuppressed) {
                            AnomalyService.broadcastEvent('sensor_state_change', { sensor_id: sensor.id, state: expectedState, zone_id: sensor.zoneId });
                        }
                    });
                }
            } catch(e) { console.error("Rule C failed", e); }
        }, 60000);
    }

    static startAutoEscalation() {
        setInterval(async () => {
            try {
                const fiveMinsAgo = new Date(Date.now() - 5 * 60000);
                const alerts = await prisma.alert.findMany({
                    where: {
                        status: 'open',
                        severity: 'critical',
                        isEscalated: false,
                        isSuppressed: false,
                        createdAt: { lt: fiveMinsAgo }
                    }
                });
                
                if (alerts.length > 0) {
                    const supervisor = await prisma.user.findFirst({ where: { role: 'supervisor' } });
                    if (supervisor) {
                        for (const alert of alerts) {
                            await prisma.$transaction(async (tx: any) => {
                                await tx.alert.update({
                                    where: { id: alert.id },
                                    data: { isEscalated: true }
                                });
                                await tx.escalationLog.create({
                                    data: {
                                        alertId: alert.id,
                                        escalatedToSupervisorId: supervisor.id
                                    }
                                });
                            });
                        }
                    }
                }
            } catch(e) {
                console.error("Escalation failing", e);
            }
        }, 30000);
    }
}
