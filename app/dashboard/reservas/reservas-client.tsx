'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

import { ReservaForm } from './reserva-form';
import { CheckoutModal } from './checkout-modal';
import { MapaReservasClient } from './mapa-reservas-client';
import { MapaReservasMobile } from './mapa-reservas-mobile';
import { ReservaDetalhesModal } from './reserva-detalhes-modal';
import { fazerCheckin, cancelarReserva, confirmarReserva, registrarNoShow } from '@/actions/reservas';

export function ReservasClient({
    initialData,
    hospedesList,
    acomodacoesList,
    produtosList,
    comodidades,
    configPousada,
    pousadaId,
}: {
    initialData: any[];
    hospedesList: any[];
    acomodacoesList: any[];
    produtosList: any[];
    comodidades: string[];
    configPousada: any;
    pousadaId?: string;
}) {
    const router = useRouter();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        if (!pousadaId) return
        const supabase = createClient()
        const channel = supabase.channel(`pousada-${pousadaId}`)
            .on('broadcast', { event: 'change' }, () => { router.refresh() })
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [pousadaId, router])
    // Armazenar ID em vez do objeto inteiro para que o Refresh pós-ação do Modal de Extras recarregue os subtotais aqui na hora!
    const [editingReservaId, setEditingReservaId] = useState<string | null>(null);
    const [prefillData, setPrefillData] = useState<{ acomodacaoId: string; dataCheckin: string; dataCheckout: string } | null>(null);

    // Flow de Checkout
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [checkoutReservaId, setCheckoutReservaId] = useState<string | null>(null);

    const editingReserva = initialData.find(r => r.id === editingReservaId);

    const openAdd = () => {
        setEditingReservaId(null);
        setPrefillData(null);
        setIsDialogOpen(true);
    };

    const openAddWithPrefill = (acomodacaoId: string, date: Date) => {
        const checkin = date.toISOString().split('T')[0];
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        const checkout = nextDay.toISOString().split('T')[0];
        setEditingReservaId(null);
        setPrefillData({ acomodacaoId, dataCheckin: checkin, dataCheckout: checkout });
        setIsDialogOpen(true);
    };

    // Action Helpers com Toasts
    const handleCheckin = async (id: string) => {
        const p = fazerCheckin(id);
        toast.promise(p, {
            loading: 'Realizando Check-in...',
            success: (res) => {
                if (res.error) throw new Error(res.error);
                return res.success || 'Check-in concluído.';
            },
            error: (e) => e.message
        });
    };

    const openCheckout = (id: string) => {
        setCheckoutReservaId(id);
        setIsCheckoutOpen(true);
    };

    const handleCancel = async (id: string) => {
        const result = await cancelarReserva(id);
        if (result.error) toast.error(result.error);
        else toast.success(result.success);
    };

    const handleConfirmar = async (id: string) => {
        const p = confirmarReserva(id);
        toast.promise(p, {
            loading: 'Confirmando reserva...',
            success: (res) => {
                if (res.error) throw new Error(res.error);
                return res.success || 'Aprovada com sucesso.';
            },
            error: (e) => e.message
        });
    };

    const handleNoShow = async (id: string) => {
        const p = registrarNoShow(id);
        toast.promise(p, {
            loading: 'Registrando No Show...',
            success: (res) => {
                if (res.error) throw new Error(res.error);
                return res.success || 'No Show registrado.';
            },
            error: (e) => e.message
        });
    };

    return (
        <>
            {/* Botão visível apenas no mobile — no desktop fica na toolbar do mapa */}
            <div className="flex md:hidden">
                <Button onClick={openAdd} className="bg-primary">
                    <Plus className="mr-2 h-4 w-4" /> Nova Reserva
                </Button>
            </div>

            <div className="pt-2">
                {/* Mobile: agenda em lista */}
                <div className="md:hidden">
                    <MapaReservasMobile
                        reservas={initialData}
                        acomodacoes={acomodacoesList}
                        onReservaClick={(id) => {
                            setEditingReservaId(id);
                            setIsDialogOpen(true);
                        }}
                    />
                </div>
                {/* Desktop: grade de calendário */}
                <div className="hidden md:block">
                    <MapaReservasClient
                        reservas={initialData}
                        acomodacoes={acomodacoesList}
                        onReservaClick={(id) => {
                            setEditingReservaId(id);
                            setIsDialogOpen(true);
                        }}
                        onAddReserva={openAdd}
                        onDayClick={openAddWithPrefill}
                    />
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto w-11/12 p-3 md:p-6">
                    <DialogHeader className="mb-2">
                        <DialogTitle className="text-2xl">{editingReserva ? 'Painel da Reserva' : 'Registrar Nova Reserva'}</DialogTitle>
                    </DialogHeader>
                    {editingReserva ? (
                        <ReservaDetalhesModal
                            reserva={editingReserva}
                            hospedesList={hospedesList}
                            acomodacoesList={acomodacoesList}
                            produtosList={produtosList}
                            onConfirmar={(id: string) => { setIsDialogOpen(false); handleConfirmar(id); }}
                            onCheckin={(id: string) => { setIsDialogOpen(false); handleCheckin(id); }}
                            onCancelReserva={(id: string) => { setIsDialogOpen(false); handleCancel(id); }}
                            onCheckout={(id: string) => { setIsDialogOpen(false); openCheckout(id); }}
                            onNoShow={(id: string) => { setIsDialogOpen(false); handleNoShow(id); }}
                        />
                    ) : (
                        <ReservaForm
                            initialData={prefillData ?? null}
                            hospedesList={hospedesList}
                            acomodacoesList={acomodacoesList}
                            comodidades={comodidades}
                            onSuccess={() => setIsDialogOpen(false)}
                            configPousada={configPousada}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <CheckoutModal
                isOpen={isCheckoutOpen}
                reservaId={checkoutReservaId}
                onOpenChange={setIsCheckoutOpen}
                onSuccess={() => setIsCheckoutOpen(false)}
            />
        </>
    );
}
