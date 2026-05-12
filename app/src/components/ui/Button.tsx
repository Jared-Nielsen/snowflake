import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-cond uppercase tracking-[0.14em] font-semibold transition-all relative whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan',
  {
    variants: {
      variant: {
        primary:
          'bg-snow text-bg-base hover:bg-cyan active:translate-y-px',
        ghost:
          'bg-bg-elev/40 text-ink border border-edge-subtle hover:bg-bg-elev hover:border-edge-strong hover:text-ink',
        outline:
          'bg-transparent text-ink-dim border border-edge-strong hover:bg-bg-elev/40 hover:text-ink hover:border-cyan',
        alarm:
          'bg-alarm/15 text-alarm border border-alarm/40 hover:bg-alarm/25',
        signal:
          'bg-signal/15 text-signal border border-signal/40 hover:bg-signal/25',
        amber:
          'bg-amber/10 text-amber border border-amber/40 hover:bg-amber/20',
      },
      size: {
        xs: 'h-6 px-2.5 text-[10px]',
        sm: 'h-7 px-3 text-[11px]',
        md: 'h-9 px-4 text-xs',
        lg: 'h-11 px-6 text-sm',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
)
Button.displayName = 'Button'

export { buttonVariants }
