import { memo, useMemo } from "react";

import { highlight } from "../../lib/highlight";
import { splitVariables } from "../../lib/variables";

const TOKEN_CLASSES = {
  keyword: "text-tok-keyword",
  string: "text-tok-string",
  comment: "text-tok-comment italic",
  number: "text-tok-number",
  fn: "text-tok-fn",
  prop: "text-tok-prop",
  tag: "text-tok-keyword",
  variable: "text-tok-keyword",
  punct: "text-code-muted",
};

/**
 * Renders code with syntax colours. {{placeholders}} are marked as chips so
 * it is obvious which parts will be asked for when copying.
 */
function CodeText({ code, language }) {
  const nodes = useMemo(() => {
    return highlight(code, language).flatMap((token, tokenIndex) =>
      splitVariables(token.value).map((segment, segmentIndex) => {
        const key = `${tokenIndex}-${segmentIndex}`;

        if (segment.type === "variable") {
          return (
            <span
              key={key}
              className="rounded bg-brass/20 px-0.5 text-brass"
              title={`Placeholder: ${segment.name}`}
            >
              {segment.value}
            </span>
          );
        }

        const className = TOKEN_CLASSES[token.type];

        return className ? (
          <span key={key} className={className}>
            {segment.value}
          </span>
        ) : (
          segment.value
        );
      }),
    );
  }, [code, language]);

  return <>{nodes}</>;
}

export default memo(CodeText);
