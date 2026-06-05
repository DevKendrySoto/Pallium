'use client'

import { Bell, CalendarCheck, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardKpis } from '@/features/dashboard'

export default function DashboardPage() {
  const kpis = useDashboardKpis()

  const cards = [
    { label: 'Pacientes activos', value: kpis.activePatients, icon: Users },
    { label: 'Visitas hoy', value: kpis.visitsToday, icon: CalendarCheck },
    { label: 'Alertas abiertas', value: kpis.openAlerts, icon: Bell },
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Bienvenido</h1>
        <p className="text-sm text-muted-foreground">
          Resumen general de la operación de la clínica.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.label}
                </CardTitle>
                <Icon size={18} className="text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {kpis.isLoading ? (
                  <Skeleton className="h-9 w-16" />
                ) : (
                  <div className="text-3xl font-semibold tracking-tight">
                    {kpis.isError ? '—' : (kpi.value ?? 0)}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
