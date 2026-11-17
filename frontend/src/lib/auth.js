const STORAGE_KEYS = {
  USER: "user",
  TOKEN: "token",
};

/** Removes the stored session from both storages. Safe if storage is blocked. */
export function clearAuth() {
  for (const storage of ["localStorage", "sessionStorage"]) {
    try {
      window[storage].removeItem(STORAGE_KEYS.USER);
      window[storage].removeItem(STORAGE_KEYS.TOKEN);
    } catch (error) {
      console.error(`[Auth] ${storage} cleanup failed:`, error);
    }
  }
}
