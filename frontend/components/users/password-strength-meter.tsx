'use client'

import { cn } from '@/lib/utils'

/** Reglas: min 8, una mayúscula, un número, un símbolo. */
export function passwordScore(pw: string): { score: number; checks: { ok: boolean; label: string }[] } {
  const checks = [
    { ok: pw.length >= 8, label: 'Mínimo 8 caracteres' },
    { ok: /[A-Z]/.test(pw), label: 'Una mayúscula' },
    { ok: /[0-9]/.test(pw), label: 'Un número' },
    { ok: /[^A-Za-z0-9]/.test(pw), label: 'Un símbolo' },
  ]
  return { score: checks.filter((c) => c.ok).length, checks }
}

const COLORS = ['bg-slate-200', 'bg-danger', 'bg-orange-500', 'bg-amber-400', 'bg-success']

export function PasswordStrengthMeter({ value }: { value: string }) {
  const { score, checks } = passwordScore(value)
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cn('h-1.5 flex-1 rounded-full', i < score ? COLORS[score] : 'bg-slate-200')} />
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-x-3 text-xs">
        {checks.map((c) => (
          <li key={c.label} className={cn(c.ok ? 'text-success' : 'text-muted-foreground')}>
            {c.ok ? '✓' : '·'} {c.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
