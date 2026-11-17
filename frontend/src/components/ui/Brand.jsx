import Icon from "./Icon";

/**
 * CmdKit mark + wordmark.
 * tone="inverse" is for dark navy surfaces.
 */
export default function Brand({ compact = false, tone = "default" }) {
  const inverse = tone === "inverse";

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        className={`grid size-8 shrink-0 place-items-center rounded-lg ${
          inverse ? "bg-white text-[#1f3a31]" : "bg-navy text-on-navy"
        }`}
      >
        <Icon name="code-s-slash" size={17} />
      </span>

      {!compact && (
        <span
          className={`truncate text-[15px] font-semibold tracking-tight ${
            inverse ? "text-white" : "text-ink"
          }`}
        >
          CmdKit
        </span>
      )}
    </div>
  );
}
