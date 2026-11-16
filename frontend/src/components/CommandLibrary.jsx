import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import Icon from "./ui/Icon";
import useDialogBehavior from "./ui/useDialogBehavior";
import Brand from "./ui/Brand";
import ThemeToggle from "./ui/ThemeToggle";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_BASE_URL ||
  ""
).replace(/\/+$/, "");

const API_BASE = `${API_BASE_URL}/api/commands`;
const REQUEST_TIMEOUT = 15000;
const SEARCH_DEBOUNCE = 350;

const CACHE_VERSION = "v2";
const CACHE_KEY_PREFIX = `cmdkit-command-library-${CACHE_VERSION}`;

const getCacheKey = (user) => {
  const userId =
    user?._id ||
    user?.id ||
    user?.userId ||
    user?.email ||
    user?.username ||
    "anonymous";

  return `${CACHE_KEY_PREFIX}-${String(userId)}`;
};

const readCachedGroups = (user) => {
  try {
    const raw = localStorage.getItem(getCacheKey(user));

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed?.groups)) {
      return [];
    }

    return parsed.groups;
  } catch {
    return [];
  }
};

const writeCachedGroups = (user, groups) => {
  try {
    localStorage.setItem(
      getCacheKey(user),
      JSON.stringify({
        version: CACHE_VERSION,
        updatedAt: Date.now(),
        groups: Array.isArray(groups) ? groups : [],
      }),
    );
  } catch {
   
  }
};

const clearCachedGroups = (user) => {
  try {
    localStorage.removeItem(getCacheKey(user));
  } catch {
   
  }
};


const TAG_COLORS = {
  git: "#c2410c",
  npm: "#b91c1c",
  javascript: "#a16207",
  typescript: "#1d4ed8",
  react: "#0e7490",
  jsx: "#0e7490",
  tsx: "#1d4ed8",
  css: "#be185d",
  json: "#7c5e10",
};

const TAG_FALLBACK_COLOR = "#6b7280";

const tagColor = (tag) => TAG_COLORS[tag] || TAG_FALLBACK_COLOR;


const CODE_LANGUAGES = [
  { value: "bash", label: "Bash / Shell" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "jsx", label: "React JSX" },
  { value: "tsx", label: "React TSX" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
];

const ENTRY_TYPES = [
  {
    value: "single",
    label: "Single Line",
    description: "One command or one line",
  },
  {
    value: "multi",
    label: "Multiple Lines",
    description: "Multiple commands / script",
  },
  {
    value: "component",
    label: "Full Component",
    description: "Complete code like ChatGPT output",
  },
];

const CheckIcon = ({ size = 14 }) => <Icon name="check" size={size} />;
const CopyIcon = ({ size = 14 }) => <Icon name="file-copy" size={size} />;
const PlusIcon = ({ size = 16 }) => <Icon name="add" size={size} />;
const TrashIcon = ({ size = 16 }) => <Icon name="delete-bin" size={size} />;
const EditIcon = ({ size = 16 }) => <Icon name="edit" size={size} />;
const XIcon = ({ size = 18 }) => <Icon name="close" size={size} />;
const SpinnerIcon = ({ size = 16 }) => (
  <Icon name="loader-4" size={size} spin />
);
const SearchIcon = ({ size = 16 }) => <Icon name="search" size={size} />;
const LockIcon = ({ size = 14 }) => <Icon name="lock" size={size} />;

const getStoredToken = () => {
  try {
    return (
      localStorage.getItem("token") || sessionStorage.getItem("token") || null
    );
  } catch {
    return null;
  }
};

const createClientId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const getErrorMessage = (error) => {
  if (error?.name === "AbortError") {
    return "Request cancelled.";
  }

  if (error?.status === 401 || error?.status === 403) {
    return "Your login session has expired. Please login again.";
  }

  if (error?.status >= 500) {
    return "Server error. Please try again shortly.";
  }

  if (error?.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
};

const normalizeGroups = (groups) => {
  if (!Array.isArray(groups)) {
    return [];
  }

  return groups.filter(Boolean);
};

async function request(url, options = {}) {
  const controller = new AbortController();

  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT);

  let externalAbortHandler = null;

  try {
    if (options.signal) {
      if (options.signal.aborted) {
        controller.abort();
      } else {
        externalAbortHandler = () => controller.abort();

        options.signal.addEventListener("abort", externalAbortHandler, {
          once: true,
        });
      }
    }

    const token = getStoredToken();

    const headers = {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    };

    if (token && !headers.Authorization) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
      signal: controller.signal,
    });

    let data = null;

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    } else {
      try {
        const text = await response.text();
        data = text ? { message: text } : null;
      } catch {
        data = null;
      }
    }

    if (response.status === 401 || response.status === 403) {
      const error = new Error(data?.message || "Authentication required");

      error.status = response.status;
      error.data = data;

      throw error;
    }

    if (!response.ok) {
      const error = new Error(
        data?.message || `Request failed with status ${response.status}`,
      );

      error.status = response.status;
      error.data = data;

      throw error;
    }

    return data || {};
  } finally {
    window.clearTimeout(timeoutId);

    if (options.signal && externalAbortHandler) {
      options.signal.removeEventListener("abort", externalAbortHandler);
    }
  }
}

