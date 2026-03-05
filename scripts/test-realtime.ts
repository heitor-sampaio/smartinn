import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);
const prisma = new PrismaClient();

async function runTest() {
    console.log("Conectando ao Supabase Realtime...");

    // Configura o channel
    const channel = supabase.channel('test_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tarefas' }, payload => {
            console.log("🔔 EVENTO RECEBIDO DO SUPABASE: ", payload.eventType);
            console.log(payload);
        })
        .subscribe((status, err) => {
            console.log("Status da assinatura: ", status);
            if (err) console.error("Erro na assinatura:", err);

            if (status === 'SUBSCRIBED') {
                console.log("Inserindo tarefa de teste via Prisma...");
                // Dispara o insert mock depois de garantir que estamos inscritos
                prisma.pousada.findFirst().then(pousada => {
                    if (!pousada) return console.log("Nenhuma pousada encontrada para teste");

                    prisma.tarefa.create({
                        data: {
                            pousadaId: pousada.id,
                            titulo: 'Tarefa de Teste Realtime',
                            tipo: 'OUTRO',
                            status: 'PENDENTE'
                        }
                    }).then(() => {
                        console.log("Inserido. Aguardando Websocket do Supabase (5s)...");
                        setTimeout(() => {
                            console.log("Fim do teste.");
                            process.exit(0);
                        }, 5000);
                    });
                });
            }
        });
}

runTest();
