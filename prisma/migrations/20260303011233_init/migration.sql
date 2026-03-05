-- CreateEnum
CREATE TYPE "PerfilUsuario" AS ENUM ('ADMIN', 'RECEPCIONISTA', 'EQUIPE');

-- CreateEnum
CREATE TYPE "StatusAcomodacao" AS ENUM ('DISPONIVEL', 'OCUPADO', 'LIMPEZA', 'MANUTENCAO', 'BLOQUEADO');

-- CreateEnum
CREATE TYPE "TipoAcomodacao" AS ENUM ('STANDARD', 'LUXO', 'SUITE', 'FAMILIA', 'CHALE', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusReserva" AS ENUM ('PENDENTE', 'CONFIRMADA', 'CHECKIN_FEITO', 'CHECKOUT_FEITO', 'CANCELADA');

-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('PIX', 'CARTAO_DEBITO', 'CARTAO_CREDITO', 'DINHEIRO', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('PENDENTE', 'PAGO', 'PARCIAL', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoTarefa" AS ENUM ('LIMPEZA', 'PREPARACAO', 'MANUTENCAO', 'OUTRO');

-- CreateEnum
CREATE TYPE "PrioridadeTarefa" AS ENUM ('URGENTE', 'NORMAL', 'BAIXA');

-- CreateEnum
CREATE TYPE "StatusTarefa" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StatusTicketManutencao" AS ENUM ('ABERTO', 'EM_ANDAMENTO', 'AGUARDANDO_PECA', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoLancamentoFinanceiro" AS ENUM ('RECEITA', 'DESPESA');

-- CreateEnum
CREATE TYPE "CategoriasDespesa" AS ENUM ('FUNCIONARIOS', 'ENERGIA', 'AGUA', 'INTERNET', 'MANUTENCAO', 'AMENIDADES', 'ALIMENTACAO', 'MARKETING', 'IMPOSTOS', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusPlano" AS ENUM ('TRIAL', 'ATIVO', 'INADIMPLENTE', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoPlano" AS ENUM ('BASICO', 'PREMIUM');

-- CreateTable
CREATE TABLE "pousadas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "cnpj" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "cep" TEXT,
    "logoUrl" TEXT,
    "descricao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "plano" "TipoPlano" NOT NULL DEFAULT 'BASICO',
    "statusPlano" "StatusPlano" NOT NULL DEFAULT 'TRIAL',
    "trialExpiraEm" TIMESTAMP(3),
    "pagarmeClientId" TEXT,

    CONSTRAINT "pousadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "pousadaId" TEXT NOT NULL,
    "supabaseId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "perfil" "PerfilUsuario" NOT NULL DEFAULT 'RECEPCIONISTA',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acomodacoes" (
    "id" TEXT NOT NULL,
    "pousadaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoAcomodacao" NOT NULL DEFAULT 'STANDARD',
    "capacidade" INTEGER NOT NULL DEFAULT 2,
    "descricao" TEXT,
    "status" "StatusAcomodacao" NOT NULL DEFAULT 'DISPONIVEL',
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acomodacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloqueios_acomodacao" (
    "id" TEXT NOT NULL,
    "acomodacaoId" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bloqueios_acomodacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospedes" (
    "id" TEXT NOT NULL,
    "pousadaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "cpf" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "endereco" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hospedes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas" (
    "id" TEXT NOT NULL,
    "pousadaId" TEXT NOT NULL,
    "acomodacaoId" TEXT NOT NULL,
    "hospedeId" TEXT NOT NULL,
    "status" "StatusReserva" NOT NULL DEFAULT 'PENDENTE',
    "dataCheckin" TIMESTAMP(3) NOT NULL,
    "dataCheckout" TIMESTAMP(3) NOT NULL,
    "totalHospedes" INTEGER NOT NULL DEFAULT 1,
    "valorTotal" DECIMAL(10,2) NOT NULL,
    "observacoes" TEXT,
    "checkinRealizadoEm" TIMESTAMP(3),
    "checkoutRealizadoEm" TIMESTAMP(3),
    "checkinPorId" TEXT,
    "checkoutPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamentos" (
    "id" TEXT NOT NULL,
    "reservaId" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "formaPagamento" "FormaPagamento" NOT NULL,
    "status" "StatusPagamento" NOT NULL DEFAULT 'PENDENTE',
    "observacoes" TEXT,
    "pagoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extras_reserva" (
    "id" TEXT NOT NULL,
    "reservaId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "extras_reserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarefas" (
    "id" TEXT NOT NULL,
    "pousadaId" TEXT NOT NULL,
    "acomodacaoId" TEXT,
    "reservaId" TEXT,
    "responsavelId" TEXT,
    "tipo" "TipoTarefa" NOT NULL,
    "prioridade" "PrioridadeTarefa" NOT NULL DEFAULT 'NORMAL',
    "status" "StatusTarefa" NOT NULL DEFAULT 'PENDENTE',
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "prazo" TIMESTAMP(3),
    "concluidaEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tarefas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_checklist" (
    "id" TEXT NOT NULL,
    "tarefaId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "itens_checklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_padrao" (
    "id" TEXT NOT NULL,
    "pousadaId" TEXT NOT NULL,
    "tipo" "TipoTarefa" NOT NULL,
    "descricao" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "checklist_padrao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets_manutencao" (
    "id" TEXT NOT NULL,
    "pousadaId" TEXT NOT NULL,
    "acomodacaoId" TEXT NOT NULL,
    "bloqueioId" TEXT,
    "responsavelId" TEXT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "prioridade" "PrioridadeTarefa" NOT NULL DEFAULT 'NORMAL',
    "status" "StatusTicketManutencao" NOT NULL DEFAULT 'ABERTO',
    "fotosUrls" TEXT[],
    "concluidaEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_manutencao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lancamentos_financeiros" (
    "id" TEXT NOT NULL,
    "pousadaId" TEXT NOT NULL,
    "tipo" "TipoLancamentoFinanceiro" NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "categoria" "CategoriasDespesa",
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lancamentos_financeiros_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_supabaseId_key" ON "usuarios"("supabaseId");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_manutencao_bloqueioId_key" ON "tickets_manutencao"("bloqueioId");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_pousadaId_fkey" FOREIGN KEY ("pousadaId") REFERENCES "pousadas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acomodacoes" ADD CONSTRAINT "acomodacoes_pousadaId_fkey" FOREIGN KEY ("pousadaId") REFERENCES "pousadas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloqueios_acomodacao" ADD CONSTRAINT "bloqueios_acomodacao_acomodacaoId_fkey" FOREIGN KEY ("acomodacaoId") REFERENCES "acomodacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospedes" ADD CONSTRAINT "hospedes_pousadaId_fkey" FOREIGN KEY ("pousadaId") REFERENCES "pousadas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_pousadaId_fkey" FOREIGN KEY ("pousadaId") REFERENCES "pousadas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_acomodacaoId_fkey" FOREIGN KEY ("acomodacaoId") REFERENCES "acomodacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_hospedeId_fkey" FOREIGN KEY ("hospedeId") REFERENCES "hospedes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_checkinPorId_fkey" FOREIGN KEY ("checkinPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_checkoutPorId_fkey" FOREIGN KEY ("checkoutPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "reservas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extras_reserva" ADD CONSTRAINT "extras_reserva_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "reservas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_pousadaId_fkey" FOREIGN KEY ("pousadaId") REFERENCES "pousadas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_acomodacaoId_fkey" FOREIGN KEY ("acomodacaoId") REFERENCES "acomodacoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "reservas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_checklist" ADD CONSTRAINT "itens_checklist_tarefaId_fkey" FOREIGN KEY ("tarefaId") REFERENCES "tarefas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_padrao" ADD CONSTRAINT "checklist_padrao_pousadaId_fkey" FOREIGN KEY ("pousadaId") REFERENCES "pousadas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets_manutencao" ADD CONSTRAINT "tickets_manutencao_pousadaId_fkey" FOREIGN KEY ("pousadaId") REFERENCES "pousadas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets_manutencao" ADD CONSTRAINT "tickets_manutencao_acomodacaoId_fkey" FOREIGN KEY ("acomodacaoId") REFERENCES "acomodacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets_manutencao" ADD CONSTRAINT "tickets_manutencao_bloqueioId_fkey" FOREIGN KEY ("bloqueioId") REFERENCES "bloqueios_acomodacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets_manutencao" ADD CONSTRAINT "tickets_manutencao_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lancamentos_financeiros" ADD CONSTRAINT "lancamentos_financeiros_pousadaId_fkey" FOREIGN KEY ("pousadaId") REFERENCES "pousadas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
