import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

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
  git: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  npm: "bg-red-500/15 text-red-400 border-red-500/30",
  javascript: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  typescript: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  react: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  jsx: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  tsx: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  css: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  json: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
};

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

const CheckIcon = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CopyIcon = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const PlusIcon = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const TrashIcon = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const EditIcon = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const XIcon = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SpinnerIcon = ({ size = 16 }) => (
  <svg
    className="animate-spin"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const SearchIcon = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const LockIcon = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const RefreshIcon = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
    <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
  </svg>
);

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
      toast.success("Code copied!");

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
      className={`
        shrink-0 inline-flex items-center gap-1.5
        ${large ? "px-3 py-1.5 text-xs" : "px-2 py-1 text-[11px]"}
        rounded-md border transition-all
        ${
          copied
            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
            : "bg-[#21262d] text-[#8b949e] border-[#30363d] hover:bg-[#30363d] hover:text-[#e6edf3]"
        }
      `}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function CommandCard({ item, onDelete, onEdit, deleting }) {
  const tagClass = TAG_COLORS[item?.tag] || TAG_COLORS.other;
  const commands = Array.isArray(item?.commands) ? item.commands : [];
  const groupId = item?._id || item?.id || item?.clientId || "unknown";

  return (
    <article
      className="
        group bg-[#0d1117]
        border border-[#21262d]
        rounded-xl overflow-hidden
        hover:border-[#30363d]
        transition-all
      "
    >
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span
            className={`
              text-[10px] font-bold px-2 py-0.5
              rounded-md uppercase tracking-wider
              shrink-0 border ${tagClass}
            `}
          >
            {item?.tag || "other"}
          </span>

          {item?.entryType && (
            <span
              className="
                text-[10px] text-[#8b949e]
                bg-[#161b22] border border-[#21262d]
                px-2 py-0.5 rounded-md
              "
            >
              {item.entryType === "component"
                ? "Full Component"
                : item.entryType === "multi"
                  ? "Multi Line"
                  : "Single Line"}
            </span>
          )}

          <h3 className="text-sm font-semibold text-[#e6edf3] truncate">
            {item?.title || "Untitled"}
          </h3>

          <span
            className="
              shrink-0 text-[10px] text-[#484f58]
              bg-[#161b22] border border-[#21262d]
              px-1.5 py-0.5 rounded-full
            "
          >
            {commands.length} cmd
            {commands.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div
          className="
            flex items-center gap-1 ml-2 shrink-0
            opacity-100 sm:opacity-0
            sm:group-hover:opacity-100
            focus-within:opacity-100
            transition-all
          "
        >
          <button
            type="button"
            onClick={() => onEdit(item)}
            disabled={Boolean(deleting)}
            className="
              p-1.5 rounded-md
              text-[#484f58]
              hover:text-[#58a6ff]
              hover:bg-[#161b22]
              disabled:opacity-40
              transition-colors
            "
            title="Edit"
            aria-label={`Edit ${item?.title || "command group"}`}
          >
            <EditIcon />
          </button>

          <button
            type="button"
            onClick={() => onDelete(groupId)}
            disabled={Boolean(deleting)}
            className="
              p-1.5 rounded-md
              text-[#484f58]
              hover:text-red-400
              hover:bg-[#161b22]
              disabled:opacity-40
              transition-colors
            "
            title="Delete"
            aria-label={`Delete ${item?.title || "command group"}`}
          >
            {deleting ? <SpinnerIcon size={14} /> : <TrashIcon />}
          </button>
        </div>
      </div>

      <div className="px-3 pb-3 space-y-2">
        {commands.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-[#484f58]">
            No code blocks in this group.
          </div>
        ) : (
          commands.map((command, index) => {
            const value = command?.cmd || "";

            const isMultiLine =
              value.includes("\n") ||
              item?.entryType === "multi" ||
              item?.entryType === "component";

            const commandKey =
              command?._id || command?.id || `${groupId}-${index}`;

            return (
              <div
                key={commandKey}
                className="
                  bg-[#161b22]
                  border border-[#21262d]
                  rounded-lg overflow-hidden
                "
              >
                <div
                  className="
                    flex items-center justify-between gap-2
                    px-3 py-2
                    border-b border-[#21262d]
                  "
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="
                        shrink-0 w-5 h-5 rounded-full
                        bg-[#21262d] text-[#484f58]
                        text-[9px] font-bold
                        flex items-center justify-center
                      "
                    >
                      {index + 1}
                    </span>

                    {command?.label ? (
                      <span className="text-[11px] text-[#8b949e] truncate">
                        {command.label}
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#484f58]">
                        {isMultiLine ? "Code" : "Command"}
                      </span>
                    )}
                  </div>

                  <CopyButton text={value} />
                </div>

                <div className="relative">
                  {isMultiLine ? (
                    <pre
                      className="
                        overflow-x-auto overflow-y-auto
                        max-h-[500px]
                        p-4
                        text-[12px]
                        leading-6
                        font-mono
                        text-[#79c0ff]
                        whitespace-pre
                      "
                    >
                      <code>{value}</code>
                    </pre>
                  ) : (
                    <div
                      className="
                        px-3 py-2.5
                        flex items-center gap-2
                      "
                    >
                      <span
                        className="
                          text-[#3fb950]
                          font-mono text-sm
                          select-none
                        "
                      >
                        $
                      </span>

                      <code
                        className="
                          text-[12px]
                          text-[#79c0ff]
                          font-mono
                          overflow-x-auto
                          whitespace-nowrap
                        "
                      >
                        {value}
                      </code>
                    </div>
                  )}
                </div>
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
    <div
      className="
        bg-[#161b22]
        border border-[#21262d]
        rounded-xl overflow-hidden
      "
    >
      <div
        className="
          flex items-center gap-2
          px-3 py-2
          border-b border-[#21262d]
        "
      >
        <span
          className="
            shrink-0 w-5 h-5 rounded-full
            bg-[#21262d] text-[#484f58]
            text-[10px] font-bold
            flex items-center justify-center
          "
        >
          {index + 1}
        </span>

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
          placeholder={
            entryType === "component"
              ? "Component / file name (optional)"
              : "Label (optional)"
          }
          className="
            flex-1 min-w-0
            bg-transparent
            text-[#8b949e]
            text-xs
            focus:outline-none
            placeholder-[#3d444d]
          "
        />

        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="
              shrink-0 p-1
              text-[#484f58]
              hover:text-red-400
              transition-colors
            "
            title="Remove"
            aria-label={`Remove code block ${index + 1}`}
          >
            <XIcon />
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
          placeholder={
            entryType === "single"
              ? "npm install express"
              : entryType === "multi"
                ? "npm install express\nnpm install mongoose\nnpm run dev"
                : `import React from "react";

export default function MyComponent() {
  return (
    <div>
      Hello World
    </div>
  );
}`
          }
          rows={isCode ? 12 : 3}
          maxLength={50000}
          spellCheck={false}
          className={`
            block w-full
            resize-y
            bg-[#0d1117]
            text-[#79c0ff]
            font-mono
            text-[13px]
            leading-6
            px-4 py-3
            focus:outline-none
            placeholder-[#3d444d]
            ${entryType === "single" ? "min-h-[70px]" : "min-h-[180px]"}
          `}
        />

        {isCode && (
          <div className="absolute bottom-2 right-2 pointer-events-none">
            <span
              className="
                text-[9px]
                text-[#484f58]
                bg-[#161b22]/90
                px-2 py-1
                rounded
                border border-[#21262d]
              "
            >
              Tab = 2 spaces
            </span>
          </div>
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

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        p-3 sm:p-5
        bg-black/80
        backdrop-blur-sm
      "
      role="dialog"
      aria-modal="true"
      aria-labelledby="command-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div
        className="
          w-full max-w-3xl
          bg-[#0d1117]
          border border-[#30363d]
          rounded-2xl
          shadow-2xl
          flex flex-col
          max-h-[94vh]
        "
        onKeyDown={handleKeyDown}
      >
        {/* HEADER */}
        <div
          className="
            flex items-center justify-between
            px-5 py-4
            border-b border-[#21262d]
            shrink-0
          "
        >
          <div className="min-w-0">
            <h2
              id="command-modal-title"
              className="
                text-sm font-semibold
                text-[#e6edf3]
              "
            >
              {isEdit
                ? "Edit Code / Command Group"
                : "Add New Code / Command Group"}
            </h2>

            <p
              className="
                text-[11px]
                text-[#484f58]
                mt-1
              "
            >
              Single line, multiple lines, ya complete component code save
              karein.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="
              p-1.5
              text-[#484f58]
              hover:text-[#e6edf3]
              disabled:opacity-40
            "
            aria-label="Close modal"
          >
            <XIcon />
          </button>
        </div>

        {/* BODY */}
        <div
          className="
            p-4 sm:p-5
            space-y-5
            overflow-y-auto
            flex-1
          "
        >
          {/* TITLE */}
          <div>
            <label
              htmlFor="command-group-title"
              className="
                block
                text-[10px]
                font-semibold
                text-[#8b949e]
                mb-1.5
                uppercase
                tracking-widest
              "
            >
              Group Title
            </label>

            <input
              ref={titleInputRef}
              id="command-group-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. React User Dashboard"
              maxLength={200}
              className="
                w-full
                bg-[#161b22]
                border border-[#30363d]
                text-[#e6edf3]
                text-sm
                rounded-lg
                px-3 py-2.5
                placeholder-[#3d444d]
                focus:outline-none
                focus:border-[#58a6ff]
              "
            />

            <div className="flex justify-end mt-1">
              <span className="text-[9px] text-[#484f58]">
                {title.length}/200
              </span>
            </div>
          </div>

          {/* ENTRY TYPE */}
          <div>
            <label
              className="
                block
                text-[10px]
                font-semibold
                text-[#8b949e]
                mb-2
                uppercase
                tracking-widest
              "
            >
              Content Type
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {ENTRY_TYPES.map((type) => {
                const active = entryType === type.value;

                return (
                  <button
                    type="button"
                    key={type.value}
                    onClick={() => setEntryType(type.value)}
                    aria-pressed={active}
                    className={`
                      text-left p-3
                      rounded-lg border
                      transition-all
                      ${
                        active
                          ? "bg-[#1f6feb]/10 border-[#58a6ff] text-[#e6edf3]"
                          : "bg-[#161b22] border-[#21262d] text-[#8b949e] hover:border-[#30363d]"
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">
                        {type.label}
                      </span>
                    </div>

                    <p className="text-[10px] text-[#484f58] mt-1">
                      {type.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* LANGUAGE / CATEGORY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="command-language"
                className="
                  block
                  text-[10px]
                  font-semibold
                  text-[#8b949e]
                  mb-1.5
                  uppercase
                  tracking-widest
                "
              >
                Language
              </label>

              <select
                id="command-language"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="
                  w-full
                  bg-[#161b22]
                  border border-[#30363d]
                  text-[#e6edf3]
                  text-sm
                  rounded-lg
                  px-3 py-2.5
                  focus:outline-none
                  focus:border-[#58a6ff]
                "
              >
                {CODE_LANGUAGES.map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                    className="bg-[#0d1117]"
                  >
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="command-category"
                className="
                  block
                  text-[10px]
                  font-semibold
                  text-[#8b949e]
                  mb-1.5
                  uppercase
                  tracking-widest
                "
              >
                Category
              </label>

              <select
                id="command-category"
                value={tag}
                onChange={(event) => setTag(event.target.value)}
                className="
                  w-full
                  bg-[#161b22]
                  border border-[#30363d]
                  text-[#e6edf3]
                  text-sm
                  rounded-lg
                  px-3 py-2.5
                  focus:outline-none
                  focus:border-[#58a6ff]
                "
              >
                {Object.keys(TAG_COLORS).map((item) => (
                  <option key={item} value={item} className="bg-[#0d1117]">
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* CODE BLOCKS */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                className="
                  block
                  text-[10px]
                  font-semibold
                  text-[#8b949e]
                  uppercase
                  tracking-widest
                "
              >
                {entryType === "component"
                  ? "Full Component Code"
                  : entryType === "multi"
                    ? "Multiple Lines"
                    : "Command"}{" "}
                ({cmds.length})
              </label>

              <span className="text-[10px] text-[#484f58]">
                {entryType === "component"
                  ? "Paste complete code here"
                  : entryType === "multi"
                    ? "Each line will be preserved"
                    : "One line"}
              </span>
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
              className="
                mt-2.5gin to
                w-full
                flex items-center
                justify-center gap-1.5
                py-2.5
                border border-dashed
                border-[#30363d]
                hover:border-[#58a6ff]
                hover:text-[#58a6ff]
                text-[#484f58]
                text-xs font-medium
                rounded-lg
                transition-colors
              "
            >
              <PlusIcon size={13} />
              Add another code block
            </button>
          </div>
        </div>

        {/* FOOTER */}
        <div
          className="
            flex flex-col
            sm:flex-row
            sm:items-center
            sm:justify-between
            gap-3
            px-5 py-4
            border-t border-[#21262d]
            shrink-0
          "
        >
          <p className="text-[10px] text-[#484f58]">
            Tip: Ctrl + Enter / Cmd + Enter to save
          </p>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="
                px-4 py-2
                text-sm
                text-[#8b949e]
                hover:text-[#e6edf3]
                disabled:opacity-40
              "
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave || loading}
              className="
                flex items-center gap-2
                px-4 py-2
                bg-[#238636]
                hover:bg-[#2ea043]
                disabled:opacity-40
                disabled:cursor-not-allowed
                text-white
                text-sm font-medium
                rounded-lg
                transition-colors
              "
            >
              {loading ? (
                <SpinnerIcon />
              ) : isEdit ? (
                <CheckIcon />
              ) : (
                <PlusIcon size={14} />
              )}

              {loading ? "Saving..." : isEdit ? "Save Changes" : "Add Group"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN BUTTON
// ─────────────────────────────────────────────────────────────────────────────

function LoginButton({ onLogin }) {
  return (
    <button
      type="button"
      onClick={onLogin}
      className="
        flex items-center gap-1.5
        px-3 py-1.5
        bg-[#21262d]
        hover:bg-[#30363d]
        border border-[#30363d]
        text-[#e6edf3]
        text-sm font-medium
        rounded-lg
        transition-colors
      "
    >
      <LockIcon size={13} />
      Login to Add
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({
  hasFilters,
  isLoggedIn,
  onClearFilters,
  onLogin,
  onAdd,
}) {
  return (
    <div
      className="
        flex flex-col
        items-center
        justify-center
        py-20
        text-center
      "
    >
      <div
        className="
          w-12 h-12
          bg-[#0d1117]
          border border-[#21262d]
          rounded-xl
          flex items-center
          justify-center
          mb-3
          text-[#484f58]
        "
      >
        <SearchIcon size={20} />
      </div>

      <p className="text-[#484f58] text-sm">
        {hasFilters
          ? "No groups match your filter."
          : "No commands yet. Add your first group!"}
      </p>

      {hasFilters ? (
        <button
          type="button"
          onClick={onClearFilters}
          className="
            mt-2
            text-[#58a6ff]
            text-xs
            hover:underline
          "
        >
          Clear filters
        </button>
      ) : isLoggedIn ? (
        <button
          type="button"
          onClick={onAdd}
          className="
            mt-3
            inline-flex items-center
            gap-1.5
            text-[#58a6ff]
            text-xs
            hover:underline
          "
        >
          <PlusIcon size={12} />
          Add your first group
        </button>
      ) : (
        <button
          type="button"
          onClick={onLogin}
          className="
            mt-3
            text-[#58a6ff]
            text-xs
            hover:underline
          "
        >
          Login to add your first group
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

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

  const handleDelete = async (id) => {
    if (!requireLogin() || !id) {
      return;
    }

    if (deletingId) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this command/code group permanently?",
    );

    if (!confirmed) {
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
    <div
      className="
        min-h-screen
        bg-[#010409]
        text-[#e6edf3]
        font-sans
      "
    >
      {/* ─────────────────────────────────────────────────────────────────────
          NAVBAR
      ───────────────────────────────────────────────────────────────────── */}

      <header
        className="
          sticky top-0 z-40
          border-b border-[#21262d]
          bg-[#010409]/90
          backdrop-blur-md
        "
      >
        <div
          className="
            max-w-5xl mx-auto
            px-4
            h-14
            flex items-center
            justify-between
            gap-4
          "
        >
        
          <div className="flex items-center gap-2">
            {refreshing && (
              <div
                className="
                  hidden sm:flex
                  items-center gap-1.5
                  text-[10px]
                  text-[#484f58]
                "
                role="status"
                aria-live="polite"
              >
                <SpinnerIcon size={12} />
                Syncing
              </div>
            )}

            {isLoggedIn ? (
              <button
                type="button"
                onClick={openAdd}
                className="
                  flex items-center
                  gap-1.5
                  px-3.5 py-1.5
                  bg-[#238636]
                  hover:bg-[#2ea043]
                  text-white
                  text-sm font-medium
                  rounded-lg
                  transition-colors
                "
              >
                <PlusIcon size={15} />
                New Group
              </button>
            ) : (
              <LoginButton onLogin={redirectToLogin} />
            )}
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────────
          MAIN
      ───────────────────────────────────────────────────────────────────── */}

      <main
        className="
          max-w-5xl
          mx-auto
          px-4
          py-8
        "
      >
        {/* TITLE */}
        <div className="mb-7">
          <div
            className="
              flex flex-col
              sm:flex-row
              sm:items-end
              sm:justify-between
              gap-3
            "
          >
            <div>
              <h1
                className="
                  text-2xl
                  font-bold
                  tracking-tight
                "
              >
                Command Library
              </h1>

              <p
                className="
                  text-sm
                  text-[#484f58]
                  mt-1
                "
              >
                {loading && groups.length === 0
                  ? "Loading..."
                  : `${groups.length} group${
                      groups.length !== 1 ? "s" : ""
                    } · ${totalCmds} ${
                      totalCmds !== 1 ? "code blocks" : "code block"
                    }`}
              </p>
            </div>

            {!isLoggedIn && (
              <div
                className="
                  flex items-center
                  gap-2
                  text-[11px]
                  text-[#8b949e]
                "
              >
                <LockIcon size={13} />
                Login required to add, edit or delete.
              </div>
            )}
          </div>
        </div>

        {/* ERROR */}
        {apiError && (
          <div
            className="
              mb-5
              flex items-start
              gap-3
              bg-red-500/10
              border border-red-500/25
              text-red-400
              rounded-xl
              px-4 py-3
              text-sm
            "
            role="alert"
          >
            <svg
              className="shrink-0 mt-0.5"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>

            <div className="flex-1 min-w-0">
              <p className="font-medium">Backend Connection Error</p>

              <p className="text-red-400/70 text-xs mt-0.5">{apiError}</p>

              <button
                type="button"
                onClick={() =>
                  fetchGroups({
                    silent: groups.length > 0,
                  })
                }
                disabled={refreshing}
                className="
                  mt-1.5
                  inline-flex
                  items-center
                  gap-1.5
                  text-xs
                  underline
                  hover:text-red-300
                  disabled:opacity-50
                "
              >
                {refreshing && <SpinnerIcon size={11} />}
                Retry
              </button>
            </div>
          </div>
        )}

        {/* SEARCH + FILTER */}
        <div
          className="
            flex flex-col
            lg:flex-row
            gap-3
            mb-6
          "
        >
          <div className="relative flex-1">
            <div
              className="
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                text-[#484f58]
              "
            >
              <SearchIcon />
            </div>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, label or code..."
              aria-label="Search commands"
              className="
                w-full
                bg-[#0d1117]
                border border-[#21262d]
                text-[#e6edf3]
                text-sm
                rounded-lg
                pl-9 pr-3 py-2
                placeholder-[#3d444d]
                focus:outline-none
                focus:border-[#58a6ff]
                transition-colors
              "
            />
          </div>

          <div
            className="
              flex gap-1.5
              flex-wrap
            "
          >
            {allTags.map((tag) => (
              <button
                type="button"
                key={tag}
                onClick={() => setFilterTag(tag)}
                aria-pressed={filterTag === tag}
                className={`
                  px-3 py-1.5
                  rounded-lg
                  text-[11px]
                  font-semibold
                  transition-all
                  capitalize
                  ${
                    filterTag === tag
                      ? "bg-[#21262d] text-[#e6edf3] border border-[#58a6ff]"
                      : "bg-[#0d1117] text-[#484f58] border border-[#21262d] hover:border-[#30363d] hover:text-[#8b949e]"
                  }
                `}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        {loading && groups.length === 0 ? (
          <div
            className="
              flex flex-col
              items-center
              justify-center
              py-20
              gap-3
            "
            role="status"
            aria-live="polite"
          >
            <SpinnerIcon size={22} />

            <p
              className="
                text-[#484f58]
                text-sm
              "
            >
              Loading commands...
            </p>
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

      {/* DELETE STATUS */}
      {deletingId && (
        <div
          className="
            fixed
            bottom-4
            right-4
            z-50
            flex items-center
            gap-2
            px-3 py-2
            bg-[#161b22]
            border border-[#30363d]
            rounded-lg
            text-xs
            text-[#8b949e]
            shadow-xl
          "
          role="status"
          aria-live="polite"
        >
          <SpinnerIcon size={14} />
          Deleting...
        </div>
      )}
    </div>
  );
}
