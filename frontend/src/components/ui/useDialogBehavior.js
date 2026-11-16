import { useEffect } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared dialog behaviour:
 *  - locks page scroll while the dialog is open
 *  - keeps Tab / Shift+Tab inside the dialog panel
 *  - returns focus to the element that opened it
 *
 * Escape handling stays with each dialog so it can respect its busy state.
 */
export default function useDialogBehavior(panelRef) {
  useEffect(() => {
    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key !== "Tab" || event.defaultPrevented) {
        return;
      }

      const panel = panelRef.current;

      if (!panel) {
        return;
      }

      const focusable = panel.querySelectorAll(FOCUSABLE);

      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;

      if (opener instanceof HTMLElement && document.contains(opener)) {
        opener.focus();
      }
    };
  }, [panelRef]);
}
