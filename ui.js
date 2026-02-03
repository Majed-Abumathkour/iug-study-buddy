// #region: UI + App Logic
// This file handles:
// - DOM manipulation
// - Events + delegation
// - Validation
// - Rendering UI from state
// - Coordinating storage + fetch

// #region: DOM Cache
// Cache DOM nodes used frequently.
const dom = {
  header: document.querySelector(".app-header"),
  navToggle: document.getElementById("navToggle"),
  navLinks: document.querySelectorAll("[data-nav]"),
  sections: document.querySelectorAll("[data-section]"),

  // Dashboard
  soonDueCount: document.getElementById("soonDueCount"),
  completedCount: document.getElementById("completedCount"),
  habitStreakCount: document.getElementById("habitStreakCount"),
  taskProgressBar: document.getElementById("taskProgressBar"),
  taskProgressText: document.getElementById("taskProgressText"),
  taskProgress: document.querySelector(".progress"),
  todayList: document.getElementById("todayList"),
  todayEmpty: document.getElementById("todayEmpty"),
  quickTaskForm: document.getElementById("quickTaskForm"),
  quickTitle: document.getElementById("quickTitle"),
  quickDueDate: document.getElementById("quickDueDate"),
  quickError: document.getElementById("quickError"),

  // Tasks
  taskForm: document.getElementById("taskForm"),
  taskTitle: document.getElementById("taskTitle"),
  taskDescription: document.getElementById("taskDescription"),
  taskDueDate: document.getElementById("taskDueDate"),
  taskPriority: document.getElementById("taskPriority"),
  taskCategory: document.getElementById("taskCategory"),
  taskError: document.getElementById("taskError"),
  taskSubmit: document.getElementById("taskSubmit"),
  taskCancel: document.getElementById("taskCancel"),
  taskFilter: document.getElementById("taskFilter"),
  taskCategoryFilter: document.getElementById("taskCategoryFilter"),
  taskSort: document.getElementById("taskSort"),
  tasksList: document.getElementById("tasksList"),

  // Habits
  habitForm: document.getElementById("habitForm"),
  habitName: document.getElementById("habitName"),
  habitGoal: document.getElementById("habitGoal"),
  habitError: document.getElementById("habitError"),
  habitsList: document.getElementById("habitsList"),
  habitsSummary: document.getElementById("habitsSummary"),

  // Resources
  resourceSearch: document.getElementById("resourceSearch"),
  resourceCategory: document.getElementById("resourceCategory"),
  resourcesStatus: document.getElementById("resourcesStatus"),
  resourcesList: document.getElementById("resourcesList"),

  // Settings
  themeToggle: document.getElementById("themeToggle"),
  themeLabel: document.getElementById("themeLabel"),
  resetBtn: document.getElementById("resetBtn"),
};
// #endregion: DOM Cache

// #region: Utilities
/**
 * Create a simple unique id.
 */
function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Convert a yyyy-mm-dd string to a Date (local timezone).
 */
function parseDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get the difference in full days between two dates.
 */