const api = {
  get: (url, options = {}) =>
    request(url, {
      ...options,
      method: "GET",
    }),

  post: (url, body, options = {}) =>
    request(url, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: (url, body, options = {}) =>
    request(url, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: (url, options = {}) =>
    request(url, {
      ...options,
      method: "DELETE",
    }),
};


function CopyButton({ text, large = false }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    const value = text || "";

    if (!value) {
      toast.info("Nothing to copy.");
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement("textarea");

        textarea.value = value;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "0";

        document.body.appendChild(textarea);

        textarea.focus();
        textarea.select();

        const successful = document.execCommand("copy");

        textarea.remove();

        if (!successful) {
          throw new Error("Copy failed");
        }
      }

      setCopied(true);
      toast.success("Copied to clipboard");

      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }

      timerRef.current = window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      toast.error("Unable to copy code.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Code copied" : "Copy code"}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-md font-medium transition-colors duration-150 ${
        large ? "h-8 px-2.5 text-[13px]" : "h-7 px-2 text-xs"
      } ${
        copied
          ? "text-code-prompt"
          : "text-code-muted hover:bg-code-line hover:text-code-strong"
      }`}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

function CommandCard({ item, onDelete, onEdit, deleting }) {
  const tag = item?.tag || "other";
  const commands = Array.isArray(item?.commands) ? item.commands : [];
  const groupId = item?._id || item?.id || item?.clientId || "unknown";

  const typeLabel =
    item?.entryType === "component"
      ? "Full component"
      : item?.entryType === "multi"
        ? "Multi-line"
        : null;

  return (
    <article className="group rounded-card border border-line bg-surface shadow-card">
      <header className="flex items-start justify-between gap-3 px-4 pb-3 pt-3.5 sm:px-5">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold tracking-tight text-ink">
            {item?.title || "Untitled"}
          </h3>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="chip">
              <span
                className="size-1.5 rounded-full"
                style={{ background: tagColor(tag) }}
                aria-hidden="true"
              />
              {tag}
            </span>

            {typeLabel && (
              <span className="chip bg-transparent text-muted">{typeLabel}</span>
            )}

            <span className="text-xs text-muted">
              {commands.length} {commands.length === 1 ? "block" : "blocks"}
            </span>
          </div>
        </div>

        <div className="card-actions -mr-1.5 flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => onEdit(item)}
            disabled={Boolean(deleting)}
            className="icon-btn hover:text-accent"
            title="Edit"
            aria-label={`Edit ${item?.title || "command group"}`}
          >
            <EditIcon />
          </button>

          <button
            type="button"
            onClick={() => onDelete(groupId)}
            disabled={Boolean(deleting)}
            className="icon-btn hover:bg-danger-soft hover:text-danger"
            title="Delete"
            aria-label={`Delete ${item?.title || "command group"}`}
          >
            {deleting ? <SpinnerIcon /> : <TrashIcon />}
          </button>
        </div>
      </header>

      <div className="space-y-2 px-3 pb-3 sm:px-4 sm:pb-4">
        {commands.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line-strong px-4 py-5 text-center text-sm text-muted">
            This group has no code blocks yet.
          </p>
        ) : (
          commands.map((command, index) => {
            const value = command?.cmd || "";

            const isMultiLine =
              value.includes("\n") ||
              item?.entryType === "multi" ||
              item?.entryType === "component";

            const showHeader = isMultiLine || Boolean(command?.label);

            const commandKey =
              command?._id || command?.id || `${groupId}-${index}`;

            return (
              <div key={commandKey} className="overflow-hidden rounded-lg border border-code-line bg-code">
                {showHeader && (
                  <div className="flex items-center justify-between gap-2 border-b border-code-line bg-code-raised/60 py-1 pl-3 pr-1.5">
                    <span className="truncate font-mono text-xs text-code-muted">
                      {command?.label || item?.language || "code"}
                    </span>

                    <CopyButton text={value} />
                  </div>
                )}

                {isMultiLine ? (
                  <pre className="max-h-[480px] overflow-auto whitespace-pre p-4 font-mono text-[12.5px] leading-6 text-code-text">
                    <code>{value}</code>
                  </pre>
                ) : (
                  <div className="flex items-center gap-2 py-1.5 pl-3 pr-1.5">
                    <span
                      className="select-none font-mono text-[13px] text-code-prompt"
                      aria-hidden="true"
                    >
                      $
                    </span>

                    <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap py-1 font-mono text-[12.5px] text-code-text">
                      {value}
                    </code>

                    {!showHeader && <CopyButton text={value} />}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </article>
  );
}

function CodeInput({ item, index, onChange, onRemove, canRemove, entryType }) {
  const isCode = entryType === "multi" || entryType === "component";

  const handleKeyDown = (event) => {
    if (event.key !== "Tab") {
      return;
    }

    event.preventDefault();

    const textarea = event.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newValue =
      textarea.value.substring(0, start) + "  " + textarea.value.substring(end);

    onChange({
      ...item,
      cmd: newValue,
    });

    requestAnimationFrame(() => {
      textarea.selectionStart = start + 2;
      textarea.selectionEnd = start + 2;
    });
  };

  return (
    <div className="overflow-hidden rounded-card border border-code-line bg-code focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-surface">
      <div className="flex items-center gap-2 border-b border-code-line bg-code-raised/60 py-1 pl-3 pr-1.5">
        <input
          type="text"
          value={item?.label || ""}
          onChange={(event) =>
            onChange({
              ...item,
              label: event.target.value,
            })
          }
          maxLength={100}
          aria-label={`Label for code block ${index + 1}`}
          placeholder={
            entryType === "component"
              ? "Component or file name (optional)"
              : "Label (optional)"
          }
          className="h-7 min-w-0 flex-1 bg-transparent font-mono text-xs text-code-text outline-none placeholder:text-code-muted/70"
        />

        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-code-muted transition-colors hover:bg-code-line hover:text-code-strong"
            title="Remove"
            aria-label={`Remove code block ${index + 1}`}
          >
            <XIcon size={16} />
          </button>
        )}
      </div>

      <div className="relative">
        <textarea
          value={item?.cmd || ""}
          onChange={(event) =>
            onChange({
              ...item,
              cmd: event.target.value,
            })
          }
          onKeyDown={handleKeyDown}
          aria-label={`Code for block ${index + 1}`}
          placeholder={
            entryType === "single"
              ? "npm install express"
              : entryType === "multi"
                ? "npm install express\nnpm install mongoose\nnpm run dev"
                : `import React from "react";\n\nexport default function MyComponent() {\n  return (\n    <div>\n      Hello World\n    </div>\n  );\n}`
          }
          rows={isCode ? 12 : 3}
          maxLength={50000}
          spellCheck={false}
          className={`block w-full resize-y bg-transparent px-4 py-3 font-mono text-[13px] leading-6 text-code-text outline-none placeholder:text-code-muted/50 ${
            entryType === "single" ? "min-h-[72px]" : "min-h-[180px]"
          }`}
        />

        {isCode && (
          <span className="pointer-events-none absolute bottom-2 right-3 rounded border border-code-line bg-code-raised/80 px-1.5 py-0.5 font-mono text-[10px] text-code-muted">
            Tab inserts 2 spaces
          </span>
        )}
      </div>
    </div>
  );
}

function CommandModal({ editItem, onClose, onSave, loading }) {
  const isEdit = Boolean(editItem);

  const titleInputRef = useRef(null);

  const [title, setTitle] = useState(editItem?.title || "");

  const [entryType, setEntryType] = useState(
    editItem?.entryType ||
      (editItem?.commands?.some((command) => command?.cmd?.includes("\n"))
        ? "multi"
        : "single"),
  );

  const [tag, setTag] = useState(editItem?.tag || "bash");

  const [language, setLanguage] = useState(editItem?.language || "bash");

  const [cmds, setCmds] = useState(() => {
    if (Array.isArray(editItem?.commands) && editItem.commands.length > 0) {
      return editItem.commands.map((command) => ({
        id: command?._id || command?.id || createClientId(),
        _id: command?._id,
        label: command?.label || "",
        cmd: command?.cmd || "",
      }));
    }

    return [
      {
        id: createClientId(),
        label: "",
        cmd: "",
      },
    ];
  });

  // Auto focus.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      titleInputRef.current?.focus();
    }, 50);

    return () => window.clearTimeout(timer);
  }, []);

  // Auto category.
  useEffect(() => {
    if (entryType !== "component") {
      return;
    }

    if (language === "jsx" || language === "tsx") {
      setTag("react");
      return;
    }

    if (language === "javascript" || language === "typescript") {
      setTag(language);
      return;
    }

    if (language === "css" || language === "json") {
      setTag(language);
      return;
    }

    setTag("code");
  }, [entryType, language]);

  const addCmd = () => {
    setCmds((previous) => [
      ...previous,
      {
        id: createClientId(),
        label: "",
        cmd: "",
      },
    ]);
  };

  const updateCmd = (index, value) => {
    setCmds((previous) =>
      previous.map((command, itemIndex) =>
        itemIndex === index ? value : command,
      ),
    );
  };

  const removeCmd = (index) => {
    setCmds((previous) =>
      previous.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const canSave =
    title.trim().length > 0 &&
    title.trim().length <= 200 &&
    cmds.some((command) => command?.cmd?.trim());

  const handleSave = () => {
    if (!canSave || loading) {
      return;
    }

    const cleanedCommands = cmds
      .map((command) => ({
        ...(command?._id ? { _id: command._id } : {}),
        label: command?.label?.trim() || "",
        cmd: command?.cmd || "",
      }))
      .filter((command) => command.cmd.trim());

    onSave({
      id: editItem?._id,
      title: title.trim(),
      tag,
      language,
      entryType,
      commands: cleanedCommands,
    });
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape" && !loading) {
      event.preventDefault();
      onClose();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      handleSave();
    }
  };

  const panelRef = useRef(null);

  useDialogBehavior(panelRef);

  const contentLabel =
    entryType === "component"
      ? "Full component code"
      : entryType === "multi"
        ? "Lines"
        : "Command";

  const contentHint =
    entryType === "component"
      ? "Paste the complete code."
      : entryType === "multi"
        ? "Line breaks are kept as written."
        : "A single line.";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-scrim p-0 animate-fade sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-modal-title"
        className="flex max-h-[94dvh] w-full max-w-3xl animate-pop flex-col rounded-t-modal border border-line bg-surface shadow-pop sm:rounded-modal"
        onKeyDown={handleKeyDown}
      >
        {/* HEADER */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2
              id="command-modal-title"
              className="text-base font-semibold tracking-tight text-ink"
            >
              {isEdit ? "Edit group" : "New group"}
            </h2>

            <p className="mt-0.5 text-sm text-muted">
              Save a single command, a multi-line script, or a full component.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="icon-btn -mr-1.5 -mt-1"
            aria-label="Close"
          >
            <XIcon />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* TITLE */}
          <div>
            <label htmlFor="command-group-title" className="label">
              Title
            </label>

            <input
              ref={titleInputRef}
              id="command-group-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. React user dashboard"
              maxLength={200}
              className="input"
            />

            <p className="hint text-right tabular-nums">{title.length}/200</p>
          </div>

          {/* ENTRY TYPE */}
          <div>
            <p className="label" id="command-type-label">
              Content type
            </p>

            <div
              className="grid grid-cols-1 gap-2 sm:grid-cols-3"
              role="group"
              aria-labelledby="command-type-label"
            >
              {ENTRY_TYPES.map((type) => {
                const active = entryType === type.value;

                return (
                  <button
                    type="button"
                    key={type.value}
                    onClick={() => setEntryType(type.value)}
                    aria-pressed={active}
                    className={`rounded-control border p-3 text-left transition-colors duration-150 ${
                      active
                        ? "border-navy bg-surface ring-1 ring-navy"
                        : "border-line-strong bg-surface hover:border-faint"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-medium text-ink">
                        {type.label}
                      </span>

                      {active && (
                        <Icon
                          name="checkbox-circle"
                          variant="fill"
                          size={16}
                          className="text-navy"
                        />
                      )}
                    </span>

                    <span className="mt-0.5 block text-xs text-muted">
                      {type.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* LANGUAGE / CATEGORY */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField
              id="command-language"
              label="Language"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
            >
              {CODE_LANGUAGES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </SelectField>

            <SelectField
              id="command-category"
              label="Category"
              value={tag}
              onChange={(event) => setTag(event.target.value)}
            >
              {!(tag in TAG_COLORS) && <option value={tag}>{tag}</option>}

              {Object.keys(TAG_COLORS).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </SelectField>
          </div>

          {/* CODE BLOCKS */}
          <div>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <p className="text-[13px] font-medium text-ink">
                {contentLabel}
                <span className="ml-1.5 font-normal text-muted tabular-nums">
                  {cmds.length}
                </span>
              </p>

              <p className="text-xs text-muted">{contentHint}</p>
            </div>

            <div className="space-y-2">
              {cmds.map((command, index) => (
                <CodeInput
                  key={command?._id || command?.id || index}
                  item={command}
                  index={index}
                  entryType={entryType}
                  onChange={(value) => updateCmd(index, value)}
                  onRemove={() => removeCmd(index)}
                  canRemove={cmds.length > 1}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={addCmd}
              className="btn btn-ghost mt-2 w-full border-dashed border-line-strong"
            >
              <PlusIcon size={16} />
              Add another code block
            </button>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-line px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="hidden items-center gap-1.5 text-xs text-muted sm:flex">
            <span className="kbd">Ctrl</span>
            <span className="kbd">Enter</span>
            to save
          </p>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn-secondary"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave || loading}
              className="btn btn-primary"
            >
              {loading ? (
                <SpinnerIcon />
              ) : isEdit ? (
                <CheckIcon size={16} />
              ) : (
                <PlusIcon size={16} />
              )}
              {loading ? "Saving" : isEdit ? "Save changes" : "Add group"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SelectField({ id, label, value, onChange, children }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>

      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={onChange}
          className="input appearance-none pr-9"
        >
          {children}
        </select>

        <Icon
          name="arrow-down-s"
          size={18}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted"
        />
      </div>
    </div>
  );
}

function ConfirmDialog({ title, onCancel, onConfirm }) {
  const panelRef = useRef(null);

  useDialogBehavior(panelRef);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-scrim p-4 animate-fade"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
        className="w-full max-w-sm animate-pop rounded-modal border border-line bg-surface p-5 shadow-pop"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
          }
        }}
      >
        <div className="flex gap-3.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-danger-soft text-danger">
            <Icon name="delete-bin" size={18} />
          </span>

          <div className="min-w-0">
            <h2
              id="confirm-title"
              className="text-[15px] font-semibold tracking-tight text-ink"
            >
              Delete this group?
            </h2>

            <p
              id="confirm-description"
              className="mt-1 break-words text-sm text-muted"
            >
              “{title}” and all of its code blocks will be removed permanently.
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            className="btn btn-secondary"
          >
            Cancel
          </button>

          <button type="button" onClick={onConfirm} className="btn btn-danger">
            Delete group
          </button>
        </div>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
      <div className="h-4 w-48 max-w-full animate-pulse rounded bg-sunken" />
      <div className="mt-2.5 h-5 w-24 animate-pulse rounded bg-sunken" />
      <div className="mt-4 h-11 animate-pulse rounded-lg bg-sunken" />
    </div>
  );
}

function EmptyState({
  hasFilters,
  isLoggedIn,
  onClearFilters,
  onLogin,
  onAdd,
}) {
  const content = hasFilters
    ? {
        icon: "search",
        title: "No matching groups",
        text: "Try a different search term or clear the filters.",
      }
    : isLoggedIn
      ? {
          icon: "terminal-box",
          title: "No command groups yet",
          text: "Save the commands you reach for most, then copy them in one click.",
        }
      : {
          icon: "terminal-box",
          title: "Nothing to show yet",
          text: "Log in to start building your own command library.",
        };

  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-line-strong px-6 py-16 text-center">
      <span className="grid size-10 place-items-center rounded-lg bg-sunken text-muted">
        <Icon name={content.icon} size={20} />
      </span>

      <h2 className="mt-4 text-[15px] font-semibold tracking-tight text-ink">
        {content.title}
      </h2>

      <p className="mt-1 max-w-xs text-sm text-muted">{content.text}</p>

      {hasFilters ? (
        <button
          type="button"
          onClick={onClearFilters}
          className="btn btn-secondary mt-5"
        >
          Clear filters
        </button>
      ) : isLoggedIn ? (
        <button type="button" onClick={onAdd} className="btn btn-primary mt-5">
          <PlusIcon />
          New group
        </button>
      ) : (
        <button type="button" onClick={onLogin} className="btn btn-primary mt-5">
          <Icon name="login-box" size={16} />
          Log in
        </button>
      )}
    </div>
  );
}

export default function CommandLibrary({ user, token }) {
  const navigate = useNavigate();
  const isLoggedIn = Boolean(user && token);
  const initialCacheRef = useRef(null);

  if (initialCacheRef.current === null) {
    initialCacheRef.current = readCachedGroups(user);
  }

  const [groups, setGroups] = useState(initialCacheRef.current);
  const [loading, setLoading] = useState(initialCacheRef.current.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState("all");

  const [pendingDelete, setPendingDelete] = useState(null);

  const searchRef = useRef(null);

  /* Press "/" to jump to search, unless typing or a dialog is open. */
  useEffect(() => {
    const handleShortcut = (event) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const target = event.target;
      const tagName = target?.tagName;

      if (
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        tagName === "SELECT" ||
        target?.isContentEditable ||
        document.querySelector('[aria-modal="true"]')
      ) {
        return;
      }

      event.preventDefault();
      searchRef.current?.focus();
    };

    window.addEventListener("keydown", handleShortcut);

    return () => {
      window.removeEventListener("keydown", handleShortcut);
    };
  }, []);
  const mountedRef = useRef(false);
  const fetchAbortRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      if (fetchAbortRef.current) {
        fetchAbortRef.current.abort();
        fetchAbortRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const cached = readCachedGroups(user);

    setGroups(cached);
    setLoading(cached.length === 0);
    setApiError(null);

    setShowModal(false);
    setEditItem(null);

    if (fetchAbortRef.current) {
      fetchAbortRef.current.abort();
      fetchAbortRef.current = null;
    }

    requestIdRef.current += 1;
  }, [user]);

  const redirectToLogin = useCallback(() => {
    navigate("/login", {
      replace: false,
      state: {
        from: "/",
      },
    });
  }, [navigate]);

  const requireLogin = useCallback(() => {
    if (!isLoggedIn) {
      toast.info("Please login first to add or edit commands.");

      redirectToLogin();

      return false;
    }

    return true;
  }, [isLoggedIn, redirectToLogin]);

  const fetchGroups = useCallback(
    async ({
      silent = false,
      searchValue = search,
      tagValue = filterTag,
    } = {}) => {
      if (!API_BASE_URL) {
        if (mountedRef.current) {
          setApiError("API URL is not configured. Please set VITE_API_BASE.");
          setLoading(false);
          setRefreshing(false);
        }

        return;
      }

      if (fetchAbortRef.current) {
        fetchAbortRef.current.abort();
      }

      const controller = new AbortController();
      fetchAbortRef.current = controller;
      const requestId = ++requestIdRef.current;
      const trimmedSearch = searchValue.trim();
      const hasExistingData = groups.length > 0;

      if (mountedRef.current) {
        setApiError(null);

        if (silent || hasExistingData) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
      }

      try {
        const params = new URLSearchParams();

        if (tagValue !== "all") {
          params.set("tag", tagValue);
        }

        if (trimmedSearch) {
          params.set("search", trimmedSearch);
        }

        const query = params.toString();

        const url = query ? `${API_BASE}?${query}` : API_BASE;

        const response = await api.get(url, {
          signal: controller.signal,
        });

        if (!mountedRef.current || requestId !== requestIdRef.current) {
          return;
        }

        if (response?.success) {
          const nextGroups = normalizeGroups(response.data);

          setGroups(nextGroups);

          // Only cache the unfiltered library.
          if (!trimmedSearch && tagValue === "all") {
            writeCachedGroups(user, nextGroups);
          }
        } else {
          if (!hasExistingData) {
            setGroups([]);
          }

          setApiError(response?.message || "Unable to load commands.");
        }
      } catch (error) {
        if (
          error?.name === "AbortError" ||
          !mountedRef.current ||
          requestId !== requestIdRef.current
        ) {
          return;
        }

        if (error?.status === 401 || error?.status === 403) {
          setApiError("Your login session has expired. Please login again.");
        } else {
          // Preserve cached/current UI data.
          setApiError(getErrorMessage(error) || "Cannot connect to backend.");
        }
      } finally {
        if (mountedRef.current && requestId === requestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [filterTag, groups.length, search, user],
  );

  // ───────────────────────────────────────────────────────────────────────────
  // SEARCH / FILTER FETCH
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchGroups({
        silent: true,
        searchValue: search,
        tagValue: filterTag,
      });
    }, SEARCH_DEBOUNCE);

    return () => {
      window.clearTimeout(timer);
    };
  }, [search, filterTag, fetchGroups]);

  // ───────────────────────────────────────────────────────────────────────────
  // AUTH MODAL SAFETY
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isLoggedIn && showModal) {
      setShowModal(false);
      setEditItem(null);
    }
  }, [isLoggedIn, showModal]);

  // ───────────────────────────────────────────────────────────────────────────
  // SAVE
  // ───────────────────────────────────────────────────────────────────────────

  const handleSave = async ({
    id,
    title,
    tag,
    language,
    entryType,
    commands,
  }) => {
    if (!requireLogin()) {
      return;
    }

    if (!title?.trim()) {
      toast.error("Group title is required.");
      return;
    }

    if (title.trim().length > 200) {
      toast.error("Group title must be 200 characters or less.");
      return;
    }

    if (!Array.isArray(commands) || commands.length === 0) {
      toast.error("Add at least one code block.");
      return;
    }

    if (saving) {
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: title.trim(),
        tag,
        language,
        entryType,
        commands,
      };

      const response = id
        ? await api.put(`${API_BASE}/${encodeURIComponent(id)}`, payload)
        : await api.post(API_BASE, payload);

      if (!response?.success) {
        const error = new Error(response?.message || "Unable to save group.");

        error.status = response?.status;

        throw error;
      }

      toast.success(
        id ? "Group updated successfully." : "Group created successfully.",
      );

      if (mountedRef.current) {
        setShowModal(false);
        setEditItem(null);
      }

      // Refresh current server view.
      await fetchGroups({
        silent: true,
      });
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        toast.error("Your login session has expired.");

        if (mountedRef.current) {
          setShowModal(false);
          setEditItem(null);
        }

        redirectToLogin();
      } else if (mountedRef.current) {
        toast.error(getErrorMessage(error) || "Failed to save group.");
      }
    } finally {
      if (mountedRef.current) {
        setSaving(false);
      }
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // DELETE
  // ───────────────────────────────────────────────────────────────────────────

  const handleDelete = (id) => {
    if (!requireLogin() || !id || deletingId) {
      return;
    }

    const group = groups.find((entry) => entry?._id === id || entry?.id === id);

    setPendingDelete({
      id,
      title: group?.title || "this group",
    });
  };

  const performDelete = async (id) => {
    if (!requireLogin() || !id) {
      return;
    }

    if (deletingId) {
      return;
    }

    setDeletingId(id);

    try {
      const response = await api.delete(
        `${API_BASE}/${encodeURIComponent(id)}`,
      );

      if (!response?.success) {
        const error = new Error(response?.message || "Unable to delete group.");

        error.status = response?.status;

        throw error;
      }

      toast.success("Group deleted.");

      if (mountedRef.current) {
        setGroups((previous) => {
          const nextGroups = previous.filter(
            (group) => group?._id !== id && group?.id !== id,
          );

          // Only update main cache.
          if (search.trim() === "" && filterTag === "all") {
            writeCachedGroups(user, nextGroups);
          }

          return nextGroups;
        });
      }
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        toast.error("Your login session has expired.");

        redirectToLogin();
      } else if (mountedRef.current) {
        toast.error(getErrorMessage(error) || "Failed to delete.");
      }
    } finally {
      if (mountedRef.current) {
        setDeletingId(null);
      }
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // MODAL
  // ───────────────────────────────────────────────────────────────────────────

  const openAdd = () => {
    if (!requireLogin()) {
      return;
    }

    setEditItem(null);
    setShowModal(true);
  };

  const openEdit = (item) => {
    if (!requireLogin()) {
      return;
    }

    if (!item?._id && !item?.id) {
      toast.error("Invalid command group.");
      return;
    }

    setEditItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditItem(null);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // STATS
  // ───────────────────────────────────────────────────────────────────────────

  const totalCmds = useMemo(
    () =>
      groups.reduce(
        (sum, group) =>
          sum + (Array.isArray(group?.commands) ? group.commands.length : 0),
        0,
      ),
    [groups],
  );

  const allTags = useMemo(() => ["all", ...Object.keys(TAG_COLORS)], []);

  const hasFilters = Boolean(search.trim()) || filterTag !== "all";

  // ───────────────────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Guest header. Signed-in users get the sidebar from Layout instead. */}
      {!isLoggedIn && (
        <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
            <Brand />

            <div className="flex items-center gap-2">
              <ThemeToggle variant="cycle" />

              <button
                type="button"
                onClick={() => navigate("/signup")}
                className="btn btn-ghost"
              >
                Sign up
              </button>

              <button
                type="button"
                onClick={redirectToLogin}
                className="btn btn-primary"
              >
                <Icon name="login-box" size={16} />
                Log in
              </button>
            </div>
          </div>
        </header>
      )}

      <main
        id="main"
        className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8"
      >
        {/* TITLE */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">
              Command library
            </h1>

            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              <span className="tabular-nums">
                {loading && groups.length === 0
                  ? "Loading"
                  : `${groups.length} group${
                      groups.length !== 1 ? "s" : ""
                    }, ${totalCmds} ${
                      totalCmds !== 1 ? "code blocks" : "code block"
                    }`}
              </span>

              {refreshing && (
                <span
                  className="inline-flex items-center gap-1.5 text-xs"
                  role="status"
                  aria-live="polite"
                >
                  <SpinnerIcon size={13} />
                  Syncing
                </span>
              )}

              {!isLoggedIn && (
                <span className="inline-flex items-center gap-1.5 text-xs">
                  <LockIcon size={13} />
                  Log in to add, edit or delete groups.
                </span>
              )}
            </p>
          </div>

          {isLoggedIn && (
            <button
              type="button"
              onClick={openAdd}
              className="btn btn-primary self-start"
            >
              <PlusIcon />
              New group
            </button>
          )}
        </div>

        {/* ERROR */}
        {apiError && (
          <div
            className="mb-5 flex items-start gap-3 rounded-card border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger"
            role="alert"
          >
            <Icon name="error-warning" size={18} className="mt-0.5" />

            <div className="min-w-0 flex-1">
              <p className="font-medium">Couldn’t load your commands</p>

              <p className="mt-0.5 break-words text-[13px] text-danger/80">
                {apiError}
              </p>

              <button
                type="button"
                onClick={() =>
                  fetchGroups({
                    silent: groups.length > 0,
                  })
                }
                disabled={refreshing}
                className="btn btn-secondary mt-2.5 h-8 border-danger/25 text-danger hover:bg-surface"
              >
                <Icon name="refresh" size={14} spin={refreshing} />
                Try again
              </button>
            </div>
          </div>
        )}

        {/* SEARCH + FILTER */}
        <div className="mb-5 space-y-3">
          <div className="relative max-w-md">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint">
              <SearchIcon />
            </span>

            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, label or code"
              aria-label="Search commands"
              className="input pl-9 pr-10"
            />

            {search ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  searchRef.current?.focus();
                }}
                className="icon-btn absolute right-1 top-1/2 size-7 -translate-y-1/2"
                aria-label="Clear search"
              >
                <XIcon size={14} />
              </button>
            ) : (
              <span
                className="kbd pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 sm:inline-flex"
                aria-hidden="true"
              >
                /
              </span>
            )}
          </div>

          <div
            className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0"
            role="group"
            aria-label="Filter by category"
          >
            {allTags.map((tag) => {
              const active = filterTag === tag;

              return (
                <button
                  type="button"
                  key={tag}
                  onClick={() => setFilterTag(tag)}
                  aria-pressed={active}
                  className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors duration-150 ${
                    active
                      ? "border-navy bg-navy text-on-navy"
                      : "border-line bg-surface text-muted hover:border-line-strong hover:text-ink"
                  }`}
                >
                  {tag !== "all" && (
                    <span
                      className="size-1.5 rounded-full"
                      style={{ background: active ? "currentColor" : tagColor(tag) }}
                      aria-hidden="true"
                    />
                  )}

                  {tag === "all" ? "All" : tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTENT */}
        {loading && groups.length === 0 ? (
          <div className="space-y-3" role="status" aria-live="polite">
            <span className="sr-only">Loading commands</span>

            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : groups.length > 0 ? (
          <div className="space-y-3">
            {groups.map((item, index) => {
              const itemKey =
                item?._id || item?.id || item?.clientId || `group-${index}`;

              const itemId = item?._id || item?.id || null;

              return (
                <CommandCard
                  key={itemKey}
                  item={item}
                  onDelete={handleDelete}
                  onEdit={openEdit}
                  deleting={deletingId === itemId}
                />
              );
            })}
          </div>
        ) : (
          <EmptyState
            hasFilters={hasFilters}
            isLoggedIn={isLoggedIn}
            onClearFilters={() => {
              setSearch("");
              setFilterTag("all");
            }}
            onLogin={redirectToLogin}
            onAdd={openAdd}
          />
        )}
      </main>

      {/* MODAL */}
      {showModal && (
        <CommandModal
          editItem={editItem}
          onClose={closeModal}
          onSave={handleSave}
          loading={saving}
        />
      )}

      {/* DELETE CONFIRMATION */}
      {pendingDelete && (
        <ConfirmDialog
          title={pendingDelete.title}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            const { id } = pendingDelete;

            setPendingDelete(null);
            performDelete(id);
          }}
        />
      )}

      {/* DELETE STATUS */}
      {deletingId && (
        <div
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-control border border-line bg-surface px-3 py-2 text-[13px] text-muted shadow-pop animate-rise"
          role="status"
          aria-live="polite"
        >
          <SpinnerIcon size={14} />
          Deleting
        </div>
      )}
    </div>
  );
}
