import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

const confirmSchema = z.object({
    email: z.string().email('E-mail inválido'),
    password: z.string().min(1, 'Senha é obrigatória'),
})

type ConfirmData = z.infer<typeof confirmSchema>

interface ConfirmacaoAcaoDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: (data: ConfirmData) => Promise<void>
    title?: string
    description?: string
}

export function ConfirmacaoAcaoDialog({
    open,
    onOpenChange,
    onConfirm,
    title = 'Confirmar Ação',
    description = 'Por favor, confirme seu e-mail e senha para prosseguir.',
}: ConfirmacaoAcaoDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const form = useForm<ConfirmData>({
        resolver: zodResolver(confirmSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    async function onSubmit(data: ConfirmData) {
        setIsLoading(true)
        try {
            await onConfirm(data)
            form.reset()
            onOpenChange(false)
        } catch (error) {
            // Error is handled by the caller (e.g., toast)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => {
            if (!isLoading) {
                onOpenChange(v)
                if (!v) form.reset()
            }
        }}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>E-mail</FormLabel>
                                    <FormControl>
                                        <Input placeholder="seu@email.com" {...field} disabled={isLoading} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Senha</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirmar
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