function diffInDays(dateA, dateB) {
  const ms = dateB.setHours(0, 0, 0, 0) - dateA.setHours(0, 0, 0, 0);
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/**
 * Return the start date (Friday) of the current week as yyyy-mm-dd.
 * Requirement mentions Fri–Sat, so we treat Friday as week start.
 */
function getWeekStartISO(date = new Date()) {
  const day = date.getDay(); // 0=Sun, 1=Mon, ... 5=Fri, 6=Sat
  const daysSinceFriday = (day - 5 + 7) % 7;
  const start = new Date(date);
  start.setDate(date.getDate() - daysSinceFriday);
  return start.toISOString().split("T")[0];
}

/**
 * Count the longest streak of true values in an array.
 */
function maxStreak(values) {
  let best = 0;
  let current = 0;
  values.forEach((value) => {
    if (value) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  });
  return best;
}
// #endregion: Utilities

// #region: Navigation
/**
 * Show a single section and hide others.
 */
function showSection(sectionId) {
  dom.sections.forEach((section) => {
    section.classList.toggle("is-active", section.id === sectionId);
  });

  dom.navLinks.forEach((link) => {
    link.classList.toggle(
      "is-active",
      link.getAttribute("href") === `#${sectionId}`
    );
  });
}

/**
 * Toggle the mobile navigation menu.
 */
function toggleMobileNav(forceOpen = null) {
  if (!dom.header || !dom.navToggle) return;
  const isOpen =
    forceOpen !== null
      ? forceOpen
      : !dom.header.classList.contains("nav-open");
  dom.header.classList.toggle("nav-open", isOpen);
  dom.navToggle.setAttribute("aria-expanded", String(isOpen));
}
// #endregion: Navigation

// #region: Validation
/**
 * Validate the Tasks form.
 */
function validateTaskForm() {
  if (!dom.taskTitle.value.trim()) return "Title is required.";
  if (!dom.taskDueDate.value) return "Due date is required.";
  return "";
}

/**
 * Validate the Quick Task form (Dashboard).
 */
function validateQuickTaskForm() {
  if (!dom.quickTitle.value.trim()) return "Title is required.";
  if (!dom.quickDueDate.value) return "Due date is required.";
  return "";
}

/**
 * Validate the Habits form.
 */
function validateHabitForm() {
  if (!dom.habitName.value.trim()) return "Habit name is required.";
  const goal = Number(dom.habitGoal.value);
  if (!Number.isInteger(goal) || goal < 1 || goal > 7) {
    return "Goal must be a number from 1 to 7.";
  }
  return "";
}
// #endregion: Validation

// #region: Dashboard Rendering
/**
 * Render dashboard counters and lists.
 */
function renderDashboard() {
  const tasks = appState.tasks;
  const completedTasks = tasks.filter((task) => task.completed);
  const soonDueTasks = tasks.filter((task) => {
    if (task.completed) return false;
    const due = parseDate(task.dueDate);
    const diff = diffInDays(new Date(), due);
    return diff >= 0 && diff <= 2;
  });

  // Summary cards
  if (dom.soonDueCount) dom.soonDueCount.textContent = soonDueTasks.length;
  if (dom.completedCount) dom.completedCount.textContent = completedTasks.length;

  // Habit streak (best streak this week)
  const habitStreaks = appState.habits.map((habit) =>
    maxStreak(habit.progress || [])
  );
  const bestStreak = habitStreaks.length ? Math.max(...habitStreaks) : 0;
  if (dom.habitStreakCount) dom.habitStreakCount.textContent = bestStreak;

  // Progress bar
  const total = tasks.length;
  const percent = total ? Math.round((completedTasks.length / total) * 100) : 0;
  if (dom.taskProgressBar) {
    dom.taskProgressBar.style.width = `${percent}%`;
  }
  if (dom.taskProgressText) {
    dom.taskProgressText.textContent = `${percent}% complete`;
  }
  if (dom.taskProgress) {
    dom.taskProgress.setAttribute("aria-valuenow", String(percent));
  }

  // Today/soon list
  if (dom.todayList && dom.todayEmpty) {
    dom.todayList.innerHTML = "";
    if (!soonDueTasks.length) {
      dom.todayEmpty.classList.remove("hidden");
    } else {
      dom.todayEmpty.classList.add("hidden");
      soonDueTasks.forEach((task) => {
        const li = document.createElement("li");
        li.className = "list-item";
        li.textContent = `${task.title} — ${task.dueDate}`;
        dom.todayList.appendChild(li);
      });
    }
  }
}
// #endregion: Dashboard Rendering

// #region: Tasks Rendering
/**
 * Return a filtered + sorted list of tasks based on controls.
 */
function getVisibleTasks() {
  let tasks = [...appState.tasks];

  // Filter by status
  const status = dom.taskFilter?.value || "all";
  if (status === "active") tasks = tasks.filter((t) => !t.completed);
  if (status === "completed") tasks = tasks.filter((t) => t.completed);

  // Filter by category text
  const categoryText = dom.taskCategoryFilter?.value.trim().toLowerCase();
  if (categoryText) {
    tasks = tasks.filter((t) =>
      (t.category || "").toLowerCase().includes(categoryText)
    );
  }

  // Sort
  const sort = dom.taskSort?.value || "due";
  if (sort === "due") {
    tasks.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  } else if (sort === "priority") {
    const rank = { high: 0, medium: 1, low: 2 };
    tasks.sort((a, b) => rank[a.priority] - rank[b.priority]);
  }

  return tasks;
}

/**
 * Build a task card element.
 */
function buildTaskCard(task) {
  const card = document.createElement("div");
  card.className = `task-card${task.completed ? " is-complete" : ""}`;
  card.dataset.id = task.id;

  const meta = document.createElement("div");
  meta.className = "task-meta";
  meta.innerHTML = `
    <span class="pill pill-${task.priority}">${task.priority}</span>
    ${task.category ? `<span class="badge">${task.category}</span>` : ""}
    <span class="badge">${task.dueDate}</span>
  `;

  const actions = document.createElement("div");
  actions.className = "task-actions";
  actions.innerHTML = `
    <button class="btn btn-ghost" data-action="toggle">
      ${task.completed ? "Uncomplete" : "Complete"}
    </button>
    <button class="btn btn-ghost" data-action="edit">Edit</button>
    <button class="btn btn-danger" data-action="delete">Delete</button>
  `;

  card.innerHTML = `
    <h4>${task.title}</h4>
    ${task.description ? `<p class="muted">${task.description}</p>` : ""}
  `;
  card.appendChild(meta);
  card.appendChild(actions);
  return card;
}

/**
 * Render the tasks list.
 */
function renderTasks() {
  if (!dom.tasksList) return;
  dom.tasksList.innerHTML = "";
  getVisibleTasks().forEach((task) => {
    dom.tasksList.appendChild(buildTaskCard(task));
  });
}
// #endregion: Tasks Rendering

// #region: Habits Rendering
const weekLabels = ["Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu"];

/**
 * Ensure habits are on the current week; reset progress if week changed.
 */
function normalizeHabitsWeek() {
  const currentWeek = getWeekStartISO();
  appState.habits.forEach((habit) => {
    if (habit.weekStart !== currentWeek) {
      habit.weekStart = currentWeek;
      habit.progress = new Array(7).fill(false);
    }
  });
}

/**
 * Render the habits list.
 */
function renderHabits() {
  if (!dom.habitsList || !dom.habitsSummary) return;

  normalizeHabitsWeek();
  dom.habitsList.innerHTML = "";

  let goalsAchieved = 0;
  appState.habits.forEach((habit) => {
    const count = habit.progress.filter(Boolean).length;
    if (count >= habit.goal) goalsAchieved += 1;

    const card = document.createElement("div");
    card.className = "habit-card";
    card.dataset.id = habit.id;

    const header = document.createElement("div");
    header.className = "habit-header";
    header.innerHTML = `
      <div>
        <h3>${habit.name}</h3>
        <p class="muted">Goal: ${habit.goal} / week</p>
      </div>
      <span class="badge">${count} / ${habit.goal}</span>
    `;

    const days = document.createElement("div");
    days.className = "habit-days";
    weekLabels.forEach((label, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `day-toggle${habit.progress[index] ? " is-on" : ""}`;
      btn.dataset.dayIndex = String(index);
      btn.textContent = label;
      days.appendChild(btn);
    });

    card.appendChild(header);
    card.appendChild(days);
    dom.habitsList.appendChild(card);
  });

  dom.habitsSummary.textContent = `${goalsAchieved} of ${
    appState.habits.length
  } goals achieved`;
}
// #endregion: Habits Rendering

// #region: Resources Rendering
/**
 * Render the Resources list with search + category filters.
 */
function renderResources() {
  if (!dom.resourcesList) return;
  const search = dom.resourceSearch?.value.trim().toLowerCase() || "";
  const category = dom.resourceCategory?.value || "all";

  const filtered = appState.resources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(search) ||
      resource.description.toLowerCase().includes(search);
    const matchesCategory = category === "all" || resource.category === category;
    return matchesSearch && matchesCategory;
  });

  dom.resourcesList.innerHTML = "";
  filtered.forEach((resource) => {
    const card = document.createElement("div");
    card.className = "resource-card";
    card.dataset.id = resource.id;

    const isFavorite = appState.favorites.includes(resource.id);
    card.innerHTML = `
      <div class="resource-header">
        <span class="badge">${resource.category}</span>
        <button class="icon-btn${
          isFavorite ? " is-favorite" : ""
        }" data-action="favorite">
          ${isFavorite ? "★" : "☆"} Favorite
        </button>
      </div>
      <h4>${resource.title}</h4>
      <p class="muted">${resource.description}</p>
      <a class="resource-link" href="${resource.link}" target="_blank" rel="noreferrer">
        Visit resource
      </a>
    `;
    dom.resourcesList.appendChild(card);
  });
}

