/*
  Warnings:

  - The values [RECEITA,DESPESA] on the enum `TipoLancamentoFinanceiro` will be removed. If these variants are still used in the database, this will fail.
  - The `categoria` column on the `lancamentos_financeiros` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "CategoriaFinanceira" AS ENUM ('HOSPEDAGEM', 'CONSUMO', 'FUNCIONARIOS', 'ENERGIA', 'AGUA', 'INTERNET', 'MANUTENCAO', 'AMENIDADES', 'ALIMENTACAO', 'MARKETING', 'IMPOSTOS', 'OUTRO');

-- AlterEnum
BEGIN;
CREATE TYPE "TipoLancamentoFinanceiro_new" AS ENUM ('ENTRADA', 'SAIDA');
ALTER TABLE "lancamentos_financeiros" ALTER COLUMN "tipo" TYPE "TipoLancamentoFinanceiro_new" USING ("tipo"::text::"TipoLancamentoFinanceiro_new");
ALTER TYPE "TipoLancamentoFinanceiro" RENAME TO "TipoLancamentoFinanceiro_old";
ALTER TYPE "TipoLancamentoFinanceiro_new" RENAME TO "TipoLancamentoFinanceiro";
DROP TYPE "TipoLancamentoFinanceiro_old";
COMMIT;

-- AlterTable
ALTER TABLE "acomodacoes" ADD COLUMN     "caracteristicas" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "valorDiaria" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "lancamentos_financeiros" ADD COLUMN     "reservaId" TEXT,
DROP COLUMN "categoria",
ADD COLUMN     "categoria" "CategoriaFinanceira";

-- AlterTable
ALTER TABLE "pousadas" ADD COLUMN     "corTema" TEXT DEFAULT 'zinc',
ADD COLUMN     "horaCheckin" TEXT NOT NULL DEFAULT '14:00',
ADD COLUMN     "horaCheckout" TEXT NOT NULL DEFAULT '12:00',
ADD COLUMN     "inscricaoEstadual" TEXT,
ADD COLUMN     "taxaCartao" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- DropEnum
DROP TYPE "CategoriasDespesa";

-- AddForeignKey
ALTER TABLE "lancamentos_financeiros" ADD CONSTRAINT "lancamentos_financeiros_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "reservas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
