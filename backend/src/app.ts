import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => {
    console.log("Connected to MongoDB Atlas");
    // Initialize triage system after MongoDB connection
    initializeTriageSystem();
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.get("/", (req, res) => {
  res.send("CPCS Backend API is running 🚀");
});

import studentRoutes from "./routes/students.ts";
app.use("/students", studentRoutes);

// Triage routes (imported from main src folder)
async function initializeTriageSystem() {
  try {
    // Import triage routes and initialization
    const { triageRouter } = await import("../../src/api/triage.js");
    const { AzureOpenAITriage } = await import("../../src/triage/azureOpenAIModel.js");
    const { setTriageModel } = await import("../../src/triage/pipeline.js");
    const { startScheduler } = await import("../../src/triage/scheduler.js");

    // Add triage routes
    app.use("/api/triage", triageRouter);

    // Initialize Azure OpenAI
    const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o-mini';

    if (azureEndpoint && azureApiKey) {
      const aiModel = new AzureOpenAITriage(azureEndpoint, azureApiKey, deploymentName);
      setTriageModel(aiModel);
      console.log('Azure OpenAI model initialized for triage');
    } else {
      console.warn('Azure OpenAI credentials not found. Triage classification will not work.');
    }

    // Start scheduler if enabled
    if (process.env.ENABLE_SCHEDULER !== 'false') {
      startScheduler();
      console.log('Triage scheduler started');
    }

    console.log('Triage system initialized');
  } catch (error) {
    console.error('Failed to initialize triage system:', error);
    console.error('Triage features will not be available');
  }
}

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