/**
 * Populate the category select based on loaded resources.
 */
function populateResourceCategories() {
  if (!dom.resourceCategory) return;
  const categories = Array.from(
    new Set(appState.resources.map((resource) => resource.category))
  );

  dom.resourceCategory.innerHTML = `<option value="all">All</option>`;
  categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    dom.resourceCategory.appendChild(opt);
  });
}
// #endregion: Resources Rendering

// #region: Events + Delegation
/**
 * Bind navigation and section switching.
 */
function bindNavigation() {
  dom.navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const targetId = link.getAttribute("href").replace("#", "");
      showSection(targetId);
      toggleMobileNav(false);
    });
  });
}

/**
 * Bind mobile menu toggle.
 */
function bindMobileMenu() {
  if (!dom.navToggle) return;
  dom.navToggle.addEventListener("click", () => toggleMobileNav());
}

/**
 * Bind theme toggle behavior.
 */
function bindThemeToggle() {
  if (!dom.themeToggle) return;
  dom.themeToggle.addEventListener("change", (event) => {
    const isDark = event.target.checked;
    appState.settings.theme = isDark ? "dark" : "light";
    document.body.setAttribute("data-theme", isDark ? "dark" : "light");
    if (dom.themeLabel) {
      dom.themeLabel.textContent = isDark ? "Dark mode on" : "Dark mode off";
    }
    saveState();
  });
}

