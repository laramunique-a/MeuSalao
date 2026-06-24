import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  Calendar,
  Users,
  Home,
  DollarSign,
  Menu as MenuIcon,
  KeyRound,
  LogOut,
  BarChart3,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AlterarSenhaDialog } from '@/components/auth/AlterarSenhaDialog'

export function BottomTabBar() {
  const { isAdmin, isSuperAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [senhaDialogOpen, setSenhaDialogOpen] = useState(false)

  // Dynamic dashboard route
  const dashboardRoute = isSuperAdmin 
    ? '/master' 
    : isAdmin 
      ? '/dashboard' 
      : '/' // professionals don't have dashboard, fallback to agenda

  const navItems = [
    { name: 'Agenda', to: '/', icon: Calendar },
    { name: 'Clientes', to: '/clientes', icon: Users },
    { 
      name: 'Início', 
      to: dashboardRoute, 
      icon: Home,
      hidden: !isAdmin && !isSuperAdmin // Hide dashboard from professionals on the tab bar directly
    },
    { name: 'Caixa', to: '/caixa', icon: DollarSign },
  ]

  const activeClass = "text-primary scale-110 font-bold active-menu-item"
  const inactiveClass = "text-muted-foreground hover:text-foreground"

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-t border-border px-4 py-2 pb-[calc(env(safe-area-inset-bottom)+8px)] md:hidden flex justify-around items-center shadow-lg">
        {navItems.filter(item => !item.hidden).map((item) => {
          return (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive: linkActive }) =>
                cn(
                  "flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 active:scale-95",
                  linkActive ? activeClass : inactiveClass
                )
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.name}</span>
            </NavLink>
          )
        })}

        {/* Menu Trigger */}
        <button
          onClick={() => setMenuOpen(true)}
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 active:scale-95",
            menuOpen ? activeClass : inactiveClass
          )}
        >
          <MenuIcon className="h-5 w-5 shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Menu</span>
        </button>
      </div>

      {/* Mobile Drawer Menu Sheet */}
      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent className="sm:max-w-md p-4">
          <DialogHeader className="border-b border-border pb-3 mb-2">
            <DialogTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Menu do Sistema
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => {
                setMenuOpen(false)
                navigate('/relatorios')
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold uppercase tracking-wider transition-colors text-muted-foreground hover:text-foreground hover:bg-accent/80 w-full active:scale-95"
            >
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              Relatórios
            </button>

            {isAdmin && (
              <button
                onClick={() => {
                  setMenuOpen(false)
                  navigate('/configuracoes')
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold uppercase tracking-wider transition-colors text-muted-foreground hover:text-foreground hover:bg-accent/80 w-full active:scale-95"
              >
                <Settings className="h-5 w-5 text-muted-foreground" />
                Configurações
              </button>
            )}

            {isSuperAdmin && (
              <button
                onClick={() => {
                  setMenuOpen(false)
                  navigate('/master')
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold uppercase tracking-wider transition-colors text-muted-foreground hover:text-foreground hover:bg-accent/80 w-full active:scale-95"
              >
                <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                Painel Master
              </button>
            )}

            <button
              onClick={() => {
                setMenuOpen(false)
                setSenhaDialogOpen(true)
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold uppercase tracking-wider transition-colors text-muted-foreground hover:text-foreground hover:bg-accent/80 w-full active:scale-95"
            >
              <KeyRound className="h-5 w-5 text-muted-foreground" />
              Alterar Senha
            </button>

            <div className="h-[1px] bg-border my-2" />

            <button
              onClick={() => {
                setMenuOpen(false)
                logout()
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold uppercase tracking-wider transition-colors text-destructive hover:bg-destructive/10 w-full active:scale-95"
            >
              <LogOut className="h-5 w-5" />
              Sair do Sistema
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <AlterarSenhaDialog open={senhaDialogOpen} onOpenChange={setSenhaDialogOpen} />
    </>
  )
}
