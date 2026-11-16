/**
 * Remix Icon wrapper.
 *
 *   <Icon name="file-copy" />                 -> ri-file-copy-line
 *   <Icon name="check" variant="fill" />      -> ri-check-fill
 *   <Icon name="loader-4" spin />
 *
 * Icons are decorative unless a `label` is passed. Size is the font-size in px,
 * so glyphs scale with the same optical weight everywhere.
 */
export default function Icon({
  name,
  variant = "line",
  size = 16,
  spin = false,
  label,
  className = "",
  ...rest
}) {
  return (
    <i
      className={`ri-${name}-${variant} ${spin ? "animate-spin" : ""} ${className}`}
      style={{ fontSize: size }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...rest}
    />
  );
}
