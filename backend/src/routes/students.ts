import express from "express";
import Student from "../models/student.ts";

const router = express.Router();

// GET all students
router.get("/", async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

// GET /students/search?query=alice
router.get("/search", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    const regex = new RegExp(query as string, "i"); // case-insensitive search
    const results = await Student.find({
      $or: [
        { name: regex },
        { course: regex },
        { "notes.text": regex },
        { "notes.author": regex }
      ]
    }).sort({ lastUpdated: -1 });

    res.json(results);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Failed to search students" });
  }
});

// GET /students?sort=lastUpdated&order=desc&limit=20&page=2
router.get("/", async (req, res) => {
  try {
    const sort = req.query.sort || "lastUpdated";
    const order = req.query.order === "asc" ? 1 : -1;
    const limit = parseInt(req.query.limit as string) || 20;
    const page = parseInt(req.query.page as string) || 1;

    const students = await Student.find()
      .sort({ [sort as string]: order })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json(students);
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

// Post - Add New Student
router.post("/", async (req, res) => {
  try {
    const { caseId, studentId, name, course, year } = req.body;
    const newStudent = new Student({ caseId, studentId, name, course, year });
    const savedStudent = await newStudent.save();
    res.status(201).json(savedStudent);
  } catch (err) {
    console.error("Error creating student:", err);
    res.status(400).json({ error: "Failed to add student" });
  }
});


// 🧩 PATCH – Add a note to a student case
router.patch("/:caseId/notes", async (req, res) => {
  try {
    const { caseId } = req.params;
    const { text, author } = req.body;

    const updatedStudent = await Student.findOneAndUpdate(
      { caseId },
      { $push: { notes: { text, author } } },
      { new: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ error: "Student case not found" });
    }

    res.json(updatedStudent);
  } catch (err) {
    res.status(500).json({ error: "Failed to add note" });
  }
});

// PATCH /students/:caseId/status
router.patch("/:caseId/status", async (req, res) => {
  try {
    const { caseId } = req.params;
    const { status } = req.body;

    if (!["Open", "In Progress", "Closed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const updatedStudent = await Student.findOneAndUpdate(
      { caseId },
      { status },
      { new: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json(updatedStudent);
  } catch (err) {
    console.error("Error updating status:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// GET single student by caseId
router.get("/:caseId", async (req, res) => {
  try {
    const { caseId } = req.params;
    const student = await Student.findOne({ caseId });
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch student" });
  }
});

// PUT update existing student (general info)
router.put("/:caseId", async (req, res) => {
  try {
    const { caseId } = req.params;
    const updates = req.body;
    const updatedStudent = await Student.findOneAndUpdate(
      { caseId },
      updates,
      { new: true, runValidators: true }
    );
    if (!updatedStudent)
      return res.status(404).json({ error: "Student not found" });
    res.json(updatedStudent);
  } catch (err) {
    res.status(400).json({ error: "Failed to update student" });
  }
});

// DELETE student case
router.delete("/:caseId", async (req, res) => {
  try {
    const { caseId } = req.params;
    const deleted = await Student.findOneAndDelete({ caseId });
    if (!deleted)
      return res.status(404).json({ error: "Student not found" });
    res.json({ message: "Student case deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete student" });
  }
});

export default router;
