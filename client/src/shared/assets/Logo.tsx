import './logo.css'

type LogoProps = { markOnly?: boolean; size?: number; className?: string }

/** Theme-aware: colors come from tokens, so light/dark need no separate asset. */
export function Logo({ markOnly = false, size = 32, className }: LogoProps) {
  return (
    <span className={`t-logo ${className ?? ''}`} style={{ fontSize: size * 0.78 }} role="img" aria-label="Tandem">
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="14" cy="20" r="10" fill="var(--c-primary)" />
        <circle cx="26" cy="20" r="10" fill="var(--c-accent)" />
        <path d="M20 11.6A10 10 0 0 1 20 28.4A10 10 0 0 1 20 11.6Z" fill="var(--c-ink)" />
      </svg>
      {!markOnly && <span className="t-logo__word" aria-hidden="true">tandem</span>}
    </span>
  )
}
