import { Link } from "react-router-dom";

import Brand from "./Brand";
import Icon from "./Icon";
import ThemeToggle from "./ThemeToggle";

/* ============================================================
   SHELL
   Navy product panel on large screens, single column below.
============================================================ */

function AuthAside() {
  return (
    <aside className="hidden flex-col justify-between bg-panel p-10 text-white lg:flex xl:p-14">
      <Link to="/" aria-label="CmdKit home" className="inline-flex self-start">
        <Brand tone="inverse" />
      </Link>

      <div>
        <h2 className="max-w-md text-[36px] font-semibold leading-[1.1] tracking-[-0.02em]">
          Stop digging through your shell history.
        </h2>

        <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-white/70">
          Keep every command and snippet in one place, one click from your
          clipboard.
        </p>

        <div
          className="mt-8 max-w-md overflow-hidden rounded-card border border-[#2b3f37] bg-[#14201b]"
          aria-hidden="true"
        >
          <div className="flex items-center justify-between border-b border-[#2b3f37] bg-[#1e3029]/60 px-3.5 py-2 text-xs text-[#9db3a6]">
            <span className="font-mono">Undo the last commit</span>

            <span className="inline-flex items-center gap-1.5">
              <Icon name="file-copy" size={14} />
              Copy
            </span>
          </div>

          <pre className="overflow-hidden p-4 font-mono text-[13px] leading-6 text-[#dde7e0]">
            <span className="select-none text-[#8eaf9a]">$ </span>
            git reset --soft HEAD~1
            {"\n"}
            <span className="select-none text-[#8eaf9a]">$ </span>
            git restore --staged .
          </pre>
        </div>
      </div>
    </aside>
  );
}

export function AuthShell({
  title,
  subtitle,
  icon,
  onBack,
  backLabel = "Back",
  backDisabled = false,
  footer,
  children,
}) {
  return (
    <div className="grid min-h-[100dvh] bg-canvas text-ink lg:grid-cols-[5fr_6fr]">
      <AuthAside />

      <main id="main" className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            aria-label="CmdKit home"
            className="inline-flex lg:hidden"
          >
            <Brand />
          </Link>

          <ThemeToggle variant="cycle" className="ml-auto" />
        </div>

        <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center py-8">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              disabled={backDisabled}
              className="btn btn-ghost -ml-2.5 mb-6 h-8 self-start px-2.5"
            >
              <Icon name="arrow-left" size={16} />
              {backLabel}
            </button>
          )}

          {icon && (
            <span className="mb-5 grid size-10 place-items-center rounded-lg border border-line bg-surface text-navy shadow-xs">
              <Icon name={icon} size={20} />
            </span>
          )}

          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>

          {subtitle && (
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              {subtitle}
            </p>
          )}

          <div className="mt-7">{children}</div>

          {footer && <p className="mt-6 text-sm text-muted">{footer}</p>}
        </div>
      </main>
    </div>
  );
}

/* ============================================================
   FEEDBACK
============================================================ */

export function Alert({ tone = "error", children }) {
  const isError = tone === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live="polite"
      className={`mb-5 flex items-start gap-2.5 rounded-control border px-3 py-2.5 text-[13px] leading-5 ${
        isError
          ? "border-danger/25 bg-danger-soft text-danger"
          : "border-success/25 bg-success-soft text-success"
      }`}
    >
      <Icon
        name={isError ? "error-warning" : "checkbox-circle"}
        size={16}
        className="mt-0.5"
      />

      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}

/* ============================================================
   FIELDS
============================================================ */

export function TextField({
  id,
  label,
  labelAside,
  icon,
  error,
  hint,
  trailing,
  ...inputProps
}) {
  const describedBy = error
    ? `${id}-error`
    : hint
      ? `${id}-hint`
      : undefined;

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-medium text-ink">
          {label}
        </label>

        {labelAside}
      </div>

      <div className="relative">
        {icon && (
          <Icon
            name={icon}
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
          />
        )}

        <input
          id={id}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={describedBy}
          className={`input h-11 ${icon ? "pl-10" : ""} ${trailing ? "pr-11" : ""}`}
          {...inputProps}
        />

        {trailing && (
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
            {trailing}
          </div>
        )}
      </div>

      {error ? (
        <p
          id={`${id}-error`}
          className="mt-1.5 flex items-start gap-1.5 text-xs text-danger"
        >
          <Icon name="error-warning" size={14} className="mt-px" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function PasswordField({
  show,
  onToggle,
  disabled,
  ...fieldProps
}) {
  return (
    <TextField
      icon="lock"
      type={show ? "text" : "password"}
      disabled={disabled}
      trailing={
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className="icon-btn"
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
        >
          <Icon name={show ? "eye-off" : "eye"} size={18} />
        </button>
      }
      {...fieldProps}
    />
  );
}

export function Checkbox({ id, label, ...inputProps }) {
  return (
    <label
      htmlFor={id}
      className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-ink"
    >
      <input
        id={id}
        type="checkbox"
        className="size-4 cursor-pointer rounded border-line-strong accent-navy"
        {...inputProps}
      />
      {label}
    </label>
  );
}

/* ============================================================
   ONE-TIME CODE
============================================================ */

export function OtpField({
  otp,
  disabled,
  registerInput,
  onChange,
  onKeyDown,
  onPaste,
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-[13px] font-medium text-ink">
        Verification code
      </legend>

      <div className="grid grid-cols-6 gap-2">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(element) => registerInput(element, index)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={digit}
            disabled={disabled}
            aria-label={`Digit ${index + 1} of ${otp.length}`}
            onChange={(event) => onChange(event, index)}
            onKeyDown={(event) => onKeyDown(event, index)}
            onPaste={(event) => onPaste(event, index)}
            className="input h-12 px-0 text-center font-mono text-lg font-medium"
          />
        ))}
      </div>
    </fieldset>
  );
}

export function ResendRow({ timer, isResending, disabled, onResend }) {
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 text-[13px] text-muted">
      Didn’t get the code?
      <button
        type="button"
        onClick={onResend}
        disabled={timer > 0 || isResending || disabled}
        className="font-medium text-accent hover:underline disabled:cursor-not-allowed disabled:text-faint disabled:no-underline"
      >
        {isResending
          ? "Sending"
          : timer > 0
            ? `Resend in ${timer}s`
            : "Resend code"}
      </button>
    </p>
  );
}

/* ============================================================
   SUBMIT
============================================================ */

export function SubmitButton({ loading, loadingLabel, children, ...props }) {
  return (
    <button type="submit" className="btn btn-primary btn-lg w-full" {...props}>
      {loading ? (
        <>
          <Icon name="loader-4" size={18} spin />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function TextLink({ to, children }) {
  return (
    <Link to={to} className="font-medium text-accent hover:underline">
      {children}
    </Link>
  );
}