/**
 * Bind dashboard quick-add form.
 */
function bindQuickTaskForm() {
  if (!dom.quickTaskForm || !dom.quickError) return;
  dom.quickTaskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const error = validateQuickTaskForm();
    dom.quickError.textContent = error;
    if (error) return;

    const task = {
      id: createId("task"),
      title: dom.quickTitle.value.trim(),
      description: "",
      dueDate: dom.quickDueDate.value,
      priority: "medium",
      category: "",
      completed: false,
    };
    appState.tasks.push(task);
    saveState();
    dom.quickTaskForm.reset();
    renderTasks();
    renderDashboard();
  });
}

/**
 * Bind full Task form submit.
 */
function bindTaskForm() {
  if (!dom.taskForm || !dom.taskError) return;
  dom.taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const error = validateTaskForm();
    dom.taskError.textContent = error;
    if (error) return;

    const isEditing = Boolean(appState.ui.editingTaskId);
    if (isEditing) {
      const task = appState.tasks.find(
        (t) => t.id === appState.ui.editingTaskId
      );
      if (task) {
        task.title = dom.taskTitle.value.trim();
        task.description = dom.taskDescription.value.trim();
        task.dueDate = dom.taskDueDate.value;
        task.priority = dom.taskPriority.value;
        task.category = dom.taskCategory.value.trim();
      }
      appState.ui.editingTaskId = null;
      dom.taskSubmit.textContent = "Add task";
      dom.taskCancel.classList.add("hidden");
    } else {
      const task = {
        id: createId("task"),
        title: dom.taskTitle.value.trim(),
        description: dom.taskDescription.value.trim(),
        dueDate: dom.taskDueDate.value,
        priority: dom.taskPriority.value,
        category: dom.taskCategory.value.trim(),
        completed: false,
      };
      appState.tasks.push(task);
    }

    saveState();
    dom.taskForm.reset();
    renderTasks();
    renderDashboard();
  });
}

/**
 * Bind cancel editing button for tasks.
 */
function bindTaskCancel() {
  if (!dom.taskCancel) return;
  dom.taskCancel.addEventListener("click", () => {
    appState.ui.editingTaskId = null;
    dom.taskForm.reset();
    dom.taskError.textContent = "";
    dom.taskSubmit.textContent = "Add task";
    dom.taskCancel.classList.add("hidden");
  });
}

/**
 * Event delegation for the tasks list.
 */
function bindTaskListDelegation() {
  if (!dom.tasksList) return;
  dom.tasksList.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    const card = button.closest(".task-card");
    if (!card) return;
    const taskId = card.dataset.id;
    const task = appState.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const action = button.dataset.action;
    if (action === "toggle") {
      task.completed = !task.completed;
    }

    if (action === "edit") {
      appState.ui.editingTaskId = taskId;
      dom.taskTitle.value = task.title;
      dom.taskDescription.value = task.description || "";
      dom.taskDueDate.value = task.dueDate;
      dom.taskPriority.value = task.priority;
      dom.taskCategory.value = task.category || "";
      dom.taskSubmit.textContent = "Save task";
      dom.taskCancel.classList.remove("hidden");
    }

    if (action === "delete") {
      const confirmed = confirm("Delete this task?");
      if (confirmed) {
        appState.tasks = appState.tasks.filter((t) => t.id !== taskId);
      }
    }

    saveState();
    renderTasks();
    renderDashboard();
  });
}

/**
 * Bind task filters and sorting.
 */
