import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { triageRouter } from './api/triage.js';
import mongoose from 'mongoose';
import { AzureOpenAITriage } from './triage/azureOpenAIModel.js';
import { setTriageModel } from './triage/pipeline.js';
import { startScheduler } from './triage/scheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files (React frontend from pastoral-care/dist)
app.use(express.static('public'));

// Fallback: serve old frontend files if they exist
app.use(express.static('.'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/triage', triageRouter);

// Catch-all handler: serve React app for all non-API routes
// This allows React Router to handle client-side routing
app.get('*', (req, res, next) => {
  // Skip API routes and health check
  if (req.path.startsWith('/api/') || req.path === '/health') {
    return next();
  }
  // Serve React app's index.html for all other routes
  const indexPath = path.join(__dirname, '..', 'public', 'index.html');
  res.sendFile(indexPath);
});

// Initialize services
async function initialize() {
  try {
    // Connect to MongoDB (use backend's connection if available, otherwise connect here)
    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://localhost:27017';
      await mongoose.connect(mongoUri);
      console.log('MongoDB connected successfully');
    } else {
      console.log('MongoDB already connected (using existing connection)');
    }

    // Initialize Azure OpenAI
    const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o-mini';

    if (azureEndpoint && azureApiKey) {
      const aiModel = new AzureOpenAITriage(azureEndpoint, azureApiKey, deploymentName);
      setTriageModel(aiModel);
      console.log('Azure OpenAI model initialized');
    } else {
      console.warn('Azure OpenAI credentials not found. Triage classification will not work.');
    }

    // Start scheduler if enabled
    if (process.env.ENABLE_SCHEDULER !== 'false') {
      startScheduler();
    }

    console.log('Services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
    console.error('Server will continue running but some features may not work.');
    // Don't exit - allow server to run even if MongoDB/Azure isn't configured
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initialize();
});

// Export for testing
export default app;

