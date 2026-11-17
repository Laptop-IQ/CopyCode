import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import Header from "./Header";
import { clearAuth } from "../lib/auth";

export default function Layout({ user, onLogout, children }) {
  const navigate = useNavigate();

  /* Parent clears storage and state; we then return home. */
  const handleLogout = useCallback(async () => {
    try {
      if (typeof onLogout === "function") {
        await onLogout();
      } else {
        clearAuth();
      }
    } catch (error) {
      console.error("[Auth] Logout failed:", error);
      clearAuth();
    } finally {
      navigate("/", { replace: true });
    }
  }, [navigate, onLogout]);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-control focus:bg-navy focus:px-3 focus:py-2 focus:text-sm focus:text-on-navy"
      >
        Skip to content
      </a>

      <Header user={user} onLogout={handleLogout} />

      {/* The page inside renders its own <main id="main"> landmark. */}
      {children}
    </div>
  );
}
