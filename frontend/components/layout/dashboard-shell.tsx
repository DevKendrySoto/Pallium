import { AppSidebar } from '@/components/layout/app-sidebar'
import { ReadOnlyBanner } from '@/components/layout/read-only-banner'
import { Topbar } from '@/components/layout/topbar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

/** Shell autenticado: sidebar + topbar + contenido. */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <ReadOnlyBanner />
        <Topbar />
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
