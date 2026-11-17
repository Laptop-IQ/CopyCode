import { useCallback, useEffect, useState } from "react";

const KEY_PREFIX = "cmdkit-pins:";

function read(storageKey) {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Pinned group ids, stored per account in this browser.
 * (The API has no pin field, so pins are a local preference.)
 */
export default function usePins(accountKey) {
  const storageKey = `${KEY_PREFIX}${accountKey || "guest"}`;

  const [pinned, setPinned] = useState(() => read(storageKey));

  useEffect(() => {
    const sync = () => setPinned(read(storageKey));

    sync();

    window.addEventListener("storage", sync);

    return () => window.removeEventListener("storage", sync);
  }, [storageKey]);

  const toggle = useCallback(
    (id) => {
      if (!id) {
        return;
      }

      setPinned((previous) => {
        const next = previous.includes(id)
          ? previous.filter((entry) => entry !== id)
          : [...previous, id];

        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          /* Storage can be blocked; pins then last for this session only. */
        }

        return next;
      });
    },
    [storageKey],
  );

  return { pinned, toggle };
}
