import { Menu, Moon, Sun, LogOut } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { useSalao } from '@/hooks/useSalao'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { usuario, isAdmin, isSuperAdmin, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { data: salao } = useSalao()

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const navigation = [
    { name: 'Agenda', to: '/' },
    { name: 'Clientes', to: '/clientes' },
    ...(isAdmin ? [{ name: 'Serviços', to: '/servicos' }] : []),
    { name: 'Caixa', to: '/caixa' },
    ...(isAdmin ? [
      { name: 'Dashboard', to: '/dashboard' },
      { name: 'Relatórios', to: '/relatorios' },
      { name: 'Configurações', to: '/configuracoes' },
    ] : []),
    ...(isSuperAdmin ? [{ name: 'Painel Master', to: '/master' }] : []),
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-20 h-14 bg-background border-b border-border transition-all duration-300">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-6 min-w-0">
          {/* Menu Hambúrguer (Apenas Mobile) */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors shrink-0"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Nome / Logo do Salão minimalista */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-sm font-semibold tracking-tight text-foreground truncate max-w-[120px] sm:max-w-[200px]">
              {salao?.nome || localStorage.getItem('salao_nome') || 'Meu Salão'}
            </span>
          </div>

          {/* Navegação Horizontal (Apenas Desktop) */}
          <nav className="hidden lg:flex items-center gap-6">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'text-xs font-medium uppercase tracking-wider transition-colors',
                    isActive
                      ? 'text-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  )
                }
              >
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Lado Direito: Alternar Tema & Avatar */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground h-9 w-9"
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 overflow-hidden border border-border">
                <Avatar className="h-full w-full rounded-full">
                  <AvatarFallback className="bg-primary text-primary-foreground rounded-full text-xs font-medium">
                    {usuario ? getInitials(usuario.nome) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2 border-border">
              <div className="flex items-center justify-start gap-3 p-3">
                <div className="flex flex-col space-y-0.5">
                  <p className="text-xs font-semibold leading-none">{usuario?.nome}</p>
                  <p className="text-[10px] text-muted-foreground">{usuario?.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="p-2.5 text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer m-1 rounded">
                <LogOut className="mr-2 h-4 w-4" />
                <span className="font-semibold text-xs uppercase tracking-wider">Sair do Sistema</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
