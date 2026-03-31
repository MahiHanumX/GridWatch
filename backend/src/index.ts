import express from 'express';
import cors from 'cors';

import { ingestRouter } from './ingest';
import { apiRouter, sseEvents } from './routes';
import { AnomalyService } from './services/anomaly.service';

const app = express();
app.use(cors());
app.use(express.json());

// Broadcast events from workers to SSE
process.on('message', (msg: any) => {
    if (msg.type === 'sse') {
        sseEvents.emit('update', msg.payload);
    }
});

app.use('/ingest', ingestRouter);
app.use('/api', apiRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start background workers utilizing Prisma
AnomalyService.startPatternAbsenceDetection();
AnomalyService.startAutoEscalation();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
