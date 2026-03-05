'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

import { ReservaForm } from './reserva-form';
import { CheckoutModal } from './checkout-modal';
import { MapaReservasClient } from './mapa-reservas-client';
import { ReservaDetalhesModal } from './reserva-detalhes-modal';
import { fazerCheckin, cancelarReserva, confirmarReserva } from '@/actions/reservas';

export function ReservasClient({
    initialData,
    hospedesList,
    acomodacoesList,
    produtosList,
    configPousada
}: {
    initialData: any[];
    hospedesList: any[];
    acomodacoesList: any[];
    produtosList: any[];
    configPousada: any;
}) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    // Armazenar ID em vez do objeto inteiro para que o Refresh pós-ação do Modal de Extras recarregue os subtotais aqui na hora!
    const [editingReservaId, setEditingReservaId] = useState<string | null>(null);

    // Flow de Checkout
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [checkoutReservaId, setCheckoutReservaId] = useState<string | null>(null);

    const editingReserva = initialData.find(r => r.id === editingReservaId);

    const openAdd = () => {
        setEditingReservaId(null);
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

    return (
        <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <p className="text-muted-foreground w-full sm:w-auto">
                    Monitore o mapa de ocupação, gerencie consumos e fature reservas com poucos cliques.
                </p>
                <div className="flex items-center space-x-2 shrink-0">
                    <Button onClick={openAdd} className="bg-primary">
                        <Plus className="mr-2 h-4 w-4" /> Nova Reserva
                    </Button>
                </div>
            </div>

            <div className="pt-2">
                <MapaReservasClient
                    reservas={initialData}
                    acomodacoes={acomodacoesList}
                    onReservaClick={(id) => {
                        setEditingReservaId(id);
                        setIsDialogOpen(true);
                    }}
                />
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto w-11/12 p-6">
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
                        />
                    ) : (
                        <ReservaForm
                            initialData={null}
                            hospedesList={hospedesList}
                            acomodacoesList={acomodacoesList}
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
