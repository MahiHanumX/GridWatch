import { Request, Response } from 'express';
import { prisma } from '../db';
import { anomalyQueue } from '../ingest';

export class IngestController {
    static async handleIngest(req: Request, res: Response) {
        const readings = req.body;
        if (!Array.isArray(readings) || readings.length === 0 || readings.length > 1000) {
            return res.status(400).json({ error: 'Payload must be an array of 1-1000 readings' });
        }

        try {
            // Prisma optimize multiple inserts 
            const readingData = readings.map(r => ({
                sensorId: r.sensor_id,
                voltage: r.voltage,
                current: r.current,
                temperature: r.temperature,
                statusCode: r.status_code,
                timestamp: new Date(r.timestamp),
            }));

            // Bulk Insert
            await prisma.reading.createMany({
                data: readingData
            });

            // Update Sensor Last Reading internally efficiently
            const sensorIds = [...new Set(readingData.map(r => r.sensorId))];
            await prisma.sensor.updateMany({
                where: { id: { in: sensorIds } },
                data: { lastReadingAt: new Date() }
            });

            // Respond under 200ms
            res.status(202).json({ accepted: readings.length });
            
            // Push to anomaly detection async worker
            anomalyQueue.emit('processBatch', readings);

        } catch (err) {
            console.error('Ingest error:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}
