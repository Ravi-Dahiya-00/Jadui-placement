import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes safely, resolving conflicts.
 * @param {...string} inputs - Class names or conditional class objects
 * @returns {string} Merged class string
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date to a readable string
 */
export function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

/**
 * Truncate text to a given length
 */
export function truncate(str, length = 100) {
  if (!str) return ''
  return str.length > length ? str.slice(0, length) + '...' : str
}

/**
 * Calculate percentage
 */
export function getPercent(value, total) {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

/**
 * Delay helper for async operations
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
