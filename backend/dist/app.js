"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const followUpCron_1 = require("./jobs/followUpCron");
const aiRoutes_1 = require("./routes/aiRoutes");
const quotationRoutes_1 = require("./routes/quotationRoutes");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware configuration
app.use((0, cors_1.default)());
// Set high payload limit to natively accept Base64 string images for high-fidelity offline/preview PDF processing
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ limit: '50mb', extended: true }));
// Mount secure routers
app.use('/api/ai', aiRoutes_1.aiRouter);
app.use('/api/quotations', quotationRoutes_1.quotationRouter);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Start Express Server
const server = app.listen(PORT, () => {
    console.log(`[Backend] Secure server running on http://localhost:${PORT}`);
    console.log(`[Backend] Endpoints configured: /api/ai/suggest-specs, /api/ai/draft-email, /api/quotations`);
    // Initialize automated outreach scheduler
    (0, followUpCron_1.startCronJobs)();
});
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n[Backend] ❌ Port ${PORT} is already in use.`);
        console.error(`[Backend] 💡 Fix: Run this in PowerShell to free the port:`);
        console.error(`           Get-Process -Name node | Stop-Process -Force\n`);
        process.exit(1);
    }
    else {
        throw err;
    }
});
exports.default = app;
