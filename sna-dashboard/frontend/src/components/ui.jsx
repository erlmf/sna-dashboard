import { clsx } from 'clsx'

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-border bg-panel p-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
const TIER_STYLES = {
  1: 'bg-amber/15 text-amber border-amber/30',
  2: 'bg-accent/15 text-accent border-accent/30',
  3: 'bg-cyan/15 text-cyan border-cyan/30',
  4: 'bg-green/15 text-green border-green/30',
  5: 'bg-muted/60 text-dim border-border',
}

export function TierBadge({ tier, label }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-mono font-medium',
        TIER_STYLES[tier] ?? TIER_STYLES[5]
      )}
    >
      T{tier} {label}
    </span>
  )
}

export function Badge({ children, color = 'accent' }) {
  const styles = {
    accent: 'bg-accent/15 text-accent border-accent/30',
    cyan:   'bg-cyan/15 text-cyan border-cyan/30',
    green:  'bg-green/15 text-green border-green/30',
    amber:  'bg-amber/15 text-amber border-amber/30',
    red:    'bg-red/15 text-red border-red/30',
    muted:  'bg-muted/60 text-dim border-border',
  }
  return (
    <span className={clsx('inline-flex items-center rounded-full border px-2 py-0.5 text-xs', styles[color] ?? styles.muted)}>
      {children}
    </span>
  )
}

// ── Stat ──────────────────────────────────────────────────────────────────────
export function Stat({ label, value, sub }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-dim font-mono uppercase tracking-wider">{label}</span>
      <span className="text-xl font-display font-bold text-text">{value}</span>
      {sub && <span className="text-xs text-dim">{sub}</span>}
    </div>
  )
}

// ── Loading / Error ───────────────────────────────────────────────────────────
export function Spinner({ size = 20 }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24"
      className="animate-spin text-accent"
      fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function LoadingBlock({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-dim">
      <Spinner size={28} />
      <span className="text-sm font-mono">{label}</span>
    </div>
  )
}

export function ErrorBlock({ message }) {
  return (
    <div className="rounded-xl border border-red/30 bg-red/5 p-4 text-red text-sm font-mono">
      ⚠ {message}
    </div>
  )
}

// ── Select ────────────────────────────────────────────────────────────────────
export function Select({ value, onChange, options, placeholder = 'All' }) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value || null)}
      className="rounded-lg border border-border bg-muted px-3 py-1.5 text-sm text-text font-mono focus:border-accent focus:outline-none"
    >
      <option value="">{placeholder}</option>
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ value, onChange, placeholder, className = '' }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={clsx(
        'rounded-lg border border-border bg-muted px-3 py-1.5 text-sm text-text font-mono',
        'placeholder:text-dim focus:border-accent focus:outline-none',
        className
      )}
    />
  )
}

// ── Nav Tab ───────────────────────────────────────────────────────────────────
export function NavTab({ active, onClick, children, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display font-semibold transition-all',
        active
          ? 'bg-accent text-white shadow-lg shadow-accent/25'
          : 'text-dim hover:text-text hover:bg-muted'
      )}
    >
      {Icon && <Icon size={15} />}
      {children}
    </button>
  )
}

// ── helpers ───────────────────────────────────────────────────────────────────
export function fmt(n, decimals = 0) {
  if (n === null || n === undefined) return '—'
  if (typeof n !== 'number') n = Number(n)
  if (isNaN(n)) return '—'
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (Math.abs(n) >= 1_000)     return (n / 1_000).toFixed(1) + 'K'
  return n.toFixed(decimals)
}

export function fmtPct(n) {
  if (n === null || n === undefined) return '—'
  return Number(n).toFixed(4)
}
