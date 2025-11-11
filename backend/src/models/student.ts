import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: { type: String, default: "System" },
  date: { type: Date, default: Date.now },
});

const studentSchema = new mongoose.Schema(
  {
    caseId: { type: String, required: true, unique: true },
    studentId: { type: String },
    name: { type: String, required: true, trim: true },
    course: { type: String, required: true },
    year: { type: Number },
    notes: [noteSchema],

    status: {
      type: String,
      enum: ["Open", "In Progress", "Closed"],
      default: "Open"
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "lastUpdated" },
  }
);

const Student = mongoose.model("Student", studentSchema);
export default Student;
