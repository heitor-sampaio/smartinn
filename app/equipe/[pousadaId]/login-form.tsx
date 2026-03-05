'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { loginEquipe } from '@/actions/equipe';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function LoginForm({ pousadaId }: { pousadaId: string }) {
    const [senha, setSenha] = useState('');
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        startTransition(async () => {
            const res = await loginEquipe({ pousadaId, senha });
            if (res.error) {
                toast.error(res.error);
                return;
            }

            toast.success("Acesso liberado!");
            router.push(`/equipe/${pousadaId}/painel`);
            router.refresh();
        });
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-1">
                <label className="text-sm font-medium">Senha Secreta</label>
                <Input
                    type="password"
                    placeholder="Sua senha de acesso"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                />
            </div>

            <Button type="submit" className="w-full mt-2" size="lg" disabled={isPending || !senha}>
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Acessar Painel"}
            </Button>
        </form>
    );
}
