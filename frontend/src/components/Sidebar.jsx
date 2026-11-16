import { useCallback, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import Brand from "./ui/Brand";
import Icon from "./ui/Icon";
import ThemeToggle from "./ui/ThemeToggle";

/* ============================================================
   CONSTANTS
============================================================ */

const STORAGE_KEYS = {
  USER: "user",
  TOKEN: "token",
};

const navItems = [
  {
    to: "/",
    label: "Command library",
    icon: "terminal-box",
    end: true,
  },
];

/* ============================================================
   CLEAR AUTH
============================================================ */

function clearAuth() {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  } catch (error) {
    console.error("[Auth] localStorage cleanup failed:", error);
  }

  try {
    sessionStorage.removeItem(STORAGE_KEYS.USER);
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
  } catch (error) {
    console.error("[Auth] sessionStorage cleanup failed:", error);
  }
}

/* ============================================================
   SIDEBAR
============================================================ */

export default function Sidebar({ collapsed, setCollapsed, user, onLogout }) {
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /* Close the drawer when the viewport grows to desktop. */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  /* Escape closes the drawer. */
  useEffect(() => {
    if (!mobileOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  /* Logout: parent clears storage and state, then we go home. */
  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

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
      setMobileOpen(false);
      setIsLoggingOut(false);

      navigate("/", {
        replace: true,
      });
    }
  }, [isLoggingOut, navigate, onLogout]);

  const userName =
    user?.name ||
    user?.username ||
    user?.fullName ||
    user?.email?.split("@")[0] ||
    "User";

  const userInitial = userName?.trim()?.charAt(0)?.toUpperCase() || "U";

  return (
    <>
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-[60] flex h-14 items-center justify-between border-b border-line bg-canvas/90 px-4 backdrop-blur md:hidden">
        <Brand />

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="icon-btn -mr-2 size-10"
          aria-label="Open navigation menu"
          aria-expanded={mobileOpen}
          aria-controls="app-sidebar"
        >
          <Icon name="menu" size={20} />
        </button>
      </header>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-[55] bg-scrim transition-opacity duration-200 md:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        id="app-sidebar"
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-[60] flex w-[272px] flex-col border-r border-line bg-sunken transition-[transform,width,visibility] duration-300 ease-[cubic-bezier(.22,1,.36,1)] md:visible md:translate-x-0 ${
          collapsed ? "md:w-[68px]" : "md:w-[240px]"
        } ${
          mobileOpen
            ? "visible translate-x-0 shadow-pop"
            : "invisible -translate-x-full"
        }`}
      >
        {/* Brand */}
        <div
          className={`flex h-14 shrink-0 items-center justify-between px-3.5 ${
            collapsed ? "md:justify-center md:px-0" : ""
          }`}
        >
          <Brand compact={collapsed} />

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="icon-btn -mr-1.5 md:hidden"
            aria-label="Close navigation menu"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-2">
          <ul className="space-y-0.5">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex h-9 items-center gap-2.5 rounded-control px-2.5 text-[13px] font-medium transition-colors duration-150 ${
                      collapsed ? "md:justify-center md:px-0" : ""
                    } ${
                      isActive
                        ? "bg-surface text-ink shadow-xs ring-1 ring-line"
                        : "text-muted hover:bg-ink/[0.045] hover:text-ink"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        name={item.icon}
                        variant={isActive ? "fill" : "line"}
                        size={18}
                        className={isActive ? "text-navy" : ""}
                      />
                      <span className={collapsed ? "md:sr-only" : ""}>
                        {item.label}
                      </span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Theme */}
        <div className="px-2.5 pb-1.5">
          <ThemeToggle
            className={collapsed ? "md:hidden" : ""}
          />

          {collapsed && (
            <ThemeToggle
              variant="cycle"
              className="mx-auto hidden md:inline-flex"
            />
          )}
        </div>

        {/* Collapse toggle (desktop only) */}
        <div className="hidden px-2.5 pb-2 md:block">
          <button
            type="button"
            onClick={() => setCollapsed((previous) => !previous)}
            aria-expanded={!collapsed}
            aria-controls="app-sidebar"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`flex h-9 w-full items-center gap-2.5 rounded-control px-2.5 text-[13px] font-medium text-muted transition-colors duration-150 hover:bg-ink/[0.045] hover:text-ink ${
              collapsed ? "justify-center px-0" : ""
            }`}
          >
            <Icon
              name={collapsed ? "sidebar-unfold" : "sidebar-fold"}
              size={18}
            />
            <span className={collapsed ? "sr-only" : ""}>
              {collapsed ? "Expand sidebar" : "Collapse sidebar"}
            </span>
          </button>
        </div>

        {/* Account */}
        <div className="shrink-0 border-t border-line p-2.5">
          <div
            className={`flex items-center gap-2.5 p-1.5 ${
              collapsed ? "md:justify-center md:p-0" : ""
            }`}
          >
            <span
              className="grid size-8 shrink-0 place-items-center rounded-lg bg-navy/10 text-[13px] font-semibold text-navy"
              aria-hidden="true"
            >
              {userInitial}
            </span>

            <div className={`min-w-0 flex-1 ${collapsed ? "md:hidden" : ""}`}>
              <p className="truncate text-[13px] font-medium leading-tight text-ink">
                {userName}
              </p>

              {user?.email && (
                <p className="truncate text-xs text-muted">{user.email}</p>
              )}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`icon-btn ${collapsed ? "md:hidden" : ""}`}
              aria-label="Log out"
              title="Log out"
            >
              <Icon
                name={isLoggingOut ? "loader-4" : "logout-box-r"}
                spin={isLoggingOut}
                size={18}
              />
            </button>
          </div>

          {collapsed && (
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="icon-btn mx-auto mt-1.5 hidden md:inline-flex"
              aria-label="Log out"
              title="Log out"
            >
              <Icon
                name={isLoggingOut ? "loader-4" : "logout-box-r"}
                spin={isLoggingOut}
                size={18}
              />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
