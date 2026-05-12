import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const usdFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})
const usdFmt2 = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

export const formatUSD = (n: number, fractionDigits = 0) =>
  (fractionDigits === 0 ? usdFmt : usdFmt2).format(n)

export const formatUSDk = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}k`
  return formatUSD(n)
}

export const formatNum = (n: number, digits = 1) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n)

export const formatInt = (n: number) =>
  new Intl.NumberFormat('en-US').format(Math.round(n))

export const pct = (n: number, digits = 1) => `${(n * 100).toFixed(digits)}%`

export function utcStamp(d = new Date()) {
  return d.toISOString().slice(0, 19).replace('T', ' ') + 'Z'
}

export function shortTime(d = new Date()) {
  return d.toISOString().slice(11, 19) + 'Z'
}

export function ago(d: Date) {
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}
