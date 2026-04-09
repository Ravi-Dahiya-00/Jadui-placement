import { cn } from '@/lib/utils'

// ─── Button ───────────────────────────────────────────────────────────────────

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  onClick,
  type = 'button',
  ...props
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-primary hover:bg-primary-hover text-white shadow-glow-sm hover:shadow-glow',
    secondary: 'bg-secondary hover:bg-secondary/80 text-white',
    outline: 'border border-border hover:border-primary hover:bg-primary/10 text-white',
    ghost: 'hover:bg-primary/10 text-muted hover:text-white',
    danger: 'bg-error hover:bg-error/80 text-white',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────

export function Input({ className, label, error, id, ...props }) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-muted">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          'w-full bg-surface border border-border rounded-lg px-4 py-3 text-white',
          'placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-1',
          'focus:ring-primary/30 transition-all duration-200 text-sm',
          error && 'border-error focus:border-error focus:ring-error/30',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function Card({ children, className, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl p-6 transition-all duration-300',
        hover && 'hover:border-primary/30 hover:shadow-card-hover cursor-pointer',
        className
      )}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,102,241,0.08)' }}
      {...props}
    >
      {children}
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────

export function Badge({ children, variant = 'default', className }) {
  const variants = {
    default:  'bg-primary/15 text-primary border border-primary/25',
    success:  'bg-success/15 text-success border border-success/25',
    warning:  'bg-warning/15 text-warning border border-warning/25',
    error:    'bg-error/15 text-error border border-error/25',
    muted:    'bg-muted/10 text-muted border border-muted/20',
    accent:   'bg-accent/15 text-accent border border-accent/25',
    secondary:'bg-secondary/15 text-secondary border border-secondary/25',
  }

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

export function ProgressBar({ value = 0, max = 100, className, color = 'primary' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const colors = {
    primary:   'from-primary to-secondary',
    success:   'from-success to-accent',
    warning:   'from-warning to-warning/80',
    accent:    'from-accent to-primary',
  }

  return (
    <div className={cn('w-full h-2 bg-surface rounded-full overflow-hidden', className)}>
      <div
        className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-1000', colors[color])}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
