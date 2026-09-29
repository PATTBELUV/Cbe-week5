import express from "express";
import cors from "cors";

const PORT = 3000;
const app = express();

// Frontend is served from VS Code Live Server (port 5500)
app.use(cors({ origin: ["http://localhost:5500", "http://127.0.0.1:5500"] }));
app.use(express.json());

app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

// In-memory data store
const tasks = [
  { id: 1, title: "Study JavaScript", completed: false },
  { id: 2, title: "Build REST API", completed: false },
];

app.get("/", (req, res) => {
  res.send("CBE204 Week 5 Task API is running");
});

// Helper function สำหรับตรวจสอบข้อมูล
function validate({ title, completed }, titleRequired) {
  if (titleRequired || title !== undefined) {
    if (typeof title !== "string" || title.trim() === "") {
      return titleRequired ? "title is required" : "title must be a non-empty string";
    }
  }
  if (completed !== undefined && typeof completed !== "boolean") {
    return "completed must be a boolean";
  }
  return null;
}

// --- API Routes ---

// GET All Tasks
app.get("/api/tasks", (req, res) => {
  res.status(200).json(tasks);
});

// GET One Task
app.get("/api/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Task ID must be a positive integer" });
  }
  const task = tasks.find((t) => t.id === id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  res.status(200).json(task);
});

// POST Create Task
app.post("/api/tasks", (req, res) => {
  const body = req.body ?? {};
  const problem = validate(body, true);
  if (problem) return res.status(400).json({ error: problem });

  const newTask = {
    id: Math.max(0, ...tasks.map((t) => t.id)) + 1,
    title: body.title.trim(),
    completed: body.completed ?? false,
  };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

// PUT Update Task
app.put("/api/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Task ID must be a positive integer" });
  }
  const task = tasks.find((t) => t.id === id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const body = req.body ?? {};
  const problem = validate(body, false);
  if (problem) return res.status(400).json({ error: problem });

  if (body.title !== undefined) task.title = body.title.trim();
  if (body.completed !== undefined) task.completed = body.completed;
  res.status(200).json(task);
});

// DELETE Task
app.delete("/api/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Task ID must be a positive integer" });
  }
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return res.status(404).json({ error: "Task not found" });

  tasks.splice(index, 1);
  res.status(200).json({ message: "Task deleted" });
});

// Unknown /api route
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Error handler
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});