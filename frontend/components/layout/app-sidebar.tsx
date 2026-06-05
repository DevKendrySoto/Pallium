'use client'

import {
  Activity,
  BarChart3,
  Bell,
  Calendar,
  ClipboardList,
  LayoutDashboard,
  Route,
  ScrollText,
  Settings,
  UserCog,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useAuthStore } from '@/lib/auth-store'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ size?: number }>
  /** Si está definido, el ítem solo se muestra si el usuario tiene el permiso. */
  permission?: string
}

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: 'Operación',
    items: [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard },
      { label: 'Pacientes', href: '/patients', icon: Users },
      { label: 'Agenda', href: '/agenda', icon: Calendar },
      { label: 'Rutas', href: '/routes', icon: Route },
    ],
  },
  {
    group: 'Clínico',
    items: [
      { label: 'Registro', href: '#', icon: ClipboardList },
      { label: 'Alertas', href: '/alerts', icon: Bell },
      { label: 'Reportes', href: '#', icon: BarChart3 },
    ],
  },
  {
    group: 'Administración',
    items: [
      { label: 'Usuarios', href: '/usuarios', icon: UserCog, permission: 'user:read' },
      { label: 'Auditoría', href: '/auditoria', icon: ScrollText, permission: 'audit:read' },
      { label: 'Configuración', href: '#', icon: Settings },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const permissions = useAuthStore((s) => s.user?.permissions ?? [])

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5 text-sidebar-foreground">
          <Activity size={20} className="text-primary" />
          <span className="text-base font-semibold tracking-tight">Pallium</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {NAV.map((section) => {
          const items = section.items.filter((i) => !i.permission || permissions.includes(i.permission))
          if (items.length === 0) return null
          return (
            <SidebarGroup key={section.group}>
              <SidebarGroupLabel>{section.group}</SidebarGroupLabel>
              <SidebarMenu>
                {items.map((item) => {
                const Icon = item.icon
                const isActive = item.href !== '#' && pathname === item.href
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.href}>
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
                })}
              </SidebarMenu>
            </SidebarGroup>
          )
        })}
      </SidebarContent>
    </Sidebar>
  )
}
