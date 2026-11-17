import { useRef } from "react";

import Icon from "./ui/Icon";
import useDialogBehavior from "./ui/useDialogBehavior";
import { modKeyLabel } from "../lib/platform";

const SHORTCUTS = [
  { keys: [modKeyLabel, "K"], label: "Open the command palette" },
  { keys: ["/"], label: "Focus search" },
  { keys: ["N"], label: "New group", signedInOnly: true },
  { keys: ["?"], label: "Show this list" },
  { keys: ["Esc"], label: "Close a dialog or menu" },
];

export default function ShortcutsDialog({ isLoggedIn, onClose }) {
  const panelRef = useRef(null);

  useDialogBehavior(panelRef);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-scrim p-4 animate-fade"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onClose();
          }
        }}
        className="w-full max-w-sm animate-pop rounded-modal border border-line bg-elevated p-5 shadow-pop"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="shortcuts-title"
            className="text-base font-semibold tracking-tight text-ink"
          >
            Keyboard shortcuts
          </h2>

          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="icon-btn -mr-1.5"
            aria-label="Close"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <ul className="divide-y divide-line">
          {SHORTCUTS.filter((item) => isLoggedIn || !item.signedInOnly).map((item) => (
            <li
              key={item.label}
              className="flex items-center justify-between gap-4 py-2.5 text-sm"
            >
              <span className="text-ink">{item.label}</span>

              <span className="flex shrink-0 items-center gap-1">
                {item.keys.map((key) => (
                  <kbd key={key} className="kbd">
                    {key}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
