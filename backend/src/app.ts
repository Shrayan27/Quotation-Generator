import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import { startCronJobs } from './jobs/followUpCron';
import { aiRouter } from './routes/aiRoutes';
import { quotationRouter } from './routes/quotationRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware configuration
app.use(cors());
// Set high payload limit to natively accept Base64 string images for high-fidelity offline/preview PDF processing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Mount secure routers
app.use('/api/ai', aiRouter);
app.use('/api/quotations', quotationRouter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start Express Server
const server = app.listen(PORT, () => {
  console.log(`[Backend] Secure server running on http://localhost:${PORT}`);
  console.log(`[Backend] Endpoints configured: /api/ai/suggest-specs, /api/ai/draft-email, /api/quotations`);
  
  // Initialize automated outreach scheduler
  startCronJobs();
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[Backend] ❌ Port ${PORT} is already in use.`);
    console.error(`[Backend] 💡 Fix: Run this in PowerShell to free the port:`);
    console.error(`           Get-Process -Name node | Stop-Process -Force\n`);
    process.exit(1);
  } else {
    throw err;
  }
});

export default app;
