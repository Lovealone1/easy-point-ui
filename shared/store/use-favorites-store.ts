// ─────────────────────────────────────────────────────────────────────────────
// shared/store/use-favorites-store.ts
//
// Per-user localStorage-backed favorites store.
//
// Rules:
//  - Max 5 favorites total (1 pinned Dashboard + 4 user-added).
//  - The Dashboard (pinned: true) is always present and cannot be removed.
//  - Dynamic favorites are stored per-user in localStorage using the key
//    `ep_favorites_<userId>`.
//  - Overflow strategy: LIFO — when the list is full and the user pins a new
//    module, the most recently added dynamic favorite is removed to make room
//    for the new one (stack pop → push).
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';

const MAX_FAVORITES = 5;
const PINNED_ALWAYS = 1; // The Dashboard is always pinned
const MAX_DYNAMIC = MAX_FAVORITES - PINNED_ALWAYS; // = 4

/** Returns the localStorage key for a given user ID. */
function storageKey(userId: string): string {
  return `ep_favorites_${userId}`;
}

/** Reads dynamic favorites for a user from localStorage. */
function readFromStorage(userId: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Writes dynamic favorites for a user to localStorage. */
function writeToStorage(userId: string, ids: string[]): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(ids));
  } catch {
    // Ignore storage errors (private browsing, quota, etc.)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// State & Actions
// ─────────────────────────────────────────────────────────────────────────────

interface FavoritesState {
  /**
   * The active user ID used as the namespace for the localStorage key.
   * Must be set via `initForUser()` after login.
   */
  userId: string | null;

  /**
   * Ordered list of dynamic favorite module IDs (max 4).
   * Order represents addition history; index 0 = oldest, last index = newest.
   * Dashboard is always included via `MODULES_CATALOG.pinned` and is NOT here.
   */
  dynamicFavoriteIds: string[];

  /**
   * Load favorites from localStorage for the given user.
   * Call this once after the user is authenticated.
   */
  initForUser: (userId: string) => void;

  /**
   * Clears in-memory state (called on logout).
   * Does NOT wipe the user's localStorage data.
   */
  clearForUser: () => void;

  /**
   * Returns true if a module ID is currently in the dynamic favorites list.
   */
  isFavorite: (moduleId: string) => boolean;

  /**
   * Adds a module to the dynamic favorites list.
   * If the list is already at MAX_DYNAMIC (4), the most recently added entry
   * is removed first (LIFO: pop newest → push new).
   * Idempotent — adding an already-favorite module is a no-op.
   */
  addFavorite: (moduleId: string) => void;

  /**
   * Removes a module from the dynamic favorites list.
   * No-op if the module is not in the list.
   */
  removeFavorite: (moduleId: string) => void;

  /**
   * Toggles a module's favorite status.
   */
  toggleFavorite: (moduleId: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useFavoritesStore = create<FavoritesState>()((set, get) => ({
  userId: null,
  dynamicFavoriteIds: [],

  // ── initForUser ────────────────────────────────────────────────────────────
  initForUser: (userId) => {
    const ids = readFromStorage(userId);
    // Clamp to MAX_DYNAMIC in case the stored data was somehow corrupted
    const clamped = ids.slice(0, MAX_DYNAMIC);
    set({ userId, dynamicFavoriteIds: clamped });
  },

  // ── clearForUser ───────────────────────────────────────────────────────────
  clearForUser: () => set({ userId: null, dynamicFavoriteIds: [] }),

  // ── isFavorite ─────────────────────────────────────────────────────────────
  isFavorite: (moduleId) => {
    return get().dynamicFavoriteIds.includes(moduleId);
  },

  // ── addFavorite ────────────────────────────────────────────────────────────
  addFavorite: (moduleId) => {
    const { userId, dynamicFavoriteIds } = get();

    // Already a favorite — no-op
    if (dynamicFavoriteIds.includes(moduleId)) return;

    let next = [...dynamicFavoriteIds];

    if (next.length >= MAX_DYNAMIC) {
      // LIFO: remove the most recently added (last in the array) to make room
      next.pop();
    }

    // Append the new favorite at the end (newest)
    next = [...next, moduleId];

    if (userId) writeToStorage(userId, next);
    set({ dynamicFavoriteIds: next });
  },

  // ── removeFavorite ─────────────────────────────────────────────────────────
  removeFavorite: (moduleId) => {
    const { userId, dynamicFavoriteIds } = get();
    const next = dynamicFavoriteIds.filter((id) => id !== moduleId);
    if (userId) writeToStorage(userId, next);
    set({ dynamicFavoriteIds: next });
  },

  // ── toggleFavorite ─────────────────────────────────────────────────────────
  toggleFavorite: (moduleId) => {
    const { isFavorite, addFavorite, removeFavorite } = get();
    if (isFavorite(moduleId)) {
      removeFavorite(moduleId);
    } else {
      addFavorite(moduleId);
    }
  },
}));
