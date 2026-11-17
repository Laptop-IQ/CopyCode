import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "cmdkit-theme";
const CHANGE_EVENT = "cmdkit-theme-change";
const DARK_QUERY = "(prefers-color-scheme: dark)";

export const THEME_MODES = ["system", "light", "dark"];

const THEME_COLORS = { light: "#f7f6f2", dark: "#171a18" };

function readMode() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);

    return THEME_MODES.includes(value) ? value : "system";
  } catch {
    return "system";
  }
}

function systemPrefersDark() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(DARK_QUERY).matches
  );
}

/**
 * Theme preference: "system" follows the OS, "light" / "dark" are explicit.
 * The first paint is handled by the inline script in index.html; this hook
 * keeps the <html data-theme> attribute in sync afterwards, and keeps every
 * toggle on the page (and other tabs) showing the same choice.
 */
export default function useTheme() {
  const [mode, setModeState] = useState(readMode);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  const resolved =
    mode === "system" ? (systemDark ? "dark" : "light") : mode;

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;

    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", THEME_COLORS[resolved]);
  }, [resolved]);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return undefined;
    }

    const query = window.matchMedia(DARK_QUERY);
    const handleChange = (event) => setSystemDark(event.matches);

    query.addEventListener("change", handleChange);

    return () => query.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const sync = () => setModeState(readMode());

    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setMode = useCallback((next) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* Storage can be blocked; the choice then lasts for this session only. */
    }

    setModeState(next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { mode, resolved, setMode };
}
