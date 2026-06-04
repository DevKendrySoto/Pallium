import { Bell, CalendarCheck, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const KPIS = [
  { label: 'Pacientes activos', value: '--', icon: Users },
  { label: 'Visitas hoy', value: '--', icon: CalendarCheck },
  { label: 'Alertas', value: '--', icon: Bell },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Bienvenido</h1>
        <p className="text-sm text-muted-foreground">
          Resumen general de la operación de la clínica.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {KPIS.map((kpi) => {
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
                <div className="text-3xl font-semibold tracking-tight">{kpi.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
