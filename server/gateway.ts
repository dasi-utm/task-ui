import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

const PORT = parseInt(process.env.PORT || '3004', 10);
const TASK_API_URL = process.env.TASK_API_URL || 'http://localhost:3001';
const TASK_ANALYTICS_URL = process.env.TASK_ANALYTICS_URL || 'http://localhost:3003';
const TASK_PROCESSING_URL = process.env.TASK_PROCESSING_URL || 'http://localhost:3002';

// /hubs/* task-api 
app.use(
  '/hubs',
  createProxyMiddleware({
    target: TASK_API_URL,
    changeOrigin: true,
    ws: true,
  }),
);

// /api/*  task-api 
app.use(
  '/api',
  createProxyMiddleware({
    target: TASK_API_URL,
    changeOrigin: true,
  }),
);

// /analytics/* task-analytics 
app.use(
  '/analytics',
  createProxyMiddleware({
    target: TASK_ANALYTICS_URL,
    changeOrigin: true,
    pathRewrite: { '^/analytics': '/api/analytics' },
  }),
);

// /processing/* task-processing
app.use(
  '/processing',
  createProxyMiddleware({
    target: TASK_PROCESSING_URL,
    changeOrigin: true,
  }),
);

app.listen(PORT, () => {
  console.log(`[gateway] listening on :${PORT}`);
  console.log(`  /api, /hubs  → ${TASK_API_URL}`);
  console.log(`  /analytics   → ${TASK_ANALYTICS_URL}`);
  console.log(`  /processing  → ${TASK_PROCESSING_URL}`);
});
