const API_BASE = "http://localhost:3000/api/tasks";

let editingId = null;

function showError(message) {
  document.querySelector("#errorMessage").textContent = message;
}

function clearError() {
  document.querySelector("#errorMessage").textContent = "";
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    let serverMessage = null;
    try {
      const body = await response.json();
      serverMessage = body.error;
    } catch (_) {}
    throw new Error(serverMessage || `API error: ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

function renderTasks(tasks) {
  const list = document.querySelector("#taskList");
  list.innerHTML = "";

  tasks.forEach((task) => {
    const item =
      task.id === editingId ? renderEditItem(task) : renderTaskItem(task);
    list.appendChild(item);
  });
}

function renderTaskItem(task) {
  const item = document.createElement("div");
  item.className = "task-item";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = task.completed;
  checkbox.addEventListener("change", () =>
    toggleCompleted(task, checkbox.checked)
  );

  const label = document.createElement("span");
  label.textContent = `${task.id}: ${task.title}`;
  if (task.completed) label.style.textDecoration = "line-through";

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.textContent = "Edit";
  editBtn.addEventListener("click", () => {
    editingId = task.id;
    loadTasks();
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.textContent = "Delete";
  deleteBtn.addEventListener("click", () => deleteTask(task.id));

  item.append(checkbox, label, editBtn, deleteBtn);
  return item;
}

function renderEditItem(task) {
  const item = document.createElement("div");
  item.className = "task-item";

  const input = document.createElement("input");
  input.type = "text";
  input.value = task.title;

  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.textContent = "Save";
  saveBtn.addEventListener("click", () => saveEdit(task, input.value));

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.textContent = "Cancel";
  cancelBtn.addEventListener("click", () => {
    editingId = null;
    loadTasks();
  });

  item.append(input, saveBtn, cancelBtn);
  return item;
}

async function loadTasks() {
  try {
    const tasks = await apiRequest(API_BASE);
    clearError();
    renderTasks(tasks);
  } catch (error) {
    console.error(error);
    showError("Unable to load tasks. Please try again");
  }
}

document.querySelector("#taskForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const titleInput = document.querySelector("#taskTitle");
  const title = titleInput.value.trim();
  if (!title) return;

  try {
    await apiRequest(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    titleInput.value = "";
    clearError();
    loadTasks();
  } catch (error) {
    console.error(error);
    showError("Unable to create task. Please try again");
  }
});

async function toggleCompleted(task, completed) {
  try {
    await apiRequest(`${API_BASE}/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: task.title, completed }),
    });
    clearError();
    loadTasks();
  } catch (error) {
    console.error(error);
    showError("Unable to update task. Please try again");
    loadTasks();
  }
}

async function saveEdit(task, newTitle) {
  const title = newTitle.trim();
  if (!title) {
    showError("Task title cannot be empty");
    return;
  }

  try {
    await apiRequest(`${API_BASE}/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, completed: task.completed }),
    });
    editingId = null;
    clearError();
    loadTasks();
  } catch (error) {
    console.error(error);
    showError("Unable to update task. Please try again");
  }
}

async function deleteTask(id) {
  try {
    await apiRequest(`${API_BASE}/${id}`, { method: "DELETE" });
    clearError();
    loadTasks();
  } catch (error) {
    console.error(error);
    showError("Unable to delete task. Please try again");
  }
}

loadTasks();