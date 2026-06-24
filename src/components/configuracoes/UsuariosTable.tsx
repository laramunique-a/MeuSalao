import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useToggleAtivoUsuario } from '@/hooks/useUsuarios'
import { useToast } from '@/hooks/use-toast'
import { Shield, User, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Database } from '@/types/database.types'

type Usuario = Database['public']['Tables']['usuario']['Row']

interface UsuariosTableProps {
  usuarios: Usuario[]
  onEdit: (usuario: Usuario) => void
}

export function UsuariosTable({ usuarios, onEdit }: UsuariosTableProps) {
  const { toast } = useToast()
  const toggleAtivo = useToggleAtivoUsuario()

  async function handleToggleAtivo(id: string, ativo: boolean) {
    try {
      await toggleAtivo.mutateAsync({ id, ativo: !ativo })
      toast({
        title: ativo ? 'Usuário desativado' : 'Usuário ativado',
        description: 'Status atualizado com sucesso.',
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="border rounded-lg overflow-x-auto w-full">
      <Table className="min-w-[600px] md:min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nome</TableHead>
            <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email</TableHead>
            <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Perfil</TableHead>
            <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Comissão</TableHead>
            <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
            <TableHead className="text-right h-10 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usuarios.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-gray-600 dark:text-gray-400 py-8">
                Nenhum usuário cadastrado
              </TableCell>
            </TableRow>
          ) : (
            usuarios.map((usuario) => (
              <TableRow key={usuario.id} className="hover:bg-muted/30">
                <TableCell className="font-medium py-3 text-sm">{usuario.nome}</TableCell>
                <TableCell className="py-3 text-xs text-muted-foreground">{usuario.email}</TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center gap-2 text-xs">
                    {usuario.perfil === 'super_admin' ? (
                      <>
                        <Shield className="h-3.5 w-3.5 text-purple-600" />
                        <span className="font-semibold text-purple-700">Master Admin</span>
                      </>
                    ) : usuario.perfil === 'administrador' ? (
                      <>
                        <Shield className="h-3.5 w-3.5 text-primary" />
                        <span className="font-medium text-foreground">Administrador</span>
                      </>
                    ) : (
                      <>
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium text-foreground">Funcionário</span>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <Badge variant="outline" className="text-[10px] font-bold border-blue-200 text-blue-700 bg-blue-50/30 px-2 py-0.5">
                    {(usuario as any).comissao_percentual || 0}%
                  </Badge>
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center gap-2 scale-90 origin-left">
                    <Switch
                      checked={usuario.ativo}
                      onCheckedChange={() => handleToggleAtivo(usuario.id, usuario.ativo)}
                      disabled={toggleAtivo.isPending}
                    />
                    <Badge variant={usuario.ativo ? 'default' : 'secondary'} className="text-[10px] px-1.5 h-4">
                      {usuario.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right py-2">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-all rounded-lg"
                      onClick={() => onEdit(usuario as any)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
