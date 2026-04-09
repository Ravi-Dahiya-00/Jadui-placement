'use client'

export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }

  return (
    <div className={`relative ${sizes[size]} ${className}`}>
      <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted text-sm animate-pulse">Loading...</p>
      </div>
    </div>
  )
}

export function InlineLoader({ text = 'Processing...' }) {
  return (
    <div className="flex items-center gap-3 text-muted text-sm">
      <LoadingSpinner size="sm" />
      <span>{text}</span>
    </div>
  )
}
