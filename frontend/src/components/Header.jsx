import Brand from "./ui/Brand";
import Icon from "./ui/Icon";
import Menu from "./ui/Menu";
import ThemeToggle from "./ui/ThemeToggle";

function UserMenu({ user, onLogout }) {
  const name =
    user?.name ||
    user?.username ||
    user?.fullName ||
    user?.email?.split("@")[0] ||
    "User";

  const initial = name.trim().charAt(0).toUpperCase() || "U";

  return (
    <Menu
      width="w-64"
      trigger={({ ref, open, props }) => (
        <button
          ref={ref}
          {...props}
          aria-label="Account menu"
          className="flex h-9 items-center gap-2 rounded-control pl-1 pr-2 transition-colors duration-150 hover:bg-sunken"
        >
          <span
            className="grid size-7 place-items-center rounded-md bg-navy/10 text-xs font-semibold text-navy"
            aria-hidden="true"
          >
            {initial}
          </span>

          <span className="hidden max-w-[10rem] truncate text-[13px] font-medium text-ink lg:block">
            {name}
          </span>

          <Icon
            name="arrow-down-s"
            size={16}
            className={`text-muted transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          />
        </button>
      )}
      header={
        <div className="border-b border-line px-3.5 py-3">
          <p className="truncate text-[13px] font-medium text-ink">{name}</p>

          {user?.email && (
            <p className="truncate text-xs text-muted">{user.email}</p>
          )}
        </div>
      }
      items={[
        {
          label: "Log out",
          icon: "logout-box-r",
          onSelect: onLogout,
        },
      ]}
      footer={
        <div className="border-t border-line p-2.5">
          <p className="mb-1.5 text-xs text-muted">Theme</p>

          <ThemeToggle />
        </div>
      }
    />
  );
}

export default function Header({ user, onLogout }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex items-center gap-2 text-[13px]">
            <li>
              <Brand />
            </li>

            <li aria-hidden="true" className="hidden text-faint sm:block">
              <Icon name="arrow-right-s" size={16} />
            </li>

            <li
              aria-current="page"
              className="hidden truncate font-medium text-ink sm:block"
            >
              Command library
            </li>
          </ol>
        </nav>

        <UserMenu user={user} onLogout={onLogout} />
      </div>
    </header>
  );
}
