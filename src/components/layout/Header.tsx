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
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-card border-b border-border shadow-sm">
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-4 pl-2 lg:w-64">
            {salao?.logo_url || localStorage.getItem('salao_logo') ? (
              <img
                src={salao?.logo_url || localStorage.getItem('salao_logo') || ''}
                alt="Logo"
                className="h-8 w-12 object-contain"
              />
            ) : (
              <div className="h-8 w-12 rounded bg-primary/10 flex items-center justify-center text-primary font-black text-sm">
                {(salao?.nome || localStorage.getItem('salao_nome') || 'S').charAt(0)}
              </div>
            )}
  
            <span className="text-[17px] font-bold tracking-tight text-foreground truncate max-w-[200px]">
              {salao?.nome || localStorage.getItem('salao_nome') || ''}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {usuario ? getInitials(usuario.nome) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{usuario?.nome}</p>
                  <p className="text-xs text-muted-foreground">{usuario?.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
