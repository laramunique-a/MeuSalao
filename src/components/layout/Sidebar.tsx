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
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export function Sidebar({ open, setOpen }: SidebarProps) {
  const { isAdmin } = useAuth()

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

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
      isActive
        ? 'bg-primary/10 text-primary dark:bg-primary/20'
        : 'text-foreground/70 hover:bg-accent dark:hover:bg-accent/50'
    )

  return (
    <>
      {/* Overlay mobile */}
      <div
        className={cn(
          'fixed inset-0 z-20 bg-gray-900/50 lg:hidden',
          open ? 'block' : 'hidden'
        )}
        onClick={() => setOpen(false)}
      />

      <div
        className={cn(
          'fixed top-16 bottom-0 left-0 z-30 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              onClick={() => setOpen(false)}
              className={navLinkClass}
            >
              <item.icon className="mr-3 h-4 w-4" />
              {item.name}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="pt-4 pb-2">
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.name}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-border">
          <p className="text-[10px] font-bold text-center text-primary/60 uppercase tracking-widest">
            MeuSalão
          </p>
        </div>
      </div>
    </>
  )
}
