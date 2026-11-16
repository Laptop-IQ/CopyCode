import { useState } from "react";
import Sidebar from "./Sidebar";

export default function Layout({ user, token, onLogout, children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-control focus:bg-navy focus:px-3 focus:py-2 focus:text-sm focus:text-on-navy"
      >
        Skip to content
      </a>

      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        user={user}
        onLogout={onLogout}
      />

      {/* The page inside renders its own <main id="main"> landmark. */}
      <div
        className={`min-h-screen pt-14 transition-[margin] duration-300 ease-[cubic-bezier(.22,1,.36,1)] md:pt-0 ${
          collapsed ? "md:ml-[68px]" : "md:ml-[240px]"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
