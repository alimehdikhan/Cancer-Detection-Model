import type * as React from 'react'

import { cn } from '@/lib/utils'

/** Small icon tile used in section cards: hairline square with a muted icon. */
export function IconTile({
  icon: Icon,
  className,
}: {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-line bg-surface-2 text-fg-2',
        className,
      )}
    >
      <Icon className="size-[18px]" aria-hidden="true" />
    </span>
  )
}
