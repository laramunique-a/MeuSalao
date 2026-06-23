import { NavLink } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  DollarSign,
  BarChart3,
  Settings,
  ShieldCheck,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSalao } from '@/hooks/useSalao'

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export function Sidebar({ open, setOpen }: SidebarProps) {
  const { isAdmin, isSuperAdmin, logout } = useAuth()
  const { data: salao } = useSalao()

  const navigation = [
    { name: 'Agenda', to: '/', icon: Calendar },
    { name: 'Clientes', to: '/clientes', icon: Users },
    ...(isAdmin ? [{ name: 'Serviços', to: '/servicos', icon: Scissors }] : []),
    { name: 'Caixa', to: '/caixa', icon: DollarSign },
  ]

  const adminNavigation = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Relatórios', to: '/relatorios', icon: BarChart3 },
    { name: 'Configurações', to: '/configuracoes', icon: Settings },
  ]

  const masterNavigation = [
    { name: 'Painel Master', to: '/master', icon: ShieldCheck },
  ]

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'group flex items-center px-3 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors',
      isActive
        ? 'bg-primary text-primary-foreground font-bold'
        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
    )

  return (
    <>
      {/* Overlay Mobile */}
      <div
        className={cn(
          'fixed inset-0 z-20 bg-background/80 backdrop-blur-sm lg:hidden',
          open ? 'block' : 'hidden'
        )}
        onClick={() => setOpen(false)}
      />

      {/* Drawer da Sidebar (Apenas Mobile) */}
      <div
        className={cn(
          'fixed top-0 bottom-0 left-0 z-30 w-64 bg-background border-r border-border transform transition-transform duration-300 ease-in-out flex flex-col lg:hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-14 flex items-center px-6 border-b border-border">
          <span className="text-xs font-bold uppercase tracking-widest text-foreground">
            {salao?.nome || localStorage.getItem('salao_nome') || 'Meu Salão'}
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              onClick={() => setOpen(false)}
              className={navLinkClass}
            >
              <item.icon className="mr-3 h-4 w-4 shrink-0" />
              {item.name}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="pt-4 pb-1">
                <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Administração
                </p>
              </div>
              {adminNavigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={navLinkClass}
                >
                  <item.icon className="mr-3 h-4 w-4 shrink-0" />
                  {item.name}
                </NavLink>
              ))}
            </>
          )}

          {isSuperAdmin && (
            <>
              <div className="pt-4 pb-1">
                <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Plataforma
                </p>
              </div>
              {masterNavigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={navLinkClass}
                >
                  <item.icon className="mr-3 h-4 w-4 shrink-0" />
                  {item.name}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <button
            onClick={logout}
            className="w-full group flex items-center px-3 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors text-destructive hover:bg-destructive/10"
          >
            <LogOut className="mr-3 h-4 w-4 shrink-0" />
            Sair do Sistema
          </button>
        </div>
      </div>
    </>
  )
}
