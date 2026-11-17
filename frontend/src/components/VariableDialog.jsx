import { useMemo, useRef, useState } from "react";

import Icon from "./ui/Icon";
import useDialogBehavior from "./ui/useDialogBehavior";
import {
  extractVariables,
  fillVariables,
  readRememberedValues,
  rememberValues,
} from "../lib/variables";

/**
 * Asks for the values of {{placeholders}} before copying a command.
 * onSubmit receives the finished text; onCancel is called on dismiss.
 */
export default function VariableDialog({ text, onSubmit, onCancel }) {
  const panelRef = useRef(null);

  useDialogBehavior(panelRef);

  const names = useMemo(() => extractVariables(text), [text]);

  const [values, setValues] = useState(() => {
    const remembered = readRememberedValues();

    return Object.fromEntries(names.map((name) => [name, remembered[name] || ""]));
  });

  const preview = fillVariables(text, values);
  const canSubmit = names.every((name) => values[name]?.trim());

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    rememberValues(values);
    onSubmit(preview);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-scrim p-0 animate-fade sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <form
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="variables-title"
        onSubmit={handleSubmit}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
          }
        }}
        className="flex max-h-[94dvh] w-full max-w-md animate-pop flex-col rounded-t-modal border border-line bg-elevated shadow-pop sm:rounded-modal"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2
              id="variables-title"
              className="text-base font-semibold tracking-tight text-ink"
            >
              Fill in the placeholders
            </h2>

            <p className="mt-0.5 text-sm text-muted">
              Values are inserted before the command is copied.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="icon-btn -mr-1.5 -mt-1"
            aria-label="Close"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {names.map((name, index) => (
            <div key={name}>
              <label htmlFor={`variable-${name}`} className="label font-mono">
                {name}
              </label>

              <input
                id={`variable-${name}`}
                type="text"
                value={values[name]}
                onChange={(event) =>
                  setValues((previous) => ({ ...previous, [name]: event.target.value }))
                }
                autoFocus={index === 0}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                className="input font-mono"
              />
            </div>
          ))}

          <div>
            <p className="label">Preview</p>

            <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-code-line bg-code p-3 font-mono text-[12.5px] leading-6 text-code-text">
              {preview}
            </pre>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>

          <button type="submit" disabled={!canSubmit} className="btn btn-primary">
            <Icon name="file-copy" size={16} />
            Copy command
          </button>
        </div>
      </form>
    </div>
  );
}
