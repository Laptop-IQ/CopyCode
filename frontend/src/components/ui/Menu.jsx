import { useCallback, useEffect, useId, useRef, useState } from "react";

import Icon from "./Icon";

/**
 * Accessible dropdown menu.
 *  - Arrow keys / Home / End move between items, Escape closes and refocuses
 *  - Closes on outside click and on Tab
 *
 * items: [{ label, icon, onSelect, danger, disabled }]
 * `header` / `footer` are free content shown above / below the item list.
 */
export default function Menu({
  trigger,
  items,
  header,
  footer,
  align = "right",
  width = "w-56",
}) {
  const [open, setOpen] = useState(false);

  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const menuId = useId();

  const close = useCallback((restoreFocus = true) => {
    setOpen(false);

    if (restoreFocus) {
      triggerRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      menuRef.current?.querySelector('[role="menuitem"]:not([disabled])')?.focus();
    }
  }, [open]);

  const handleMenuKeyDown = (event) => {
    const entries = [
      ...menuRef.current.querySelectorAll('[role="menuitem"]:not([disabled])'),
    ];

    const current = entries.indexOf(document.activeElement);

    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "Tab") {
      setOpen(false);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      entries[(current + 1) % entries.length]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      entries[(current - 1 + entries.length) % entries.length]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      entries[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      entries[entries.length - 1]?.focus();
    }
  };

  return (
    <div ref={rootRef} className="relative">
      {trigger({
        ref: triggerRef,
        open,
        props: {
          type: "button",
          "aria-haspopup": "menu",
          "aria-expanded": open,
          "aria-controls": open ? menuId : undefined,
          onClick: () => setOpen((previous) => !previous),
          onKeyDown: (event) => {
            if (event.key === "ArrowDown" && !open) {
              event.preventDefault();
              setOpen(true);
            }
          },
        },
      })}

      {open && (
        <div
          id={menuId}
          ref={menuRef}
          role="menu"
          onKeyDown={handleMenuKeyDown}
          className={`absolute z-50 mt-1.5 ${width} animate-pop overflow-hidden rounded-card border border-line bg-elevated shadow-pop ${
            align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left"
          }`}
        >
          {header}

          {items?.length > 0 && (
            <div className="p-1">
              {items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    close(false);
                    item.onSelect?.();
                  }}
                  className={`flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-[13px] font-medium outline-none transition-colors duration-150 focus-visible:bg-sunken disabled:opacity-50 ${
                    item.danger
                      ? "text-danger hover:bg-danger-soft focus-visible:bg-danger-soft"
                      : "text-ink hover:bg-sunken"
                  }`}
                >
                  {item.icon && <Icon name={item.icon} size={17} />}
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {footer}
        </div>
      )}
    </div>
  );
}
