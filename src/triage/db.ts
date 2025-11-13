import mongoose from "mongoose";

// TriageItem schema matching backend model
const triageItemSchema = new mongoose.Schema(
  {
    graphMessageId: { type: String, required: true, unique: true, index: true },
    threadId: { type: String, default: null },
    mailbox: { type: String, required: true },
    receivedAt: { type: Date, required: true, index: true },
    subject: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: [String], default: [] },
    cc: { type: [String], default: [] },
    bodyPreview: { type: String, default: "" },
    attachments: { type: [String], default: [] },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    extracted: {
      studentEmail: { type: String, default: null },
      names: { type: [String], default: [] },
      programme: { type: String, default: null },
      tags: { type: [String], default: [] },
      suggestedCaseAction: {
        type: String,
        enum: ["Open", "Note", "Ignore"],
        default: "Ignore",
      },
    },
    status: {
      type: String,
      enum: ["New", "Reviewed", "Promoted", "Rejected", "Snoozed"],
      default: "New",
      index: true,
    },
    snoozeUntil: { type: Date, default: null },
    rawStorageRef: { type: String, default: null },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

// Indexes for common queries
triageItemSchema.index({ status: 1, receivedAt: -1 });
triageItemSchema.index({ confidence: -1 });
triageItemSchema.index({ "extracted.studentEmail": 1 });

// Get or create the model (reuses if already registered)
const TriageItemModel = mongoose.models.TriageItem || mongoose.model("TriageItem", triageItemSchema);

// TypeScript interface
export interface TriageItem {
  _id?: mongoose.Types.ObjectId;
  graphMessageId: string;
  threadId: string | null;
  mailbox: string;
  receivedAt: Date;
  subject: string;
  from: string;
  to: string[];
  cc: string[];
  bodyPreview: string;
  attachments?: string[];
  confidence: number;
  extracted: {
    studentEmail?: string;
    names?: string[];
    programme?: string;
    tags?: string[];
    suggestedCaseAction?: "Open" | "Note" | "Ignore";
  };
  status: "New" | "Reviewed" | "Promoted" | "Rejected" | "Snoozed";
  createdAt?: Date;
  updatedAt?: Date;
  snoozeUntil?: Date;
  rawStorageRef?: string;
}

// Check if mongoose is already connected (from backend)
export function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

// Connect to MongoDB using Mongoose (only if not already connected)
export async function connectDB(uri: string, dbName?: string): Promise<void> {
  if (isConnected()) {
    console.log("MongoDB already connected via Mongoose");
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB via Mongoose");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

// Get TriageItem model (uses Mongoose)
export function getTriageModel() {
  if (!isConnected()) {
    throw new Error("Database not connected. Ensure mongoose.connect() has been called.");
  }
  return TriageItemModel;
}

// Compatibility function for existing code
export async function getTriageCollection() {
  return getTriageModel();
}

export async function closeDB(): Promise<void> {
  if (isConnected()) {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}
