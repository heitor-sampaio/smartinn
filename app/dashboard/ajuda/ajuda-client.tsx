'use client'

import { useState, useMemo } from 'react'
import {
    Rocket, LayoutDashboard, CalendarDays, Users, BedDouble,
    CircleDollarSign, ClipboardList, Package, LineChart, Settings,
    Search, type LucideIcon,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Topico {
    titulo: string
    conteudo: React.ReactNode
}

interface Secao {
    id: string
    titulo: string
    icone: LucideIcon
    badge?: string
    topicos: Topico[]
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

const SECOES: Secao[] = [
    {
        id: 'primeiros-passos',
        titulo: 'Primeiros Passos',
        icone: Rocket,
        topicos: [
            {
                titulo: 'O que é o SmartInn?',
                conteudo: (
                    <div className="space-y-2 text-sm leading-relaxed">
                        <p>O <strong>SmartInn</strong> é um sistema de gestão para pousadas, hotéis e hospedagens em geral. Com ele você gerencia reservas, hóspedes, finanças, tarefas da equipe e muito mais em um único lugar.</p>
                        <p>O sistema funciona 100% pelo navegador — sem instalação. Basta ter acesso à internet para usar em qualquer dispositivo.</p>
                    </div>
                ),
            },
            {
                titulo: 'Como navegar pelo sistema',
                conteudo: (
                    <div className="space-y-2 text-sm leading-relaxed">
                        <p><strong>Sidebar (menu lateral):</strong> no lado esquerdo da tela ficam os módulos principais. Clique em qualquer item para navegar.</p>
                        <p><strong>Header (cabeçalho):</strong> no topo estão o sino de notificações e o seu avatar. Clique no avatar para acessar configurações da conta ou sair.</p>
                        <p><strong>Em dispositivos móveis:</strong> a sidebar fica oculta — use o ícone de menu (☰) para abri-la.</p>
                    </div>
                ),
            },
            {
                titulo: 'Perfis de acesso',
                conteudo: (
                    <div className="space-y-3 text-sm leading-relaxed">
                        <div>
                            <p className="font-semibold">Admin</p>
                            <p className="text-muted-foreground">Acesso total ao sistema: reservas, financeiro, configurações, indicadores e equipe.</p>
                        </div>
                        <div>
                            <p className="font-semibold">Recepcionista</p>
                            <p className="text-muted-foreground">Gerencia reservas, hóspedes, acomodações e tarefas. Não acessa financeiro nem configurações avançadas.</p>
                        </div>
                        <div>
                            <p className="font-semibold">Equipe</p>
                            <p className="text-muted-foreground">Acessa apenas o portal de tarefas (limpeza e manutenção) via link especial. Não tem acesso ao dashboard.</p>
                        </div>
                    </div>
                ),
            },
            {
                titulo: 'Primeiros passos recomendados',
                conteudo: (
                    <ol className="space-y-2 text-sm leading-relaxed list-decimal list-inside">
                        <li>Em <strong>Configurações → Dados Cadastrais</strong>, preencha o nome, CNPJ e endereço da pousada.</li>
                        <li>Em <strong>Configurações → Negócio</strong>, defina os horários padrão de check-in e check-out.</li>
                        <li>Em <strong>Acomodações</strong>, cadastre todos os quartos/chalés disponíveis.</li>
                        <li>Em <strong>Equipe</strong>, convide os colaboradores informando o e-mail e o perfil de acesso.</li>
                        <li>Crie sua primeira <strong>Reserva</strong> e realize o check-in.</li>
                    </ol>
                ),
            },
        ],
    },
    {
        id: 'painel',
        titulo: 'Painel',
        icone: LayoutDashboard,
        topicos: [
            {
                titulo: 'KPIs principais',
                conteudo: (
                    <div className="space-y-2 text-sm leading-relaxed">
                        <p><strong>Taxa de Ocupação:</strong> percentual de acomodações ocupadas em relação ao total disponível no período.</p>
                        <p><strong>Cancelamentos:</strong> total de reservas canceladas no período selecionado.</p>
                        <p><strong>No-Show:</strong> hóspedes que não compareceram e não avisaram.</p>
                        <p>Os cartões na parte superior do Painel mostram esses dados do mês corrente por padrão.</p>
                    </div>
                ),
            },
            {
                titulo: 'Barra de status das acomodações',
                conteudo: (
                    <div className="space-y-2 text-sm leading-relaxed">
                        <p>A barra colorida mostra visualmente o estado de cada acomodação:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li><strong className="text-green-600">Verde — Disponível:</strong> pronta para receber hóspedes.</li>
                            <li><strong className="text-blue-600">Azul — Ocupado:</strong> hóspede em estadia.</li>
                            <li><strong className="text-yellow-600">Amarelo — Limpeza:</strong> aguardando limpeza após saída.</li>
                            <li><strong className="text-orange-600">Laranja — Manutenção:</strong> em reparo, bloqueada para reservas.</li>
                            <li><strong className="text-gray-500">Cinza — Bloqueado:</strong> indisponível por motivo administrativo.</li>
                        </ul>
                    </div>
                ),
            },
            {
                titulo: 'Kanban de operações do dia',
                conteudo: (
                    <div className="space-y-2 text-sm leading-relaxed">
                        <p>Abaixo dos KPIs fica o quadro kanban com as movimentações do dia:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li><strong>Check-in Esperado:</strong> reservas com entrada prevista para hoje.</li>
                            <li><strong>Em Casa:</strong> hóspedes atualmente hospedados.</li>
                            <li><strong>Check-out:</strong> saídas previstas para hoje.</li>
                        </ul>
                        <p>Clique em qualquer card para abrir os detalhes da reserva.</p>
                    </div>
                ),
            },
            {
                titulo: 'Resumo financeiro do mês',
                conteudo: (
                    <p className="text-sm leading-relaxed">
                        Na parte inferior do Painel é exibido um resumo das receitas e despesas do mês, com o saldo líquido calculado automaticamente a partir dos lançamentos financeiros e pagamentos de reservas.
                    </p>
                ),
            },
        ],
    },
    {
        id: 'reservas',
        titulo: 'Reservas',
        icone: CalendarDays,
        topicos: [
            {
                titulo: 'Como criar uma reserva',
                conteudo: (
                    <ol className="space-y-2 text-sm leading-relaxed list-decimal list-inside">
                        <li>Acesse o módulo <strong>Reservas</strong> e clique em <strong>Nova Reserva</strong>.</li>
                        <li>Selecione ou cadastre o hóspede.</li>
                        <li>Escolha a acomodação desejada.</li>
                        <li>Defina as datas de check-in e check-out.</li>
                        <li>Informe o número de adultos e crianças.</li>
                        <li>Registre a forma e o valor do pagamento.</li>
                        <li>Clique em <strong>Salvar</strong>. A reserva aparecerá na lista com status <em>Confirmada</em>.</li>
                    </ol>
                ),
            },
            {
                titulo: 'Editar ou cancelar uma reserva',
                conteudo: (
                    <div className="space-y-2 text-sm leading-relaxed">
                        <p>Na lista de reservas, clique no ícone de <strong>edição (lápis)</strong> para alterar qualquer informação.</p>
                        <p>Para cancelar, abra a reserva e use o botão <strong>Cancelar Reserva</strong>. O sistema pedirá confirmação. Reservas canceladas ficam registradas no histórico.</p>
                    </div>
                ),
            },
            {
                titulo: 'Realizar check-in e check-out',
                conteudo: (
                    <div className="space-y-2 text-sm leading-relaxed">
                        <p><strong>Check-in:</strong> na reserva confirmada, clique em <strong>Fazer Check-in</strong>. O status muda para <em>Em Casa</em> e a acomodação passa a aparecer como <em>Ocupada</em>.</p>
                        <p><strong>Check-out:</strong> com o hóspede saindo, abra a reserva e clique em <strong>Fazer Check-out</strong>. O sistema registra a saída e a acomodação vai para o status <em>Limpeza</em>.</p>
                    </div>
                ),
            },
            {
                titulo: 'Check-in Virtual (link para o hóspede)',
                conteudo: (
                    <div className="space-y-2 text-sm leading-relaxed">
                        <p>O Check-in Virtual permite que o hóspede preencha seus dados antes de chegar, agilizando a recepção.</p>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>Abra a reserva e clique em <strong>Enviar Check-in Virtual</strong>.</li>
                            <li>O sistema gera um link único e o hóspede recebe por e-mail/WhatsApp.</li>
                            <li>O hóspede preenche nome, documento, data de nascimento e demais dados do FNRH.</li>
                            <li>Ao chegou na pousada, os dados já estarão salvos — basta confirmar o check-in.</li>
                        </ol>
                    </div>
                ),
            },
            {
                titulo: 'Status FNRH na reserva',
                conteudo: (
                    <div className="space-y-2 text-sm leading-relaxed">
                        <p>O <strong>FNRH</strong> (Ficha Nacional de Registro de Hóspedes) é exigido por lei para hospedagens no Brasil.</p>
                        <p>O SmartInn indica na reserva se o FNRH está <em>Pendente</em>, <em>Parcial</em> ou <em>Completo</em>, baseado nos dados preenchidos do hóspede (CPF/passaporte, nascimento, gênero, motivo da viagem, etc.).</p>
                        <p>Complete os dados do hóspede para que o status fique <em>Completo</em>.</p>
                    </div>
                ),
            },
            {
                titulo: 'Adicionar extras e consumo à reserva',
                conteudo: (
                    <ol className="space-y-2 text-sm leading-relaxed list-decimal list-inside">
                        <li>Abra a reserva e vá até a aba <strong>Consumo / Extras</strong>.</li>
                        <li>Clique em <strong>Adicionar Item</strong>.</li>
                        <li>Selecione o produto ou serviço (cadastrado no módulo Produtos e Serviços).</li>
                        <li>Informe a quantidade e confirme.</li>
                        <li>O valor é somado automaticamente ao total da reserva.</li>
                    </ol>
                ),
            },
        ],
    },
    {
        id: 'hospedes',
        titulo: 'Hóspedes',
        icone: Users,
        topicos: [
            {
                titulo: 'Cadastrar um hóspede manualmente',
                conteudo: (
                    <ol className="space-y-2 text-sm leading-relaxed list-decimal list-inside">
                        <li>Acesse o módulo <strong>Hóspedes</strong> e clique em <strong>Novo Hóspede</strong>.</li>
                        <li>Preencha nome completo, e-mail e telefone.</li>
                        <li>Adicione os dados do documento (CPF ou passaporte).</li>
                        <li>Informe data de nascimento, gênero e naturalidade.</li>
                        <li>Clique em <strong>Salvar</strong>.</li>
                    </ol>
                ),
            },
            {
                titulo: 'Histórico de estadias',
                conteudo: (
                    <p className="text-sm leading-relaxed">
                        Ao abrir o perfil de um hóspede, a aba <strong>Histórico</strong> exibe todas as reservas anteriores (datas, acomodação, valor pago). Isso é útil para identificar hóspedes frequentes e oferecer atendimento personalizado.
                    </p>
                ),
            },
            {
                titulo: 'Dados obrigatórios para o FNRH',
                conteudo: (
                    <div className="space-y-2 text-sm leading-relaxed">
                        <p>Para que o FNRH seja considerado <em>Completo</em>, os seguintes campos são obrigatórios:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>CPF (brasileiros) ou número do passaporte (estrangeiros)</li>
                            <li>Data de nascimento</li>
                            <li>Gênero</li>
                            <li>Naturalidade (cidade e estado)</li>
                            <li>Motivo da viagem (lazer, negócios, evento, etc.)</li>
                            <li>Meio de transporte utilizado</li>
                        </ul>
                    </div>
                ),
            },
        ],
    },
    {
        id: 'acomodacoes',
        titulo: 'Acomodações',
        icone: BedDouble,
        topicos: [
            {
                titulo: 'Cadastrar uma acomodação',
                conteudo: (
                    <ol className="space-y-2 text-sm leading-relaxed list-decimal list-inside">
                        <li>Acesse o módulo <strong>Acomodações</strong> e clique em <strong>Nova Acomodação</strong>.</li>
                        <li>Informe o nome (ex: &ldquo;Quarto 01&rdquo;, &ldquo;Chalé Ipê&rdquo;).</li>
                        <li>Selecione o tipo e a capacidade (adultos e crianças).</li>
                        <li>Defina a tarifa padrão (diária base).</li>
                        <li>Adicione comodidades (ar-condicionado, TV, frigobar, etc.).</li>
                        <li>Clique em <strong>Salvar</strong>.</li>
                    </ol>
                ),
            },
            {
                titulo: 'Tipos de acomodação disponíveis',
                conteudo: (
                    <ul className="list-disc list-inside space-y-1 text-sm">
                        <li><strong>Standard</strong> — quarto básico</li>
                        <li><strong>Luxo</strong> — quarto superior</li>
                        <li><strong>Suíte</strong> — suíte completa</li>
                        <li><strong>Família</strong> — configurada para famílias</li>
                        <li><strong>Chalé</strong> — unidade independente</li>
                        <li><strong>Outro</strong> — qualquer outra categoria personalizada</li>
                    </ul>
                ),
            },
            {
                titulo: 'Status das acomodações',
                conteudo: (
                    <ul className="list-disc list-inside space-y-1 text-sm">
                        <li><strong>Disponível:</strong> pronta para novas reservas.</li>
                        <li><strong>Ocupado:</strong> hóspede em estadia ativa.</li>
                        <li><strong>Limpeza:</strong> aguardando limpeza após check-out.</li>
                        <li><strong>Manutenção:</strong> bloqueada por um ticket de manutenção.</li>
                        <li><strong>Bloqueado:</strong> indisponível administrativamente.</li>
                    </ul>
                ),
            },
            {
                titulo: 'Tarifas dinâmicas',
                conteudo: (
                    <div className="space-y-2 text-sm leading-relaxed">
                        <p>Além da diária base, você pode configurar tarifas especiais em <strong>Configurações → Negócio</strong>:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li><strong>Fim de semana:</strong> percentual de acréscimo para sexta, sábado e domingo.</li>
                            <li><strong>Feriado:</strong> valor fixo ou percentual para datas específicas.</li>
                            <li><strong>Temporada:</strong> períodos com tarifas diferenciadas (ex: Carnaval, Natal).</li>
                        </ul>
                        <p>O sistema calcula automaticamente a diária correta ao criar uma reserva nessas datas.</p>
                    </div>
                ),
            },
            {
                titulo: 'Tickets de manutenção',
                conteudo: (
                    <div className="space-y-2 text-sm leading-relaxed">
                        <p>Um ticket de manutenção bloqueia a acomodação para reservas enquanto estiver aberto.</p>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>Acesse a acomodação e clique em <strong>Abrir Ticket de Manutenção</strong>.</li>
                            <li>Descreva o problema e a prioridade.</li>
                            <li>Atribua a um responsável (opcional).</li>
                            <li>Quando resolvido, feche o ticket — a acomodação voltará a ficar disponível.</li>
                        </ol>
                    </div>
                ),
            },
        ],
    },
    {
        id: 'financeiro',
        titulo: 'Financeiro',
        icone: CircleDollarSign,
        badge: 'Apenas Admin',
        topicos: [
            {
                titulo: 'Lançamentos manuais',
                conteudo: (
                    <div className="space-y-2 text-sm leading-relaxed">
                        <p>Use lançamentos manuais para registrar receitas e despesas que não vêm de reservas (ex: compra de material de limpeza, pagamento de fornecedor).</p>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>Acesse <strong>Financeiro → Lançamentos</strong> e clique em <strong>Novo Lançamento</strong>.</li>
                            <li>Escolha o tipo: <em>Entrada</em> (receita) ou <em>Saída</em> (despesa).</li>
                            <li>Selecione a categoria e informe o valor e a data.</li>
                            <li>Adicione uma descrição e clique em <strong>Salvar</strong>.</li>
                        </ol>
                    </div>
                ),
            },
            {
                titulo: 'Categorias financeiras',
                conteudo: (
                    <div className="space-y-2 text-sm leading-relaxed">
                        <p>As categorias organizam os lançamentos por natureza (ex: Alimentação, Manutenção, Marketing, Salários). Você pode criar categorias personalizadas em <strong>Configurações → Financeiro</strong>.</p>
                        <p>Os relatórios e gráficos usam as categorias para mostrar onde você gasta e ganha mais.</p>
                    </div>
                ),
            },
            {
                titulo: 'Lançamentos recorrentes',
                conteudo: (
                    <div className="space-y-2 text-sm leading-relaxed">
                        <p>Despesas fixas (aluguel, assinaturas, folha) podem ser configuradas como recorrentes para não precisar lançar manualmente todo mês.</p>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>Ao criar um lançamento, ative a opção <strong>Recorrente</strong>.</li>
                            <li>Defina a periodicidade: semanal, quinzenal, mensal ou anual.</li>
                            <li>O sistema gerará os lançamentos automaticamente nas datas corretas.</li>
                        </ol>
                    </div>
                ),
            },
            {
                titulo: 'Como os pagamentos de reservas aparecem aqui',
                conteudo: (
                    <p className="text-sm leading-relaxed">
                        Sempre que um pagamento é registrado em uma reserva (total ou parcial), o sistema cria automaticamente um lançamento financeiro do tipo <em>Entrada</em> na categoria <em>Hospedagem</em>. Você verá esses lançamentos no extrato financeiro sem precisar fazer nada manualmente.
                    </p>
                ),
            },
        ],
    },
    {
        id: 'tarefas',
        titulo: 'Tarefas e Manutenção',
        icone: ClipboardList,
        topicos: [
            {
                titulo: 'Criar uma tarefa',
                conteudo: (
                    <ol className="space-y-2 text-sm leading-relaxed list-decimal list-inside">
                        <li>Acesse o módulo <strong>Tarefas</strong> e clique em <strong>Nova Tarefa</strong>.</li>
                        <li>Dê um título descritivo (ex: &ldquo;Limpeza Quarto 03&rdquo;).</li>
                        <li>Selecione o tipo: <em>Limpeza</em>, <em>Preparação</em>, <em>Manutenção</em> ou <em>Outro</em>.</li>
                        <li>Defina a prioridade e a data/hora limite.</li>
                        <li>Atribua um responsável (membro da equipe).</li>
                        <li>Adicione itens ao checklist, se necessário.</li>
                        <li>Clique em <strong>Salvar</strong>.</li>
                    </ol>
                ),
            },
            {
                titulo: 'Kanban de tarefas',
                conteudo: (
                    <div className="space-y-2 text-sm leading-relaxed">
                        <p>As tarefas são organizadas em colunas no estilo kanban:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li><strong>Pendente:</strong> tarefa criada, ainda não iniciada.</li>
                            <li><strong>Em Andamento:</strong> responsável começou a executar.</li>
                            <li><strong>Concluída:</strong> tarefa finalizada e marcada como feita.</li>
                        </ul>
                        <p>Arraste os cards entre as colunas ou abra a tarefa e mude o status pelo botão de ação.</p>
                    </div>
                ),
            },
            {
                titulo: 'Prioridades das tarefas',
                conteudo: (
                    <ul className="list-disc list-inside space-y-1 text-sm">
                        <li><strong>Urgente:</strong> deve ser resolvida imediatamente. Aparece destacada em vermelho.</li>
                        <li><strong>Normal:</strong> prioridade padrão.</li>
                        <li><strong>Baixa:</strong> pode ser feita quando houver disponibilidade.</li>
                    </ul>
                ),
            },
            {
                titulo: 'Checklist de itens',
                conteudo: (
                    <p className="text-sm leading-relaxed">
                        Ao criar ou editar uma tarefa, você pode adicionar itens de checklist (ex: &ldquo;Trocar toalhas&rdquo;, &ldquo;Repor frigobar&rdquo;, &ldquo;Verificar ar-condicionado&rdquo;). O responsável marca cada item conforme conclui. A tarefa só pode ser finalizada quando todos os itens estiverem marcados (configurável).
                    </p>
                ),
            },
            {
                titulo: 'Tickets de manutenção vs. Tarefas comuns',
                conteudo: (
                    <div className="space-y-2 text-sm leading-relaxed">
                        <p><strong>Tarefa comum:</strong> qualquer atividade operacional (limpeza, preparação). Não bloqueia a acomodação.</p>
                        <p><strong>Ticket de manutenção:</strong> criado diretamente na acomodação quando há um problema que impede o uso (vazamento, ar-condicionado quebrado). Bloqueia a acomodação automaticamente até ser encerrado.</p>
                    </div>
                ),
            },
        ],
    },
    {
        id: 'produtos',
        titulo: 'Produtos e Serviços',
        icone: Package,
        topicos: [
            {
                titulo: 'Cadastrar um produto ou serviço',
                conteudo: (
                    <ol className="space-y-2 text-sm leading-relaxed list-decimal list-inside">
                        <li>Acesse <strong>Produtos e Serviços</strong> e clique em <strong>Novo Item</strong>.</li>
                        <li>Informe o nome (ex: &ldquo;Cerveja Long Neck&rdquo;, &ldquo;Passeio de Barco&rdquo;).</li>
                        <li>Selecione a categoria e defina o preço unitário.</li>
                        <li>Informe o estoque disponível (para produtos físicos).</li>
                        <li>Clique em <strong>Salvar</strong>.</li>
                    </ol>
                ),
            },
            {
                titulo: 'Vincular a uma reserva como consumo extra',
                conteudo: (
                    <div className="space-y-2 text-sm leading-relaxed">
                        <p>Durante a estadia, o hóspede pode consumir itens do frigobar, solicitar passeios ou usar outros serviços. Para registrar:</p>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>Abra a reserva ativa.</li>
                            <li>Acesse a aba <strong>Consumo / Extras</strong>.</li>
                            <li>Adicione os produtos ou serviços consumidos.</li>
                            <li>O valor é somado ao total da reserva para cobrança no check-out.</li>
                        </ol>
                    </div>
                ),
            },
            {
                titulo: 'Controle de estoque básico',
                conteudo: (
                    <p className="text-sm leading-relaxed">
                        O sistema desconta automaticamente do estoque cada vez que um produto é vinculado a uma reserva. Quando o estoque atingir o nível mínimo configurado, uma notificação será exibida para o administrador repor o item.
                    </p>
                ),
            },
        ],
    },
    {
        id: 'indicadores',
        titulo: 'Indicadores',
        icone: LineChart,
        badge: 'Apenas Admin',
        topicos: [
            {
                titulo: 'Taxa de Ocupação',
                conteudo: (
                    <div className="space-y-2 text-sm leading-relaxed">
                        <p><strong>Taxa de Ocupação</strong> = (Diárias Vendidas ÷ Diárias Disponíveis) × 100</p>
                        <p>Exemplo: se você tem 10 quartos e vendeu 7 diárias em um dia, a ocupação é de 70%.</p>
                        <p>Esse é o principal indicador de desempenho de uma hospedagem.</p>
                    </div>
                ),
            },
            {
                titulo: 'RevPAR e ADR',
                conteudo: (
                    <div className="space-y-2 text-sm leading-relaxed">
                        <p><strong>ADR (Average Daily Rate):</strong> tarifa média cobrada por diária vendida. Mostra se você está precificando bem.</p>
                        <p><strong>RevPAR (Revenue per Available Room):</strong> receita total dividida pelo número de quartos disponíveis (ocupados ou não). Combina ocupação e preço em um único número.</p>
                        <p>Quanto maior o RevPAR, melhor a performance geral da hospedagem.</p>
                    </div>
                ),
            },
            {
                titulo: 'Lucro líquido vs. bruto',
                conteudo: (
                    <div className="space-y-2 text-sm leading-relaxed">
                        <p><strong>Receita Bruta:</strong> total arrecadado com reservas e extras, sem deduzir nada.</p>
                        <p><strong>Lucro Líquido:</strong> receita bruta menos todas as despesas do período (lançamentos de saída).</p>
                        <p>O SmartInn calcula esses valores automaticamente a partir dos lançamentos financeiros.</p>
                    </div>
                ),
            },
            {
                titulo: 'Filtros e período de análise',
                conteudo: (
                    <p className="text-sm leading-relaxed">
                        Na tela de Indicadores, use o seletor de período para analisar qualquer intervalo de datas (mês atual, mês anterior, trimestre, ano, ou período personalizado). Os gráficos e tabelas são atualizados em tempo real conforme você muda o período.
                    </p>
                ),
            },
        ],
    },
    {
        id: 'configuracoes',
        titulo: 'Configurações',
        icone: Settings,
        badge: 'Apenas Admin',
        topicos: [
            {
                titulo: 'Aba Negócio',
                conteudo: (
                    <div className="space-y-2 text-sm leading-relaxed">
                        <p>Configurações operacionais da pousada:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li><strong>Horários padrão:</strong> define os horários de check-in e check-out.</li>
                            <li><strong>Taxas de OTAs:</strong> percentuais cobrados por Airbnb, Booking e similares.</li>
                            <li><strong>Tarifas dinâmicas:</strong> acréscimos para fins de semana, feriados e temporadas.</li>
                            <li><strong>FNRH:</strong> habilitar/desabilitar a exigência do FNRH e configurar os campos obrigatórios.</li>
                        </ul>
                    </div>
                ),
            },
            {
                titulo: 'Aba Dados Cadastrais',
                conteudo: (
                    <div className="space-y-2 text-sm leading-relaxed">
                        <p>Informações básicas da pousada exibidas no sistema e nos documentos:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Nome fantasia e razão social</li>
                            <li>CNPJ</li>
                            <li>Endereço completo</li>
                            <li>Senha do Wi-Fi e ramal da recepção</li>
                        </ul>
                    </div>
                ),
            },
            {
                titulo: 'Aba Aparência',
                conteudo: (
                    <p className="text-sm leading-relaxed">
                        Alterne entre o tema <strong>Claro</strong> e <strong>Escuro</strong> conforme sua preferência. A configuração é salva por usuário, ou seja, cada membro da equipe pode escolher o tema que preferir.
                    </p>
                ),
            },
            {
                titulo: 'Aba Equipe',
                conteudo: (
                    <div className="space-y-2 text-sm leading-relaxed">
                        <p>Gerencie os membros que têm acesso ao sistema:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li><strong>Convidar membro:</strong> informe o e-mail e o perfil (Admin, Recepcionista ou Equipe).</li>
                            <li><strong>Remover membro:</strong> use o ícone de exclusão na lista.</li>
                            <li>Membros com perfil <em>Equipe</em> acessam apenas o portal de tarefas via link especial.</li>
                        </ul>
                    </div>
                ),
            },
            {
                titulo: 'Aba Fiscal',
                conteudo: (
                    <div className="space-y-2 text-sm leading-relaxed">
                        <p>Configurações fiscais e tributárias:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li><strong>Impostos:</strong> alíquotas aplicáveis às diárias.</li>
                            <li><strong>NFS-e (em breve):</strong> emissão automática de notas fiscais de serviço eletrônicas.</li>
                        </ul>
                    </div>
                ),
            },
            {
                titulo: 'Aba Assinatura',
                conteudo: (
                    <p className="text-sm leading-relaxed">
                        Visualize o plano atual contratado, a data de renovação e os limites do plano (número de acomodações, usuários, etc.). Para fazer upgrade ou downgrade, entre em contato com o suporte.
                    </p>
                ),
            },
        ],
    },
]

// ---------------------------------------------------------------------------
// Helper: busca (texto simples, case-insensitive)
// ---------------------------------------------------------------------------

function normaliza(str: string): string {
    return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function textoDoConteudo(conteudo: React.ReactNode): string {
    if (typeof conteudo === 'string') return conteudo
    if (Array.isArray(conteudo)) return conteudo.map(textoDoConteudo).join(' ')
    if (conteudo && typeof conteudo === 'object' && 'props' in (conteudo as object)) {
        const el = conteudo as React.ReactElement
        return textoDoConteudo(el.props?.children)
    }
    return ''
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AjudaClient() {
    const [search, setSearch] = useState('')

    const secoesFiltradas = useMemo(() => {
        const termo = normaliza(search.trim())
        if (!termo) return SECOES
        return SECOES
            .map(secao => {
                const tituloSecao = normaliza(secao.titulo)
                if (tituloSecao.includes(termo)) return secao
                const topicosFiltrados = secao.topicos.filter(topico =>
                    normaliza(topico.titulo).includes(termo) ||
                    normaliza(textoDoConteudo(topico.conteudo)).includes(termo)
                )
                if (topicosFiltrados.length === 0) return null
                return { ...secao, topicos: topicosFiltrados }
            })
            .filter((s): s is Secao => s !== null)
    }, [search])

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
            {/* Sidebar de índice (desktop only) */}
            <aside className="hidden lg:block">
                <div className="sticky top-4 space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Índice</p>
                    {SECOES.map(secao => {
                        const Icon = secao.icone
                        return (
                            <button
                                key={secao.id}
                                onClick={() =>
                                    document.getElementById(secao.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                }
                                className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                            >
                                <Icon className="h-4 w-4 shrink-0" />
                                <span className="truncate">{secao.titulo}</span>
                            </button>
                        )
                    })}
                </div>
            </aside>

            {/* Conteúdo principal */}
            <div className="space-y-6">
                {/* Campo de busca */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Buscar na ajuda…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Resultado vazio */}
                {secoesFiltradas.length === 0 && (
                    <div className="text-center py-16 text-muted-foreground">
                        <p className="text-base font-medium">Nenhum resultado para &ldquo;{search}&rdquo;</p>
                        <p className="text-sm mt-1">Tente palavras diferentes ou navegue pelo índice.</p>
                    </div>
                )}

                {/* Accordion de seções */}
                <Accordion type="multiple" className="space-y-4">
                    {secoesFiltradas.map(secao => {
                        const Icon = secao.icone
                        return (
                            <AccordionItem
                                key={secao.id}
                                value={secao.id}
                                id={secao.id}
                                className="border rounded-lg px-1 scroll-mt-4"
                            >
                                <AccordionTrigger className="px-4 hover:no-underline">
                                    <div className="flex items-center gap-3">
                                        <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                                        <span className="font-semibold text-base">{secao.titulo}</span>
                                        {secao.badge && (
                                            <Badge variant="secondary" className="text-xs">
                                                {secao.badge}
                                            </Badge>
                                        )}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-4">
                                    {/* Accordion interno de tópicos */}
                                    <Accordion type="multiple" className="space-y-1">
                                        {secao.topicos.map((topico, idx) => (
                                            <AccordionItem
                                                key={idx}
                                                value={`${secao.id}-${idx}`}
                                                className="border-0 border-b last:border-b-0"
                                            >
                                                <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline text-left">
                                                    {topico.titulo}
                                                </AccordionTrigger>
                                                <AccordionContent className="pb-3 text-muted-foreground">
                                                    {topico.conteudo}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </AccordionContent>
                            </AccordionItem>
                        )
                    })}
                </Accordion>
            </div>
        </div>
    )
}
