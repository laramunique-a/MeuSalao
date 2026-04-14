import { Menu, Moon, Sun, LogOut } from 'lucide-react'
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

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { usuario, logout } = useAuth()
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

  return (
    <header className="fixed top-0 left-0 right-0 z-20 h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/50 lg:hidden transition-all duration-300">
      <div className="flex h-full items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors shrink-0"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Logo compacta apenas para Mobile */}
          <div className="flex lg:hidden items-center gap-2 sm:gap-3 min-w-0">
            {salao?.logo_url || localStorage.getItem('salao_logo') ? (
              <img
                src={salao?.logo_url || localStorage.getItem('salao_logo') || ''}
                alt="Logo"
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg object-cover border border-border/50 shrink-0"
              />
            ) : (
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">
                {(salao?.nome || localStorage.getItem('salao_nome') || 'S').charAt(0)}
              </div>
            )}
            <span className="text-[14px] sm:text-[15px] font-black tracking-tight text-foreground truncate max-w-[100px] sm:max-w-[150px]">
              {salao?.nome || localStorage.getItem('salao_nome') || ''}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground hover:bg-muted rounded-xl"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-xl p-0 overflow-hidden border border-border/50 hover:border-primary/50 transition-colors">
                <Avatar className="h-full w-full rounded-none">
                  <AvatarFallback className="bg-primary text-primary-foreground rounded-none text-xs font-bold">
                    {usuario ? getInitials(usuario.nome) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl border-border/50 shadow-xl">
              <div className="flex items-center justify-start gap-3 p-3">
                <div className="flex flex-col space-y-0.5">
                  <p className="text-sm font-bold leading-none">{usuario?.nome}</p>
                  <p className="text-[11px] text-muted-foreground">{usuario?.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem onClick={logout} className="p-3 text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer rounded-lg m-1">
                <LogOut className="mr-2 h-4 w-4" />
                <span className="font-bold">Sair do Sistema</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
