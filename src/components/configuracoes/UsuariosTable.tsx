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
import { Shield, User } from 'lucide-react'
import type { Database } from '@/types/database.types'

type Usuario = Database['public']['Tables']['usuario']['Row']

interface UsuariosTableProps {
  usuarios: Usuario[]
}

export function UsuariosTable({ usuarios }: UsuariosTableProps) {
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
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="py-2 h-10">Nome</TableHead>
            <TableHead className="py-2 h-10">Email</TableHead>
            <TableHead className="py-2 h-10">Perfil</TableHead>
            <TableHead className="py-2 h-10">Status</TableHead>
            <TableHead className="text-right py-2 h-10">Ativo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usuarios.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-gray-600 dark:text-gray-400 py-8">
                Nenhum usuário cadastrado
              </TableCell>
            </TableRow>
          ) : (
            usuarios.map((usuario) => (
              <TableRow key={usuario.id} className="hover:bg-muted/30">
                <TableCell className="font-medium py-2">{usuario.nome}</TableCell>
                <TableCell className="py-2">{usuario.email}</TableCell>
                <TableCell className="py-2">
                  <div className="flex items-center gap-2">
                    {usuario.perfil === 'administrador' ? (
                      <>
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="text-sm">Administrador</span>
                      </>
                    ) : (
                      <>
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Funcionário</span>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-2">
                  <Badge variant={usuario.ativo ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                    {usuario.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right py-2">
                  <div className="flex items-center justify-end">
                    <Switch
                      className="scale-75"
                      checked={usuario.ativo}
                      onCheckedChange={() => handleToggleAtivo(usuario.id, usuario.ativo)}
                      disabled={toggleAtivo.isPending}
                    />
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
