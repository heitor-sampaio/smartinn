'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Receipt, Trash2, ArrowUpCircle, ArrowDownCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { deleteLancamento } from '@/actions/financeiro'
import { toast } from 'sonner'
import { LancamentoForm } from './lancamento-form'

interface FinanceiroProps {
    initialData: any[]
    mesAtual: number
    anoAtual: number
}

export function FinanceiroClient({ initialData, mesAtual, anoAtual }: FinanceiroProps) {
    const router = useRouter()
    const [lancamentos, setLancamentos] = useState(initialData)
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [formaPagamentoFiltro, setFormaPagamentoFiltro] = useState<string>('TODAS')

    // Sincroniza estado com Server Data novo via Server Action Revalidation
    useEffect(() => {
        setLancamentos(initialData)
    }, [initialData])

    // Alert Dialog State
    const [isAlertOpen, setIsAlertOpen] = useState(false)
    const [lancamentoToDelete, setLancamentoToDelete] = useState<string | null>(null)

    // Cards Macro Variables
    const totalEntradas = lancamentos.filter(l => l.tipo === 'ENTRADA').reduce((a, b) => a + b.valor, 0)
    const totalSaidas = lancamentos.filter(l => l.tipo === 'SAIDA').reduce((a, b) => a + b.valor, 0)
    const saldoLiquido = totalEntradas - totalSaidas

    // Filtros Simples Textuais e Select
    const filtered = lancamentos.filter(l => {
        const matchSearch = l.descricao.toLowerCase().includes(search.toLowerCase()) ||
            l.tipo.toLowerCase().includes(search.toLowerCase()) ||
            (l.reservaId && l.reservaId.toLowerCase().includes(search.toLowerCase()))
        const matchForma = formaPagamentoFiltro === 'TODAS' || l.formaPagamento === formaPagamentoFiltro
        return matchSearch && matchForma
    })

    function handleDeleteClick(id: string) {
        setLancamentoToDelete(id)
        setIsAlertOpen(true)
    }

    async function confirmDelete() {
        if (!lancamentoToDelete) return

        const result = await deleteLancamento(lancamentoToDelete)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success(result.success)
            setLancamentos(lancamentos.filter(l => l.id !== lancamentoToDelete))
        }

        setIsAlertOpen(false)
        setLancamentoToDelete(null)
    }

    // A navegação inteira mudou para a página superior.
    // Exportamos localmente ou passamos props? A forma mais fácil em Next js Server Actions + Client = Client Navigation Pushed by Client Component.
    // Pra ter navegação no Nextjs via Server, a "page" pode dar push, mas precisa de Link ou useRouter Client hook.
    // Ao invés de misturar hooks, vamos apenas refatorar a parte visual movendo-a via prop inversa ou recriar a logica num Client Component 'MonthSelector'
    // Como a navegação estava no FinanceiroClient (Server side rendered mas client hydrated 'use client'), 
    // a page que engloba (Server) não pode usar hooks. Então o Client vai renderizar tudo.

    return (
        <div className="space-y-4">
            {/* Cards Analytics Macro */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-emerald-600">Entradas</h3>
                        <ArrowUpCircle className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold text-emerald-600 text-green-500">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalEntradas)}
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-rose-600">Saídas (Despesas)</h3>
                        <ArrowDownCircle className="h-4 w-4 text-rose-600" />
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold text-rose-600 text-red-500">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSaidas)}
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">Saldo Líquido</h3>
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="p-6 pt-0">
                        <div className={`text-2xl font-bold ${saldoLiquido >= 0 ? 'text-primary' : 'text-red-500'}`}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldoLiquido)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                {/* Linha 1: Busca e filtro de forma de pagamento */}
                <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                        placeholder="Buscar lançamento ou tipo..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1"
                    />
                    <select
                        className="flex h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={formaPagamentoFiltro}
                        onChange={(e) => setFormaPagamentoFiltro(e.target.value)}
                    >
                        <option value="TODAS">Todas Formas Pagto</option>
                        <option value="PIX">Pix</option>
                        <option value="DINHEIRO">Dinheiro</option>
                        <option value="CARTAO_DEBITO">Cartão de Débito</option>
                        <option value="CARTAO_CREDITO_VISTA">Crédito à Vista</option>
                        <option value="CARTAO_CREDITO_PARCELADO">Crédito Parcelado</option>
                        <option value="TRANSFERENCIA">Transferência</option>
                    </select>
                </div>
                {/* Linha 2: Botão novo lançamento */}
                <div className="flex justify-end">
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Novo Lançamento
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Registrar Movimento</DialogTitle>
                                <DialogDescription>
                                    Entre com dados de Receitas ou Despesas
                                </DialogDescription>
                            </DialogHeader>
                            <LancamentoForm onSuccess={() => {
                                setIsOpen(false)
                                router.refresh()
                            }} />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-[640px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Reserva</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Forma Pagto.</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                    Nenhum lançamento financeiro registrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div className="text-sm">
                                            {item.data ? format(new Date(item.data), "dd/MM/yy HH:mm", { locale: ptBR }) : '—'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{item.descricao}</div>
                                    </TableCell>
                                    <TableCell>
                                        {item.reservaId ? (
                                            <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded border">
                                                #{item.reservaId.slice(0, 6).toUpperCase()}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs bg-muted px-2 py-1 rounded-md text-foreground">{item.categoria || '—'}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${item.tipo === 'ENTRADA' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10'}`}>
                                            {item.tipo}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs text-muted-foreground">
                                            {item.formaPagamento ? item.formaPagamento.replace(/_/g, ' ') : '—'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {item.tipo === 'SAIDA' ? '-' : ''}{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(item.id)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Alert Dialog for Deletion */}
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem absoluta certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o lançamento financeiro dos registros do sistema e afetará seus balanços e relatórios contábeis.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setLancamentoToDelete(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
                            Sim, excluir lançamento
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
