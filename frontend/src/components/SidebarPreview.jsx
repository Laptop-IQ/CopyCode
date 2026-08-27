import { useState } from "react";

/* ---------------- Icons (hand-drawn, zero extra deps) ---------------- */
function ReceiptIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
function BriefcaseIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}
function CoffeeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  );
}
function MenuIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
function XIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function ChevronIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function TrendUpIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  );
}
function ClockIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

const navItems = [
  { key: "thermal", label: "Thermal Bill", icon: ReceiptIcon },
  { key: "expense", label: "Hotel Expense", icon: BriefcaseIcon },
  { key: "food", label: "Food Bill", icon: CoffeeIcon },
];

const FRAUNCES = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };

/* ---------------- Sidebar ---------------- */
function Sidebar({ active, setActive, collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside
        className={`fixed top-0 left-0 h-full z-50 bg-[#13111C] border-r border-white/[0.06] flex flex-col
          transition-all duration-300 ease-in-out overflow-hidden
          ${collapsed ? "md:w-[84px]" : "md:w-[264px]"}
          w-[264px]
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="absolute -top-20 -left-16 w-64 h-64 bg-[#5B3FE0]/[0.14] rounded-full blur-3xl pointer-events-none" />

        {/* Brand */}
        <div className={`relative flex items-center h-[72px] px-5 border-b border-white/[0.06] shrink-0 ${collapsed ? "md:justify-center md:px-0" : "justify-between"}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-[#8B72FF] via-[#5B3FE0] to-[#3B2A99] flex items-center justify-center text-white font-bold text-[13px] shadow-lg shadow-[#3B2A99]/40">
              SD
            </div>
            <div className={`min-w-0 ${collapsed ? "md:hidden" : ""}`}>
              <p style={FRAUNCES} className="text-[#F3F1FA] font-semibold text-[16px] leading-tight tracking-tight truncate">SF Dyes</p>
              <p className="text-slate-500 text-[11px] truncate">Expense Manager</p>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white/5">
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="relative flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {!collapsed && <p className="px-3 mb-2 text-[10px] font-semibold tracking-widest text-slate-600 uppercase hidden md:block">Menu</p>}
          {navItems.map((item) => {
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => { setActive(item.key); setMobileOpen(false); }}
                className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                  ${collapsed ? "md:justify-center md:px-0" : ""}
                  ${isActive ? "bg-gradient-to-r from-[#5B3FE0]/25 to-[#3B2A99]/10 text-white" : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]"}`}
              >
                {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-gradient-to-b from-[#9B85FF] to-[#5B3FE0]" />}
                <item.icon className={`w-[19px] h-[19px] shrink-0 transition-colors ${isActive ? "text-[#9B85FF]" : "text-slate-500 group-hover:text-slate-300"}`} />
                <span className={`text-[14px] font-medium whitespace-nowrap ${collapsed ? "md:hidden" : ""}`}>{item.label}</span>
                {collapsed && (
                  <span className="hidden md:group-hover:flex absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-[#1C1830] text-white text-xs font-medium whitespace-nowrap shadow-xl border border-white/10 z-50">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="hidden md:flex px-3 pb-2 shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] transition-all ${collapsed ? "justify-center" : ""}`}
          >
            <ChevronIcon className={`w-4 h-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
            {!collapsed && <span className="text-[13px] font-medium">Collapse</span>}
          </button>
        </div>

        {/* Profile */}
        <div className="relative border-t border-white/[0.06] p-4 shrink-0">
          <div className={`flex items-center gap-3 ${collapsed ? "md:justify-center" : ""}`}>
            <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-[#E3A83B] to-[#C6862A] flex items-center justify-center text-[#1a1408] text-sm font-bold">A</div>
            <div className={`min-w-0 ${collapsed ? "md:hidden" : ""}`}>
              <p className="text-slate-200 text-[13px] font-medium truncate">Admin</p>
              <p className="text-slate-500 text-[11px] truncate">admin@sfdyes.com</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

/* ---------------- Mock page content ---------------- */
function StatCard({ label, value, icon: Icon, tint }) {
  return (
    <div className="rounded-2xl bg-[#15121F] border border-white/[0.06] p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tint}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-slate-500 text-xs">{label}</p>
        <p className="text-white text-xl font-semibold mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function PageShell({ title, subtitle, children }) {
  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 style={FRAUNCES} className="text-[28px] md:text-[32px] font-semibold text-[#F3F1FA] tracking-tight">{title}</h1>
        <p className="text-slate-500 mt-1.5 text-sm">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function ThermalBillPage() {
  return (
    <PageShell title="Thermal Bill" subtitle="Track and manage all thermal billing records">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Bills" value="248" icon={ReceiptIcon} tint="bg-[#5B3FE0]/[0.14] text-[#9B85FF]" />
        <StatCard label="This Month" value="₹42,300" icon={TrendUpIcon} tint="bg-[#2BA893]/[0.14] text-[#3ECFB4]" />
        <StatCard label="Pending" value="6" icon={ClockIcon} tint="bg-[#E3A83B]/[0.14] text-[#E3A83B]" />
      </div>
      <div className="rounded-2xl bg-[#15121F] border border-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <p className="text-white font-medium text-sm">Recent Bills</p>
        </div>
        <div className="divide-y divide-white/[0.06]">
          {["Bill #1042 · 24 Aug", "Bill #1041 · 22 Aug", "Bill #1040 · 19 Aug"].map((row) => (
            <div key={row} className="px-5 py-3.5 flex items-center justify-between">
              <span className="text-slate-300 text-sm">{row}</span>
              <span className="text-[#3ECFB4] text-xs px-2.5 py-1 rounded-full bg-[#2BA893]/10">Paid</span>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

function HotelExpensePage() {
  return (
    <PageShell title="Hotel Expense" subtitle="Submit and review hotel expense claims">
      <div className="rounded-2xl bg-[#15121F] border border-white/[0.06] p-6 max-w-xl">
        <div className="space-y-4">
          {["Hotel Name", "Check-in Date", "Amount (₹)"].map((label) => (
            <div key={label}>
              <label className="text-slate-400 text-xs font-medium">{label}</label>
              <div className="mt-1.5 h-10 rounded-lg bg-white/[0.03] border border-white/10" />
            </div>
          ))}
          <button className="mt-2 w-full h-10 rounded-lg bg-gradient-to-r from-[#6D4FE8] to-[#4530A8] text-white text-sm font-medium hover:brightness-110 transition">
            Submit Expense
          </button>
        </div>
      </div>
    </PageShell>
  );
}

function FoodBillPage() {
  return (
    <PageShell title="Food Bill" subtitle="Log daily food expenses">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {["Breakfast", "Lunch", "Dinner", "Others"].map((meal) => (
          <div key={meal} className="rounded-2xl bg-[#15121F] border border-white/[0.06] p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E3A83B]/[0.14] text-[#E3A83B] flex items-center justify-center">
                <CoffeeIcon className="w-4 h-4" />
              </div>
              <span className="text-slate-300 text-sm font-medium">{meal}</span>
            </div>
            <span className="text-white text-sm font-semibold">₹0</span>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

/* ---------------- App ---------------- */
export default function App() {
  const [active, setActive] = useState("thermal");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const pages = { thermal: <ThermalBillPage />, expense: <HotelExpensePage />, food: <FoodBillPage /> };

  return (
    <div className="min-h-screen bg-[#0A0810]">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap" rel="stylesheet" />

      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#13111C]/95 backdrop-blur-xl border-b border-white/[0.06] z-30 flex items-center justify-between px-4">
        <span style={FRAUNCES} className="text-[#F3F1FA] font-semibold text-sm">SF Dyes</span>
        <button onClick={() => setMobileOpen(true)} className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-300">
          <MenuIcon className="w-5 h-5" />
        </button>
      </div>

      <Sidebar active={active} setActive={setActive} collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <main className={`pt-14 md:pt-0 transition-all duration-300 ease-in-out ${collapsed ? "md:pl-[84px]" : "md:pl-[264px]"}`}>
        {pages[active]}
      </main>
    </div>
  );
}
