import { useEffect, useId, useMemo, useRef, useState } from "react";

import Icon from "./ui/Icon";
import useDialogBehavior from "./ui/useDialogBehavior";
import useTheme from "./ui/useTheme";
import { modKeyLabel } from "../lib/platform";

const MAX_RESULTS = 40;

function rank(item, query) {
  const title = item.title.toLowerCase();

  if (title.startsWith(query)) return 0;
  if (title.includes(query)) return 1;
  if (item.label?.toLowerCase().includes(query)) return 2;

  return 3;
}

/**
 * Search every saved block and jump to it. Enter copies the highlighted
 * command (placeholders are handled by the parent's onCopy).
 */
export default function CommandPalette({
  groups,
  isLoggedIn,
  onClose,
  onCopy,
  onNewGroup,
  onShowShortcuts,
}) {
  const panelRef = useRef(null);
  const inputRef = useRef(null);

  const listId = useId();

  const { setMode } = useTheme();

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  useDialogBehavior(panelRef);

  const blocks = useMemo(
    () =>
      groups.flatMap((group, groupIndex) =>
        (group.commands || []).map((command, index) => ({
          id: `block-${groupIndex}-${index}`,
          kind: "block",
          title: group.title || "Untitled",
          tag: group.tag,
          label: command.label || "",
          cmd: command.cmd || "",
          haystack:
            `${group.title} ${command.label} ${command.cmd} ${group.tag}`.toLowerCase(),
        })),
      ),
    [groups],
  );

  const actions = useMemo(
    () => [
      ...(isLoggedIn
        ? [{ id: "action-new", kind: "action", title: "New group", icon: "add", run: onNewGroup }]
        : []),
      { id: "action-system", kind: "action", title: "Theme: System", icon: "computer", run: () => setMode("system") },
      { id: "action-light", kind: "action", title: "Theme: Light", icon: "sun", run: () => setMode("light") },
      { id: "action-dark", kind: "action", title: "Theme: Dark", icon: "moon", run: () => setMode("dark") },
      { id: "action-keys", kind: "action", title: "Keyboard shortcuts", icon: "keyboard", run: onShowShortcuts },
    ],
    [isLoggedIn, onNewGroup, onShowShortcuts, setMode],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) {
      return [...actions, ...blocks.slice(0, 8)];
    }

    const matchedActions = actions.filter((item) => item.title.toLowerCase().includes(q));

    const matchedBlocks = blocks
      .filter((item) => item.haystack.includes(q))
      .sort((a, b) => rank(a, q) - rank(b, q))
      .slice(0, MAX_RESULTS);

    return [...matchedBlocks, ...matchedActions];
  }, [actions, blocks, query]);

  const safeIndex = Math.min(activeIndex, Math.max(results.length - 1, 0));
  const activeId = results[safeIndex] ? `${listId}-${results[safeIndex].id}` : undefined;

  useEffect(() => {
    if (activeId) {
      document.getElementById(activeId)?.scrollIntoView({ block: "nearest" });
    }
  }, [activeId]);

  const run = (item) => {
    onClose();

    if (item.kind === "action") {
      item.run?.();
    } else {
      onCopy(item.cmd);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((safeIndex + 1) % Math.max(results.length, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((safeIndex - 1 + results.length) % Math.max(results.length, 1));
    } else if (event.key === "Enter" && results[safeIndex]) {
      event.preventDefault();
      run(results[safeIndex]);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-scrim p-3 animate-fade sm:p-5 sm:pt-[12vh]"
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
        aria-label="Command palette"
        onKeyDown={handleKeyDown}
        className="flex max-h-[80dvh] w-full max-w-xl animate-pop flex-col overflow-hidden rounded-modal border border-line bg-elevated shadow-pop"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Icon name="search" size={18} className="text-faint" />

          <input
            ref={inputRef}
            autoFocus
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={activeId}
            aria-label="Search commands and actions"
            placeholder="Search commands, labels or code"
            autoComplete="off"
            spellCheck={false}
            className="h-12 min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
          />

          <kbd className="kbd">Esc</kbd>
        </div>

        <ul
          id={listId}
          role="listbox"
          aria-label="Results"
          className="flex-1 overflow-y-auto p-1.5"
        >
          {results.length === 0 && (
            <li className="px-3 py-10 text-center text-sm text-muted">
              No results for “{query.trim()}”.
            </li>
          )}

          {results.map((item, index) => {
            const active = index === safeIndex;

            return (
              <li
                key={item.id}
                id={`${listId}-${item.id}`}
                role="option"
                aria-selected={active}
                onMouseMove={() => setActiveIndex(index)}
                onClick={() => run(item)}
                className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 ${
                  active ? "bg-sunken" : ""
                }`}
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-md border border-line bg-surface text-muted">
                  <Icon name={item.kind === "action" ? item.icon : "terminal-box"} size={15} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-ink">
                    {item.title}
                    {item.label && (
                      <span className="font-normal text-muted"> / {item.label}</span>
                    )}
                  </span>

                  {item.kind === "block" && (
                    <span className="block truncate font-mono text-xs text-muted">
                      {item.cmd.split("\n")[0]}
                    </span>
                  )}
                </span>

                {item.kind === "block" ? (
                  <span className="chip shrink-0">{item.tag || "other"}</span>
                ) : (
                  <span className="shrink-0 text-xs text-faint">Action</span>
                )}
              </li>
            );
          })}
        </ul>

        <div className="hidden items-center gap-4 border-t border-line px-4 py-2 text-xs text-muted sm:flex">
          <span className="flex items-center gap-1.5">
            <kbd className="kbd">↑</kbd>
            <kbd className="kbd">↓</kbd>
            navigate
          </span>

          <span className="flex items-center gap-1.5">
            <kbd className="kbd">Enter</kbd>
            copy or run
          </span>

          <span className="ml-auto flex items-center gap-1.5">
            <kbd className="kbd">{modKeyLabel}</kbd>
            <kbd className="kbd">K</kbd>
            toggle
          </span>
        </div>
      </div>
    </div>
  );
}
