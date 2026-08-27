import { useState } from "react";
import Sidebar from "./Sidebar";

export default function Layout({ user, token, onLogout, children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="
        min-h-screen
        bg-[#0A0810]
        text-white
      "
    >
      {/* ==================================================
          SIDEBAR
      ================================================== */}

      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        user={user}
        onLogout={onLogout}
      />

      {/* ==================================================
          MAIN CONTENT
      ================================================== */}

      <main
        className={`
          min-h-screen

          pt-14
          md:pt-0

          transition-[margin]
          duration-300
          ease-[cubic-bezier(.22,1,.36,1)]

          ${collapsed ? "md:ml-[84px]" : "md:ml-[264px]"}
        `}
      >
        {children}
      </main>
    </div>
  );
}
