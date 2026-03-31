# GridWatch

## Setup
1. Ensure Docker and Docker Compose are installed on your machine.
2. Run `docker-compose up --build` at the root of the project.
3. The DB will automatically apply the schema and seed scripts via the `docker-entrypoint-initdb.d/` mount.
4. Backend runs on http://localhost:3000.
5. Frontend runs on http://localhost:8080.

## 1. Architecture
- **Ingestion**: A REST API endpoint accepts readings in batches. It persists data to PostgreSQL `readings` table efficiently using bulk unnest/inserts and returns `202 Accepted` within 200 ms. Immediately after, it emits an event to the internal `anomalyQueue`.
- **Anomaly Detecton**: A background async worker listens to the `anomalyQueue` to process Rule A (Thresholds) and Rule B (Rate of Change). 
- **Rule C (Pattern Absence)**: A decoupled `setInterval` loop queries sensors every 60s looking for `last_reading_at < NOW() - 2 minutes`.
- **Live State**: The application provides an SSE (Server-Sent Events) endpoint `/api/live` returning events scoped by `zone_id`. The React Dashboard listens to these SSE streams and performs immutable updates without polling.

## 2. Schema Decisions
- `sensors`, `zones`, `users`: Enforce the basic relational map. `users` are tied to `zones` to secure access and SSE streams.
- `readings`: High write-volume table. Using `sensor_id` and `timestamp DESC` combined index to allow fast queries for "previous 3 readings" without scanning. TimescaleDB/Partitions would be next step for > 1 TB data.
- `anomalies` and `alerts`: Decoupled because many anomalies map to one alert lifecycle, and rules fire concurrently. `alert_audit_log` handles the complex status change history natively defensively without updates.

## 3. Real-Time Design
- **Technology**: Node.js `EventEmitter` bound to HTTP Server-Sent Events (SSE). 
- **Why**: SSE is far simpler and more appropriate than WebSockets when communication is unidirectional (Backend -> Browser). Operators only need to 'see' state changes, not 'send' high-frequency data back.
- **Push-Based**: When an Anomaly worker updates a sensor from `healthy` to `critical`, it broadcasts heavily filtered SSE `data` chunks to `req.user.zone_id`.

## 4. What You Finished and What You Cut
**Finished**:
- Full schema architecture including roles, zones, sensors.
- Ingestion endpoint that performs durable batch inserts + fast response.
- Background asynchronous workers for all three Rule A, B, and C.
- SSE Dashboard and live push configuration.
- Docker-Compose that stands up the full stack.
- Seed logic to simulate baseline structures.

**Cut/Stubbed**:
- The UI (Frontend) does not visually execute the Historical Queries or Suppression APIs fully with forms due to time constraints, but the backend Express routes exist.
- Auth is spoofed using a simple `x-user-id` middleware simulation instead of full JWT/OAuth2.
- Testing (Jest/Cypress).

## 5. The Three Hardest Problems
1. **Rule C Detection Optimization**: Finding non-reporting sensors at scale conventionally means querying all sensors continually. I resolved this by keeping a lightweight `last_reading_at` cache inside `sensors` updated during batch inserts, so we only need to query `WHERE last_reading_at < X AND state != 'critical'` avoiding huge sequential scanning.
2. **200ms Ingest Response Threshold**: Waiting for Postgres sequence iterations or row-by-row commits kills performance. I chose to use `VALUES ($1... ), ($2... )` bulk insertion with a single `BEGIN/COMMIT` transaction, resolving the blocking problem before emitting into memory.
3. **Escalation Accuracy (Exactly Once)**: I utilized an `is_escalated` boolean directly on the `alerts` table with `SELECT ... FOR UPDATE SKIP LOCKED` (Simulated in script with atomic queries) to prevent multiple workers from catching the same alert in high-concurrency environments.

## 6. Production Gap
If I had a week:
- **TimescaleDB/Partitioning**: I would partition the `readings` table by week. Sensor data scales immensely quickly and naive Postgres will suffer indexing bloated B-trees.
- **Message Broker**: I would introduce RabbitMQ or Kafka for the Ingest -> Anomaly pipeline, because `EventEmitter` crashes lose data state before anomaly processing in Node. 
- **Redis Cache**: Provide exact caching for `last_reading_at` independent of the primary DB for Rule C.

## Supression while Alert Open Implementation details
If an operator suppresses a sensor that already has an 'open' or 'acknowledged' alert, my backend explicitly updates those existing alerts and anomalies to `isSuppressed = true` immediately. This ensures those alerts are hidden from the operator's active alert feed and prevents them from escalating further, while still retaining the alerts natively in the database as per the requirements.
