import Icon from "./Icon";
import useTheme, { THEME_MODES } from "./useTheme";

const OPTIONS = {
  system: { label: "System", icon: "computer" },
  light: { label: "Light", icon: "sun" },
  dark: { label: "Dark", icon: "moon" },
};

/**
 * variant="segmented"  three buttons, for roomy places (sidebar)
 * variant="cycle"      one icon button that steps System > Light > Dark
 */
export default function ThemeToggle({ variant = "segmented", className = "" }) {
  const { mode, setMode } = useTheme();

  if (variant === "cycle") {
    const next = THEME_MODES[(THEME_MODES.indexOf(mode) + 1) % THEME_MODES.length];
    const label = `Theme: ${OPTIONS[mode].label}. Switch to ${OPTIONS[next].label}.`;

    return (
      <button
        type="button"
        onClick={() => setMode(next)}
        className={`icon-btn ${className}`}
        aria-label={label}
        title={label}
      >
        <Icon name={OPTIONS[mode].icon} size={18} />
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Theme"
      className={`flex rounded-control border border-line bg-surface p-0.5 shadow-xs ${className}`}
    >
      {THEME_MODES.map((value) => {
        const active = mode === value;

        return (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            aria-pressed={active}
            aria-label={OPTIONS[value].label}
            title={OPTIONS[value].label}
            className={`flex h-7 flex-1 items-center justify-center rounded-md transition-colors duration-150 ${
              active ? "bg-sunken text-ink" : "text-muted hover:text-ink"
            }`}
          >
            <Icon
              name={OPTIONS[value].icon}
              variant={active ? "fill" : "line"}
              size={16}
            />
          </button>
        );
      })}
    </div>
  );
}
