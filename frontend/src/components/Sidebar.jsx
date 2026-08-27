import { useCallback, useEffect, useState } from "react";

import { NavLink, useNavigate } from "react-router-dom";

/* ============================================================
   ICONS
============================================================ */

function CodeIcon({ size = 16, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function ReceiptIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function MenuIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function XIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ChevronIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function LogOutIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

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
    label: "Code Copy",
    icon: ReceiptIcon,
    end: true,
  },
];

const FRAUNCES = {
  fontFamily: "'Fraunces', ui-serif, Georgia, serif",
};

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

  /* ==========================================================
     MOBILE RESIZE
  ========================================================== */

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

  /* ==========================================================
     ESC
  ========================================================== */

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

  /* ==========================================================
     LOGOUT
  ========================================================== */

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      /*
          Parent App logout:
          - clears storage
          - clears user
          - clears token
        */

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

      /*
          Important:
          Go to HOME after logout.

          Because auth state is null,
          App renders:

             CommandLibrary
             NO Sidebar
        */

      navigate("/", {
        replace: true,
      });
    }
  }, [isLoggingOut, navigate, onLogout]);

  /* ==========================================================
     USER
  ========================================================== */

  const userName =
    user?.name ||
    user?.username ||
    user?.fullName ||
    user?.email?.split("@")[0] ||
    "User";

  const userInitial = userName?.trim()?.charAt(0)?.toUpperCase() || "U";

  return (
    <>
      {/* ======================================================
          MOBILE TOP BAR
      ====================================================== */}

      <header
        className="
          md:hidden
          fixed
          top-0
          left-0
          right-0
          h-14
          bg-[#13111C]/95
          backdrop-blur-xl
          border-b
          border-white/[0.07]
          z-[60]
          flex
          items-center
          justify-between
          px-4
        "
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="
              w-8
              h-8
              shrink-0
              rounded-[10px]
              bg-gradient-to-br
              from-[#8B72FF]
              via-[#5B3FE0]
              to-[#33217F]
              flex
              items-center
              justify-center
              text-white
              shadow-lg
              shadow-[#5B3FE0]/20
            "
          >
            <CodeIcon size={14} />
          </div>

          <span
            style={FRAUNCES}
            className="
              text-[#F3F1FA]
              font-semibold
              text-[15px]
              tracking-tight
              truncate
            "
          >
            CmdKit
          </span>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="
            w-9
            h-9
            rounded-xl
            flex
            items-center
            justify-center
            text-slate-300
            hover:text-white
            hover:bg-white/[0.06]
            active:scale-95
            transition-all
          "
          aria-label="Open navigation menu"
          aria-expanded={mobileOpen}
        >
          <MenuIcon className="w-5 h-5" />
        </button>
      </header>

      {/* ======================================================
          MOBILE OVERLAY
      ====================================================== */}

      <div
        className={`
          md:hidden
          fixed
          inset-0
          z-[70]
          bg-black/60
          backdrop-blur-[3px]
          transition-opacity
          duration-300

          ${
            mobileOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }
        `}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className={`
          fixed
          top-0
          left-0
          h-full
          z-[80]

          bg-[#13111C]

          border-r
          border-white/[0.07]

          flex
          flex-col

          transition-[width,transform]
          duration-300
          ease-[cubic-bezier(.22,1,.36,1)]

          overflow-visible

          w-[264px]

          ${collapsed ? "md:w-[84px]" : "md:w-[264px]"}

          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        aria-label="Main navigation"
      >
        {/* ==================================================
            GLOW
        ================================================== */}

        <div
          className="
            absolute
            -top-24
            -left-20
            w-72
            h-72
            rounded-full
            bg-[#5B3FE0]/[0.13]
            blur-3xl
            pointer-events-none
          "
        />

        {/* ==================================================
            BRAND
        ================================================== */}

        <div
          className={`
            relative
            h-[72px]
            shrink-0

            flex
            items-center

            border-b
            border-white/[0.07]

            px-5

            ${collapsed ? "md:justify-center md:px-0" : "justify-between"}
          `}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="
                relative
                w-9
                h-9
                shrink-0
                rounded-xl

                bg-gradient-to-br
                from-[#9B85FF]
                via-[#5B3FE0]
                to-[#34218C]

                flex
                items-center
                justify-center

                text-white

                shadow-[0_8px_25px_rgba(91,63,224,0.28)]
              "
            >
              <CodeIcon size={15} />

              <span
                className="
                  absolute
                  -right-0.5
                  -bottom-0.5
                  w-2
                  h-2
                  rounded-full
                  bg-[#4ADE80]
                  border-2
                  border-[#13111C]
                "
              />
            </div>

            <div
              className={`
                min-w-0
                transition-all
                duration-200

                ${
                  collapsed
                    ? "md:w-0 md:opacity-0 md:overflow-hidden"
                    : "opacity-100"
                }
              `}
            >
              <p
                style={FRAUNCES}
                className="
                  text-[#F3F1FA]
                  font-semibold
                  text-[16px]
                  leading-tight
                  tracking-tight
                  truncate
                "
              >
                CmdKit
              </p>

              <p
                className="
                  text-slate-600
                  text-[10px]
                  mt-0.5
                  tracking-wide
                "
              >
                COMMAND LIBRARY
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="
              md:hidden
              w-8
              h-8
              rounded-lg
              flex
              items-center
              justify-center
              text-slate-400
              hover:text-white
              hover:bg-white/[0.06]
            "
            aria-label="Close navigation menu"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* ==================================================
            NAV
        ================================================== */}

        <nav
          className="
            relative
            flex-1

            px-3
            py-6

            overflow-y-auto
            overflow-x-visible
          "
        >
          <div
            className={`
              mb-3
              px-3

              ${
                collapsed
                  ? "md:h-0 md:opacity-0 md:overflow-hidden md:mb-0"
                  : ""
              }
            `}
          >
            <span
              className="
                text-[10px]
                font-semibold
                tracking-[0.18em]
                text-slate-600
                uppercase
              "
            >
              Workspace
            </span>
          </div>

          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `
                    group
                    relative

                    flex
                    items-center
                    gap-3

                    h-[46px]
                    rounded-xl

                    transition-all
                    duration-200

                    ${collapsed ? "md:justify-center md:px-0" : "px-3"}

                    ${
                      isActive
                        ? `
                          bg-gradient-to-r
                          from-[#5B3FE0]/25
                          via-[#5B3FE0]/10
                          to-transparent
                          text-white
                        `
                        : `
                          text-slate-400
                          hover:text-slate-100
                          hover:bg-white/[0.045]
                        `
                    }
                  `}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span
                          className="
                            absolute
                            left-0
                            top-1/2
                            -translate-y-1/2

                            h-7
                            w-[3px]

                            rounded-r-full

                            bg-gradient-to-b
                            from-[#B1A2FF]
                            to-[#5B3FE0]

                            shadow-[0_0_12px_rgba(123,92,255,0.8)]
                          "
                        />
                      )}

                      <span
                        className={`
                          w-9
                          h-9
                          shrink-0
                          rounded-[10px]

                          flex
                          items-center
                          justify-center

                          ${
                            isActive
                              ? `
                                bg-[#6D4FE8]/15
                                text-[#A999FF]
                              `
                              : `
                                text-slate-500
                                group-hover:text-slate-300
                              `
                          }
                        `}
                      >
                        <Icon className="w-[18px] h-[18px]" />
                      </span>

                      <span
                        className={`
                          text-[13px]
                          font-medium
                          whitespace-nowrap

                          transition-all
                          duration-200

                          ${
                            collapsed
                              ? "md:w-0 md:opacity-0 md:overflow-hidden"
                              : ""
                          }
                        `}
                      >
                        {item.label}
                      </span>

                      {collapsed && (
                        <span
                          className="
                            hidden
                            md:group-hover:block

                            absolute
                            left-[calc(100%+14px)]
                            top-1/2
                            -translate-y-1/2

                            px-3
                            py-2

                            rounded-lg

                            bg-[#211C35]
                            border
                            border-white/[0.09]

                            text-white
                            text-xs
                            font-medium

                            whitespace-nowrap

                            shadow-[0_10px_30px_rgba(0,0,0,0.35)]

                            z-[100]
                          "
                        >
                          {item.label}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* ==================================================
            USER + LOGOUT
        ================================================== */}

        <div className="relative shrink-0 p-3">
          <div
            className="
              h-px
              bg-gradient-to-r
              from-transparent
              via-white/[0.08]
              to-transparent
              mb-3
            "
          />

          {/* User */}

          <div
            className={`
              mb-2

              rounded-xl
              border
              border-white/[0.06]
              bg-white/[0.025]

              h-[52px]

              flex
              items-center
              gap-3

              px-2.5

              ${collapsed ? "md:justify-center md:px-0" : ""}
            `}
          >
            <div
              className="
                w-8
                h-8
                shrink-0
                rounded-lg

                bg-gradient-to-br
                from-[#8B72FF]
                to-[#4530A8]

                flex
                items-center
                justify-center

                text-white
                text-xs
                font-bold
              "
            >
              {userInitial}
            </div>

            <div
              className={`
                min-w-0

                ${collapsed ? "md:hidden" : ""}
              `}
            >
              <p
                className="
                  text-[12px]
                  text-white
                  font-medium
                  truncate
                "
              >
                {userName}
              </p>

              <p
                className="
                  text-[10px]
                  text-slate-600
                  truncate
                  mt-0.5
                "
              >
                Signed in
              </p>
            </div>
          </div>

          {/* Logout */}

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`
              group
              relative

              w-full
              h-[46px]
              rounded-xl

              flex
              items-center
              gap-3

              text-red-400

              hover:text-red-300
              hover:bg-red-500/[0.08]

              active:scale-[0.98]

              transition-all
              duration-200

              disabled:opacity-50
              disabled:cursor-not-allowed

              ${collapsed ? "md:justify-center md:px-0" : "px-3"}
            `}
            aria-label="Logout"
          >
            <span
              className="
                w-9
                h-9
                shrink-0
                rounded-[10px]

                flex
                items-center
                justify-center

                bg-red-500/[0.07]
                group-hover:bg-red-500/[0.12]
              "
            >
              {isLoggingOut ? (
                <span
                  className="
                    w-4
                    h-4
                    rounded-full
                    border-2
                    border-red-300/30
                    border-t-red-300
                    animate-spin
                  "
                />
              ) : (
                <LogOutIcon className="w-[18px] h-[18px]" />
              )}
            </span>

            <span
              className={`
                text-[13px]
                font-medium
                whitespace-nowrap

                ${collapsed ? "md:hidden" : ""}
              `}
            >
              {isLoggingOut ? "Signing out..." : "Logout"}
            </span>

            {collapsed && !isLoggingOut && (
              <span
                className="
                    hidden
                    md:group-hover:block

                    absolute
                    left-[calc(100%+14px)]
                    top-1/2
                    -translate-y-1/2

                    px-3
                    py-2

                    rounded-lg

                    bg-[#211C35]
                    border
                    border-white/[0.09]

                    text-white
                    text-xs
                    font-medium

                    whitespace-nowrap

                    shadow-[0_10px_30px_rgba(0,0,0,0.35)]

                    z-[100]
                  "
              >
                Logout
              </span>
            )}
          </button>
        </div>

        {/* ==================================================
            CENTER BORDER COLLAPSE
        ================================================== */}

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="
            hidden
            md:flex

            absolute

            top-1/2
            right-0

            translate-x-1/2
            -translate-y-1/2

            w-7
            h-7

            rounded-full

            items-center
            justify-center

            bg-[#1B1728]

            border
            border-white/[0.12]

            text-slate-400

            hover:text-white
            hover:bg-[#29213E]
            hover:border-[#765CE8]/60

            shadow-[0_4px_18px_rgba(0,0,0,0.45)]

            transition-all
            duration-200

            z-[120]
          "
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronIcon
            className={`
              w-3.5
              h-3.5

              transition-transform
              duration-300

              ${collapsed ? "rotate-180" : ""}
            `}
          />
        </button>
      </aside>
    </>
  );
}
