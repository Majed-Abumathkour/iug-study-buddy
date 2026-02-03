// This file owns the app data only.
// Persistence and fetching live in storage.js.

/**
 * Build a fresh default state object.
 */
function getDefaultState() {
  return {
    tasks: [],
    habits: [],
    resources: [],
    favorites: [],
    settings: {
      theme: "light",
    },
    ui: {
      editingTaskId: null,
      editingHabitId: null,
    },
  };
}

// Single source of truth for the app data.
const appState = getDefaultState();