function bindTaskFilters() {
  [dom.taskFilter, dom.taskCategoryFilter, dom.taskSort].forEach((el) => {
    if (!el) return;
    el.addEventListener("input", () => renderTasks());
    el.addEventListener("change", () => renderTasks());
  });
}

/**
 * Bind habit form submit.
 */
function bindHabitForm() {
  if (!dom.habitForm || !dom.habitError) return;
  dom.habitForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const error = validateHabitForm();
    dom.habitError.textContent = error;
    if (error) return;

    const habit = {
      id: createId("habit"),
      name: dom.habitName.value.trim(),
      goal: Number(dom.habitGoal.value),
      progress: new Array(7).fill(false),
      weekStart: getWeekStartISO(),
    };
    appState.habits.push(habit);
    saveState();
    dom.habitForm.reset();
    renderHabits();
    renderDashboard();
  });
}

/**
 * Event delegation for habit day toggles.
 */
function bindHabitDelegation() {
  if (!dom.habitsList) return;
  dom.habitsList.addEventListener("click", (event) => {
    const button = event.target.closest(".day-toggle");
    if (!button) return;

    const card = button.closest(".habit-card");
    if (!card) return;
    const habit = appState.habits.find((h) => h.id === card.dataset.id);
    if (!habit) return;

    const index = Number(button.dataset.dayIndex);
    habit.progress[index] = !habit.progress[index];
    saveState();
    renderHabits();
    renderDashboard();
  });
}

/**
 * Bind resources filter inputs.
 */
function bindResourcesFilters() {
  if (dom.resourceSearch) {
    dom.resourceSearch.addEventListener("input", () => renderResources());
  }
  if (dom.resourceCategory) {
    dom.resourceCategory.addEventListener("change", () => renderResources());
  }
}

/**
 * Event delegation for resource favorites.
 */
function bindResourcesDelegation() {
  if (!dom.resourcesList) return;
  dom.resourcesList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action=\"favorite\"]");
    if (!button) return;
    const card = button.closest(".resource-card");
    if (!card) return;

    const id = card.dataset.id;
    const isFavorite = appState.favorites.includes(id);
    if (isFavorite) {
      appState.favorites = appState.favorites.filter((fav) => fav !== id);
    } else {
      appState.favorites.push(id);
    }
    saveState();
    renderResources();
  });
}

/**
 * Bind reset button.
 */
function bindResetButton() {
  if (!dom.resetBtn) return;
  dom.resetBtn.addEventListener("click", () => {
    const confirmed = confirm("Reset all local data?");
    if (!confirmed) return;
    resetState();
    initTheme();
    renderAll();
  });
}
// #endregion: Events + Delegation

// #region: Async Fetch
/**
 * Load resources from JSON and update UI.
 */
async function loadResources() {
  if (!dom.resourcesStatus) return;
  dom.resourcesStatus.textContent = "Loading resources...";
  dom.resourcesStatus.classList.remove("is-error");
  try {
    const resources = await fetchResources();
    appState.resources = resources;
    populateResourceCategories();
    renderResources();
    dom.resourcesStatus.textContent = `Loaded ${resources.length} resources.`;
  } catch (error) {
    dom.resourcesStatus.textContent = "Failed to load resources.";
    dom.resourcesStatus.classList.add("is-error");
  }
}
// #endregion: Async Fetch

// #region: App Start
/**
 * Initialize theme from state.
 */
function initTheme() {
  const isDark = appState.settings.theme === "dark";
  document.body.setAttribute("data-theme", isDark ? "dark" : "light");
  if (dom.themeToggle) dom.themeToggle.checked = isDark;
  if (dom.themeLabel) {
    dom.themeLabel.textContent = isDark ? "Dark mode on" : "Dark mode off";
  }
}

/**
 * Render all main sections.
 */
function renderAll() {
  renderTasks();
  renderHabits();
  renderDashboard();
  renderResources();
}

/**
 * App entry point.
 */
function start() {
  loadState();
  initTheme();
  showSection("dashboard");
  renderAll();
  loadResources();

  // Bind events
  bindNavigation();
  bindMobileMenu();
  bindThemeToggle();
  bindQuickTaskForm();
  bindTaskForm();
  bindTaskCancel();
  bindTaskListDelegation();
  bindTaskFilters();
  bindHabitForm();
  bindHabitDelegation();
  bindResourcesFilters();
  bindResourcesDelegation();
  bindResetButton();
}

// Run after HTML is parsed (scripts are loaded with defer).
start();
// #endregion: App Start
