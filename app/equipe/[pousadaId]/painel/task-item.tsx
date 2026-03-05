'use client';

import { useState, useTransition } from 'react';
import { concluirTarefaEquipe } from '@/actions/equipe';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, AlertCircle, Check, BedDouble, Wrench, Sparkles, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type TarefaItem = {
    id: string;
    titulo: string;
    descricao: string | null;
    tipo: string;
    prioridade: string;
    criadoEm: Date;
    acomodacao: { nome: string } | null;
};

export default function TaskItem({ tarefa, pousadaId }: { tarefa: TarefaItem, pousadaId: string }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleConcluir = () => {
        startTransition(async () => {
            const res = await concluirTarefaEquipe(pousadaId, tarefa.id);
            if (res.success) {
                toast.success('Tarefa concluída!');
                router.refresh();
            } else {
                toast.error(res.error || 'Erro ao concluir tarefa');
            }
        });
    };

    // Ícones e cores por tipo
    const TipoIcon = {
        'LIMPEZA': Sparkles,
        'MANUTENCAO': Wrench,
        'PREPARACAO': BedDouble,
        'OUTRO': AlertCircle
    }[tarefa.tipo] || AlertCircle;

    const tipoColorClass = {
        'LIMPEZA': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
        'MANUTENCAO': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
        'PREPARACAO': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
        'OUTRO': 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
    }[tarefa.tipo] || 'bg-zinc-100 text-zinc-700';

    return (
        <Card className={cn(
            "overflow-hidden transition-all duration-300",
            isPending ? "scale-95 opacity-60" : "hover:border-primary/40 shadow-sm"
        )}>
            <div className={cn(
                "h-2 w-full",
                tarefa.prioridade === 'URGENTE' ? 'bg-red-500' : 'bg-transparent'
            )} />

            <CardContent className="p-4 flex flex-col gap-4">
                <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider",
                                tipoColorClass
                            )}>
                                <TipoIcon className="w-3 h-3" />
                                {tarefa.tipo}
                            </span>

                            {tarefa.prioridade === 'URGENTE' && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-400 px-2 py-0.5 rounded-full">
                                    <AlertTriangle className="w-3 h-3" />
                                    URGENTE
                                </span>
                            )}
                        </div>

                        <h3 className="font-semibold text-lg leading-tight mt-1">{tarefa.titulo}</h3>

                        {tarefa.descricao && (
                            <p className="text-sm text-muted-foreground line-clamp-2 leading-snug">
                                {tarefa.descricao}
                            </p>
                        )}
                    </div>
                </div>

                <div className="bg-muted/40 rounded-xl p-3 flex flex-col gap-1.5 border">
                    {tarefa.acomodacao ? (
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <BedDouble className="w-4 h-4 text-muted-foreground" />
                            Quarto: <span className="text-foreground">{tarefa.acomodacao.nome}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <AlertCircle className="w-4 h-4" />
                            Área Comum / Não Especificado
                        </div>
                    )}
                    <div className="text-xs text-muted-foreground flex items-center justify-between">
                        <span>Aberta em: {format(new Date(tarefa.criadoEm), "dd/MM 'às' HH:mm")}</span>
                    </div>
                </div>

                <Button
                    className="w-full h-12 text-base font-semibold transition-all hover:bg-green-600"
                    size="lg"
                    onClick={handleConcluir}
                    disabled={isPending}
                >
                    {isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                        <>
                            <Check className="w-5 h-5 mr-2" />
                            Marcar como Concluída
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
