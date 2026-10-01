import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { UPLOAD_DIR } from './db/index.js';
import { ipBan } from './middleware/ipBan.js';
import routes from './routes/index.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
app.set('trust proxy', env.trustProxy);

// Allowed origins: one value, a comma-separated list, or * for any origin
const allowed = env.origin.split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean);
const corsOptions = {
  origin: (origin, cb) => cb(null, !origin || allowed.includes('*') || allowed.includes(origin)),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  optionsSuccessStatus: 204,
  maxAge: 86400
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(ipBan);
app.use(express.json({ limit: '100mb', verify: (req, _res, buf) => { req.rawBody = buf; } }));
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);
export default app;
