const API_URL = "http://localhost:3000/api/tasks";

let editingId = null; // id of the task currently being edited

const taskList = document.querySelector("#taskList");
const errorBox = document.querySelector("#errorMessage");
const loadingBox = document.querySelector("#loading");

function showError(message) {
  errorBox.textContent = message;
}

function setLoading(isLoading) {
  loadingBox.hidden = !isLoading;
}

// Wrapper around fetch(): checks response.ok and returns parsed JSON
async function apiRequest(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

function jsonOptions(method, data) {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
}

// ---------- Rendering ----------

function renderTasks(tasks) {
  taskList.innerHTML = "";

  tasks.forEach((task) => {
    const row = task.id === editingId ? editRow(task) : viewRow(task);
    taskList.appendChild(row);
  });
}

function makeButton(text, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  button.addEventListener("click", onClick);
  return button;
}

function viewRow(task) {
  const row = document.createElement("div");
  row.className = "task-item";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = task.completed;
  checkbox.addEventListener("change", () =>
    updateTask(task.id, { completed: checkbox.checked })
  );

  const title = document.createElement("span");
  title.className = task.completed ? "title done" : "title";
  title.textContent = task.title;

  row.append(
    checkbox,
    title,
    makeButton("Edit", () => {
      editingId = task.id;
      loadTasks();
    }),
    makeButton("Delete", () => deleteTask(task.id))
  );
  return row;
}

function editRow(task) {
  const row = document.createElement("div");
  row.className = "task-item";

  const input = document.createElement("input");
  input.type = "text";
  input.value = task.title;

  row.append(
    input,
    makeButton("Save", () => saveEdit(task.id, input.value)),
    makeButton("Cancel", () => {
      editingId = null;
      loadTasks();
    })
  );
  return row;
}

// ---------- CRUD operations ----------

async function loadTasks() {
  setLoading(true);
  try {
    const tasks = await apiRequest(API_URL);
    showError("");
    renderTasks(tasks);
  } catch (error) {
    console.error(error);
    showError("Unable to load tasks. Please try again.");
  } finally {
    setLoading(false);
  }
}

async function createTask(title) {
  try {
    await apiRequest(API_URL, jsonOptions("POST", { title }));
    showError("");
    await loadTasks();
    return true;
  } catch (error) {
    console.error(error);
    showError("Unable to add the task. Please try again.");
    return false;
  }
}

async function updateTask(id, changes) {
  try {
    await apiRequest(`${API_URL}/${id}`, jsonOptions("PUT", changes));
    editingId = null;
    showError("");
  } catch (error) {
    console.error(error);
    showError("Unable to update the task. Please try again.");
  }
  loadTasks(); // refresh either way so the list matches the server
}

async function saveEdit(id, newTitle) {
  const title = newTitle.trim();
  if (title === "") {
    showError("Task title cannot be empty.");
    return;
  }
  updateTask(id, { title });
}

async function deleteTask(id) {
  try {
    await apiRequest(`${API_URL}/${id}`, { method: "DELETE" });
    showError("");
  } catch (error) {
    console.error(error);
    showError("Unable to delete the task. Please try again.");
  }
  loadTasks();
}

// ---------- Events ----------

document.querySelector("#taskForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const input = document.querySelector("#taskTitle");
  const title = input.value.trim();
  if (title === "") {
    showError("Please enter a task title.");
    return;
  }

  if (await createTask(title)) {
    input.value = "";
  }
});

loadTasks();