import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import type * as React from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-out-quint outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-[inset_0_1px_0_0_rgb(255_255_255/0.12)] hover:bg-primary/88',
        brand: 'bg-brand text-on-inverse hover:bg-brand/90 dark:text-on-inverse',
        outline: 'border border-line-strong bg-surface text-fg hover:bg-surface-2',
        secondary: 'bg-surface-2 text-fg hover:bg-surface-2/70',
        ghost: 'text-fg-2 hover:bg-surface-2 hover:text-fg',
        link: 'text-brand underline-offset-4 hover:underline',
        destructive: 'bg-caution-soft text-caution-text hover:bg-caution-soft/80',
      },
      size: {
        default: 'h-10 px-4 has-[>svg]:px-3.5',
        sm: 'h-9 gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-11 px-5 text-[0.9375rem] has-[>svg]:px-4',
        icon: 'size-10',
        'icon-sm': 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button'
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
