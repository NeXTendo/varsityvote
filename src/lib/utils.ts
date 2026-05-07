import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isPast, isFuture } from 'date-fns'
import type { ElectionStatus } from '@/types/database.types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return format(new Date(date), 'dd MMM yyyy')
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), 'dd MMM yyyy, HH:mm')
}

export function timeFromNow(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function getElectionTimeStatus(
  start: string | null,
  end: string | null
): 'upcoming' | 'open' | 'closed' | 'no-window' {
  if (!start || !end) return 'no-window'
  const startDate = new Date(start)
  const endDate = new Date(end)
  if (isFuture(startDate)) return 'upcoming'
  if (isPast(endDate)) return 'closed'
  return 'open'
}

export const STATUS_LABEL: Record<ElectionStatus, string> = {
  draft:               'Draft',
  active:              'Active',
  closed:              'Closed',
  results_published:   'Results Published',
}

export const STATUS_COLOR: Record<ElectionStatus, string> = {
  draft:             'bg-yellow-100 text-yellow-800',
  active:            'bg-green-100 text-green-800',
  closed:            'bg-gray-100 text-gray-700',
  results_published: 'bg-blue-100 text-blue-800',
}

export function truncate(str: string, max = 120) {
  return str.length > max ? str.slice(0, max) + '…' : str
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}