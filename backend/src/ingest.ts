import { Router } from 'express';
import { EventEmitter } from 'events';
import { IngestController } from './controllers/ingest.controller';
import { AnomalyService } from './services/anomaly.service';

export const anomalyQueue = new EventEmitter();
export const ingestRouter = Router();

anomalyQueue.on('processBatch', AnomalyService.processBatch);

ingestRouter.post('/', IngestController.handleIngest);
