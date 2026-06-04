'use client'

import { ChevronDown, LogOut, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useAuthStore } from '@/lib/auth-store'

export function Topbar() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const displayName = user?.fullName ?? user?.email ?? 'Usuario'

  function handleLogout() {
    logout()
    router.push('/login')
  }

  return (
    <header className="flex h-14 items-center gap-3 border-b border-slate-200 bg-background px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />
      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <User size={18} />
              <span className="text-sm font-medium">{displayName}</span>
              <ChevronDown size={16} className="text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut size={18} />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
