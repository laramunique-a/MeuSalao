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
  const { usuario, isAdmin, isSuperAdmin, logout } = useAuth()
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
          'fixed top-0 bottom-0 left-0 z-30 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-20 flex items-center px-6 border-b border-border/50 bg-muted/5">
          <div className="flex items-center gap-3">
            {salao?.logo_url || localStorage.getItem('salao_logo') ? (
              <img
                src={salao?.logo_url || localStorage.getItem('salao_logo') || ''}
                alt="Logo"
                className="h-14 w-14 rounded-xl object-cover shadow-sm border border-border/50"
              />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-2xl shadow-sm border border-border/10">
                {(salao?.nome || localStorage.getItem('salao_nome') || 'S').charAt(0)}
              </div>
            )}
            <div className="flex flex-col overflow-hidden">
              <span className="text-[15px] font-black tracking-tight text-foreground truncate leading-tight">
                {salao?.nome || localStorage.getItem('salao_nome') || 'Meu Salão'}
              </span>
              <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mt-0.5 truncate">
                {usuario?.nome || 'Usuário'}
              </span>
            </div>
          </div>
        </div>
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

          {isSuperAdmin && (
            <>
              <div className="pt-4 pb-2">
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.name}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-border">
          <button
            onClick={logout}
            className="w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-destructive hover:bg-destructive/10"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sair do Sistema
          </button>
        </div>
        <div className="p-4 border-t border-border/50">
          <p className="text-[10px] font-bold text-center text-primary/60 uppercase tracking-widest">
            MeuSalão
          </p>
        </div>
      </div>
    </>
  )
}
