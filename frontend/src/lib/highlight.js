/**
 * Small dependency-free syntax highlighter.
 * Returns [{ type, value }] where type is a token name or "plain".
 * Good enough to make snippets scannable; not a full parser.
 */

const SHELL_COMMANDS =
  "git|npm|npx|yarn|pnpm|bun|node|deno|docker|docker-compose|kubectl|cd|ls|cat|echo|curl|wget|sudo|python|python3|pip|pip3|mkdir|rm|cp|mv|touch|chmod|chown|grep|sed|awk|ssh|scp|apt|apt-get|brew|make|tar|unzip|export|source|code|vim|nano|ps|kill|systemctl|pm2|nvm|tsc|vite|next";

const JS_KEYWORDS =
  "const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|class|extends|import|export|from|default|async|await|try|catch|finally|throw|typeof|instanceof|in|of|this|super|null|undefined|true|false|interface|type|enum|implements|public|private|protected|readonly|as|void";

const PY_KEYWORDS =
  "def|class|return|if|elif|else|for|while|import|from|as|with|try|except|finally|raise|lambda|yield|pass|break|continue|in|is|not|and|or|None|True|False|self|async|await";

const RULES = {
  shell: [
    ["comment", /(?<![^\s])#[^\n]*/y],
    ["string", /"(?:\\.|[^"\\])*"|'[^']*'/y],
    ["variable", /\$\{[^}\n]*\}|\$[A-Za-z_]\w*/y],
    ["prop", /(?<![^\s=])--?[A-Za-z][\w-]*/y],
    ["number", /\b\d+(?:\.\d+)?\b/y],
    ["fn", new RegExp(`(?<![\\w./-])(?:${SHELL_COMMANDS})(?![\\w-])`, "y")],
    ["punct", /&&|\|\||>>?|[|;]/y],
  ],
  js: [
    ["comment", /\/\/[^\n]*|\/\*[\s\S]*?\*\//y],
    ["string", /"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`/y],
    ["number", /\b\d+(?:\.\d+)?\b/y],
    ["keyword", new RegExp(`\\b(?:${JS_KEYWORDS})\\b`, "y")],
    ["tag", /<\/?[A-Za-z][\w.]*/y],
    ["fn", /[A-Za-z_$][\w$]*(?=\()/y],
  ],
  json: [
    ["prop", /"(?:\\.|[^"\\\n])*"(?=\s*:)/y],
    ["string", /"(?:\\.|[^"\\\n])*"/y],
    ["number", /-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/y],
    ["keyword", /\b(?:true|false|null)\b/y],
  ],
  css: [
    ["comment", /\/\*[\s\S]*?\*\//y],
    ["string", /"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/y],
    ["keyword", /@[A-Za-z-]+/y],
    ["number", /#[0-9a-fA-F]{3,8}\b|-?\d*\.?\d+(?:px|rem|em|%|vh|vw|s|ms|deg)?\b/y],
    ["prop", /[A-Za-z-]+(?=\s*:)/y],
  ],
  python: [
    ["comment", /#[^\n]*/y],
    ["string", /"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/y],
    ["number", /\b\d+(?:\.\d+)?\b/y],
    ["keyword", new RegExp(`\\b(?:${PY_KEYWORDS})\\b`, "y")],
    ["fn", /[A-Za-z_]\w*(?=\()/y],
  ],
};

const FAMILY = {
  bash: "shell",
  sh: "shell",
  shell: "shell",
  zsh: "shell",
  javascript: "js",
  js: "js",
  jsx: "js",
  typescript: "js",
  ts: "js",
  tsx: "js",
  json: "json",
  css: "css",
  scss: "css",
  python: "python",
  py: "python",
};

const MAX_HIGHLIGHT_LENGTH = 20000;

export function highlight(code, language) {
  const source = String(code ?? "");
  const rules = RULES[FAMILY[String(language || "").toLowerCase()]];

  if (!rules || source.length > MAX_HIGHLIGHT_LENGTH) {
    return [{ type: "plain", value: source }];
  }

  const tokens = [];

  let plainStart = 0;
  let index = 0;

  const flushPlain = (end) => {
    if (end > plainStart) {
      tokens.push({ type: "plain", value: source.slice(plainStart, end) });
    }
  };

  while (index < source.length) {
    let matched = null;

    for (const [type, pattern] of rules) {
      pattern.lastIndex = index;

      const result = pattern.exec(source);

      if (result && result[0].length > 0) {
        matched = { type, value: result[0] };
        break;
      }
    }

    if (matched) {
      flushPlain(index);
      tokens.push(matched);

      index += matched.value.length;
      plainStart = index;
    } else {
      index += 1;
    }
  }

  flushPlain(source.length);

  return tokens;
}
