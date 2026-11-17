export const isApplePlatform =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent || "");

/** Label for the primary modifier key: "⌘" on Apple devices, "Ctrl" elsewhere. */
export const modKeyLabel = isApplePlatform ? "⌘" : "Ctrl";

export function isEditableTarget(target) {
  const tagName = target?.tagName;

  return (
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT" ||
    Boolean(target?.isContentEditable)
  );
}
