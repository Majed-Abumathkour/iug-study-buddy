// This file handles persistence (localStorage) and async data loading.
// It does NOT touch the DOM directly.

// Storage key for localStorage.
const STORAGE_KEY = "studybuddy_state";

/**
 * Merge loaded data with defaults to avoid missing fields.
 */
function normalizeState(loaded) {
  const defaults = getDefaultState();
  return {
    ...defaults,
    ...loaded,
    settings: {
      ...defaults.settings,
      ...(loaded.settings || {}),
    },
    ui: {
      ...defaults.ui,
      ...(loaded.ui || {}),
    },
  };
}

/**
 * Load app state from localStorage into the global appState object.
 */
function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    const normalized = normalizeState(parsed);
    Object.assign(appState, normalized);
  } catch (error) {
    // If saved data is corrupted, ignore it and keep defaults.
    console.error("Failed to parse saved state:", error);
  }
}

/**
 * Save the current appState to localStorage.
 */
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

/**
 * Reset saved data in localStorage and in memory.
 */
function resetState() {
  const defaults = getDefaultState();
  Object.assign(appState, defaults);
  saveState();
}

/**
 * Fetch resources from a local JSON file (async fetch requirement).
 * This data will populate the Resources section later.
 */
async function fetchResources() {
  const response = await fetch("resources.json");
  if (!response.ok) {
    throw new Error("Failed to load resources.json");
  }
  return response.json();
}

