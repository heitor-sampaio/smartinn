import { createClient } from '@supabase/supabase-js'

/**
 * Envia um sinal "algo mudou" para todos os clientes da pousada via Supabase Broadcast.
 * Usa o SDK oficial com secret key — método documentado para envio server-side.
 * Payload vazio de propósito: o cliente recebe o ping e busca dados via Server Action autenticada.
 */
export async function broadcastPousadaChange(pousadaId: string) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SECRET_KEY!,
            { auth: { persistSession: false } }
        )

        const result = await supabase.channel(`pousada-${pousadaId}`).send({
            type: 'broadcast',
            event: 'change',
            payload: {}
        })

        if (result !== 'ok') {
            console.error('[broadcast] Falha no envio:', result)
        }
    } catch (e) {
        console.error('[broadcast] Erro:', e)
    }
}
