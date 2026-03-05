# PousadaApp — Product Requirements Document

Versão: 1.0 | Status: Em Elaboração | Público-alvo: Time de Produto e Engenharia

## 1. Visão Geral do Produto
### 1.1 Resumo Executivo
PousadaApp é um SaaS de gerenciamento focado exclusivamente em pousadas pequenas (até 20 quartos). O produto resolve a ausência de ferramentas acessíveis, simples e baratas para esse segmento, que hoje gerencia reservas em planilhas, cadernos ou sistemas complexos e caros que não foram feitos para a sua realidade.

### 1.2 Problema
O Brasil possui mais de 30 mil pousadas cadastradas, a grande maioria com menos de 20 quartos. O dono dessas pousadas acumula as funções de recepcionista, financeiro, gerente e governança ao mesmo tempo. Os sistemas existentes no mercado ou são caros demais (acima de R$ 300/mês), ou são complexos demais para quem não tem equipe de TI, ou foram criados para hotéis maiores e trazem funcionalidades desnecessárias que dificultam o uso.
O resultado são pousadas que perdem reservas por falta de controle de disponibilidade, sofrem com overbooking manual, não têm visão financeira clara e gerenciam a operação por WhatsApp e bilhetinhos.

### 1.3 Solução
Um SaaS simples, barato (a partir de R$ 99/mês) e mobile-first que resolve os problemas do dia a dia de uma pousada pequena. O produto precisa ser tão intuitivo que o dono aprenda a usar sozinho em menos de 1 hora, sem necessidade de treinamento ou suporte.

### 1.4 Princípio Central
"Se uma funcionalidade não resolve um problema real do dia a dia de uma pousada pequena, ela não existe no produto."
Simplicidade, velocidade e confiabilidade são inegociáveis.

### 1.5 Métricas de Sucesso
- **MRR**: R$ 99.000 com 1.000 clientes ativos
- **Churn mensal**: Abaixo de 3%
- **Time-to-value**: Pousada operacional em menos de 1 hora após cadastro
- **NPS**: Acima de 50
- **Suporte**: Menos de 5% das pousadas abrindo chamados por mês
- **Conversão trial → pago**: Acima de 30%

## 2. Público-Alvo e Personas
### 2.1 Segmento
Pousadas brasileiras com até 20 quartos, localizadas em destinos turísticos (praias, serras, cidades históricas, ecoturismo). Faturamento mensal entre R$ 5.000 e R$ 60.000. Operação familiar ou com equipe reduzida de 1 a 5 pessoas.

### 2.2 Personas
- **Dona Maria (Proprietária, 45-60 anos)**: Gerencia tudo. Dor: Perder reservas, overbooking. Quer: Saber ocupação e financeiro no celular.
- **João (Recepcionista, 20-30 anos)**: Turno fixo. Dor: Status dos quartos. Quer: Check-in/out rápido.
- **Ana (Camareira/Equipe, 25-50 anos)**: Limpeza/Preparação. Dor: Instruções por bilhetinho. Quer: Lista clara de tarefas.

## 3. Funcionalidades do Produto (MVP v1.0)

### 3.1 Autenticação e Controle de Acesso
Cadastro, login (Email/Senha, Google), tenant isolado por pousada, trial de 30 dias. Perfis: ADMIN, RECEPCIONISTA, EQUIPE.

### 3.2 Gestão de Reservas
Calendário visual (drag & drop), check-in/out com 1 clique. Status de reserva coloridos.

### 3.3 Gestão de Acomodações
Cadastro de quartos (Standard, Suíte, etc), status em tempo real (Disponível, Ocupado, Limpeza, Manutenção).

### 3.4 Cadastro de Hóspedes
Base de hóspedes com histórico e preferências (CPF, e-mail, telefone).

### 3.5 Fila de Tarefas
Fila visual realtime (Supabase), checklist customizável, geração automática (ex: checkout gera Limpeza).

### 3.6 Tickets de Manutenção
Vinculado ao quarto bloqueado. Upload de fotos, status de andamento.

### 3.7 Controle Financeiro
Contas a receber/pagar, extras na conta do hóspede, caixa do dia e dashboard mensal. Formas de PGTO: PIX, Cartões, Dinheiro, etc.

## 4. Stack Tecnológica
- **Framework**: Next.js 14 (App Router)
- **Linguagem**: TypeScript (strict)
- **UI / Componentes**: Tailwind CSS + shadcn/ui
- **Banco / Realtime / Storage**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **Autenticação**: Supabase Auth
- **Mutations**: Next.js Server Actions
- **E-mail**: Resend
- **Pagamentos**: Pagar.me

## 5. Arquitetura e Decisões Técnicas
- Monorepo Full-Stack
- Multi-Tenancy (isolamento por `pousada_id`)
- Server Actions centralizando mutations
- Validação com Zod

## 6. Requisitos de UX e Design
- Mobile-first, "Simplicidade radical" (max 3 ações por tela)
- Acessibilidade e resposta visual < 200ms

## 7. Requisitos de Segurança
HTTPS, Isolamento de tenant, RBAC, Senhas seguras.

## 8. Roadmap — MVP v1.0
- Autenticação e multi-tenancy
- Gestão de reservas
- Gestão de acomodações
- Cadastro de hóspedes
- Fila de tarefas
- Tickets de manutenção
- Controle financeiro
- Plano e cobrança (Pagar.me)
