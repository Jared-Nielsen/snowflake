import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] px-2 py-0.5 border',
  {
    variants: {
      tone: {
        neutral: 'border-edge-strong text-ink-dim bg-bg-elev/50',
        snow:    'border-snow/50    text-snow    bg-snow/10',
        cyan:    'border-cyan/50    text-cyan    bg-cyan/10',
        amber:   'border-amber/50   text-amber   bg-amber/10',
        signal:  'border-signal/50  text-signal  bg-signal/10',
        alarm:   'border-alarm/60   text-alarm   bg-alarm/10',
        copper:  'border-copper/50  text-copper  bg-copper/10',
        flare:   'border-flare/50   text-flare   bg-flare/10',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

export function Badge({
  children,
  tone,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {children}
    </span>
  )
}
