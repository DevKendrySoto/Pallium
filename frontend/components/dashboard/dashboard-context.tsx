'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { TodayVisitItem } from '@/features/dashboard/types'

interface DashboardSelection {
  selectedVisit: TodayVisitItem | null
  selectVisit: (visit: TodayVisitItem | null) => void
}

const Ctx = createContext<DashboardSelection | null>(null)

export function DashboardSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedVisit, setSelectedVisit] = useState<TodayVisitItem | null>(null)
  const value = useMemo(
    () => ({ selectedVisit, selectVisit: setSelectedVisit }),
    [selectedVisit],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/** Selección de visita compartida entre TodayVisits y QuickActions. */
export function useDashboardSelection(): DashboardSelection {
  const ctx = useContext(Ctx)
  if (!ctx) return { selectedVisit: null, selectVisit: () => {} }
  return ctx
}
