import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Combine Tailwind classes safely
// Usage: cn('text-sm', isActive && 'font-bold')
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
