import { Monitor, Moon, Sun } from 'lucide-react'

import { useApp } from '@/hooks/app-context'
import type { ThemePreference } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'

const ORDER: ThemePreference[] = ['system', 'light', 'dark']
const LABEL: Record<ThemePreference, string> = { system: 'System', light: 'Light', dark: 'Dark' }
const ICON = { system: Monitor, light: Sun, dark: Moon } as const

/**
 * Theme control: a compact segmented switch (light / dark / system) on sm+ screens and a
 * single cycling button on phones. Plain buttons, no Radix menu, so the shell stays light.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme } = useApp()
  const next = ORDER[(ORDER.indexOf(theme.preference) + 1) % ORDER.length]!
  const Current = ICON[theme.preference]

  return (
    <>
      <div
        role="radiogroup"
        aria-label="Theme"
        className={cn('hidden h-8 items-center gap-0.5 rounded-full border border-line p-0.5 lg:inline-flex', className)}
      >
        {(['light', 'dark', 'system'] as const).map((value) => {
          const Icon = ICON[value]
          const checked = theme.preference === value
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={LABEL[value]}
              title={LABEL[value]}
              onClick={() => theme.setPreference(value)}
              className={cn(
                'inline-flex size-7 items-center justify-center rounded-full transition-colors',
                checked ? 'bg-surface-2 text-fg shadow-[0_0_0_1px_var(--line)]' : 'text-fg-3 hover:text-fg',
              )}
            >
              <Icon className="size-3.5" aria-hidden="true" />
            </button>
          )
        })}
      </div>
      <button
        type="button"
        onClick={theme.cycle}
        aria-label={`Theme: ${LABEL[theme.preference]}. Switch to ${LABEL[next]}`}
        title={`Theme: ${LABEL[theme.preference]}`}
        className={cn(
          'inline-flex size-10 items-center justify-center rounded-[10px] text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg lg:hidden',
          className,
        )}
      >
        <Current className="size-4" aria-hidden="true" />
      </button>
    </>
  )
}
