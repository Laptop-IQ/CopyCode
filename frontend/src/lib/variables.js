/**
 * Placeholders: any {{name}} inside a command is a variable the user fills in
 * before copying, e.g.  git checkout {{branch}}
 */
const VARIABLE_PATTERN = /\{\{\s*([A-Za-z_][\w-]*)\s*\}\}/g;

export function extractVariables(text) {
  const names = [];

  for (const match of String(text ?? "").matchAll(VARIABLE_PATTERN)) {
    if (!names.includes(match[1])) {
      names.push(match[1]);
    }
  }

  return names;
}

export const hasVariables = (text) => extractVariables(text).length > 0;

export function fillVariables(text, values) {
  return String(text ?? "").replace(VARIABLE_PATTERN, (whole, name) =>
    values[name] ? values[name] : whole,
  );
}

/** Splits text into plain and variable segments for display. */
export function splitVariables(text) {
  const source = String(text ?? "");
  const segments = [];

  let lastIndex = 0;

  for (const match of source.matchAll(VARIABLE_PATTERN)) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: source.slice(lastIndex, match.index) });
    }

    segments.push({ type: "variable", value: match[0], name: match[1] });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < source.length) {
    segments.push({ type: "text", value: source.slice(lastIndex) });
  }

  return segments;
}

/* Remembers the last value used for each variable name, per browser tab. */
const MEMORY_KEY = "cmdkit-variable-values";

export function readRememberedValues() {
  try {
    return JSON.parse(sessionStorage.getItem(MEMORY_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

export function rememberValues(values) {
  try {
    sessionStorage.setItem(
      MEMORY_KEY,
      JSON.stringify({ ...readRememberedValues(), ...values }),
    );
  } catch {
    /* Storage can be blocked; remembering is a convenience only. */
  }
}
