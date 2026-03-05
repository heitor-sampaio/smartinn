'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

interface MonthSelectorProps {
    mesAtual: number
    anoAtual: number
}

export function MonthSelector({ mesAtual, anoAtual }: MonthSelectorProps) {
    const router = useRouter()
    const nomeMes = meses[mesAtual - 1]

    function navigateMonth(direction: 'prev' | 'next') {
        let nMes = direction === 'prev' ? mesAtual - 1 : mesAtual + 1;
        let nAno = anoAtual;

        if (nMes < 1) {
            nMes = 12;
            nAno--;
        } else if (nMes > 12) {
            nMes = 1;
            nAno++;
        }

        router.push(`/dashboard/financeiro?mes=${nMes}&ano=${nAno}`);
    }

    return (
        <div className="flex flex-col sm:flex-row items-center space-x-2">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-lg font-semibold min-w-[140px] text-center">
                    {nomeMes} {anoAtual}
                </div>
                <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
