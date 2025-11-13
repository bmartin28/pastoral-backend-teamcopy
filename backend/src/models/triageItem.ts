import mongoose from "mongoose";

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

const TriageItem = mongoose.model("TriageItem", triageItemSchema);
export default TriageItem;

// TypeScript interface matching the schema
export interface ITriageItem {
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

