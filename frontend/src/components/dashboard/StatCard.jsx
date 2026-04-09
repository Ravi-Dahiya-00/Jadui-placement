import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

/**
 * Dashboard stat card with value, label, optional icon, and trend indicator.
 */
export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'primary', className }) {
  const colors = {
    primary:   { icon: 'text-primary',   bg: 'bg-primary/10',   border: 'border-primary/20'   },
    secondary: { icon: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/20' },
    accent:    { icon: 'text-accent',    bg: 'bg-accent/10',    border: 'border-accent/20'    },
    success:   { icon: 'text-success',   bg: 'bg-success/10',   border: 'border-success/20'   },
    warning:   { icon: 'text-warning',   bg: 'bg-warning/10',   border: 'border-warning/20'   },
  }

  const c = colors[color] || colors.primary

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-error' : 'text-muted'

  return (
    <div className={cn(
      'bg-card border border-border rounded-xl p-5 transition-all duration-300',
      'hover:border-primary/25 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
      className
    )}>
      <div className="flex items-start justify-between mb-4">
        {/* Title + trend */}
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-widest">{title}</p>
        </div>
        {/* Icon */}
        {Icon && (
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', c.bg, `border ${c.border}`)}>
            <Icon className={cn('w-4 h-4', c.icon)} />
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-1.5">
        <span className={cn('text-3xl font-black', c.icon)}>{value}</span>
      </div>

      {/* Subtitle + trend */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">{subtitle}</p>
        {trendValue !== undefined && (
          <div className={cn('flex items-center gap-1 text-xs font-medium', trendColor)}>
            <TrendIcon className="w-3 h-3" />
            {trendValue}
          </div>
        )}
      </div>
    </div>
  )
}
