# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start Next.js dev server on localhost:3000
npm run build        # Production build
npm run lint         # ESLint check

# Database
npx prisma migrate dev --name <name>   # Create and apply a new migration
npx prisma generate                    # Regenerate Prisma client after schema changes
npx prisma studio                      # Open Prisma Studio GUI
node prisma/seed.js                    # Seed the database
```

## Architecture

**SmartInn** is a multi-tenant pousada (inn/hotel) management SaaS built with Next.js 14 App Router, Prisma ORM (PostgreSQL), and Supabase for authentication.

### Data Flow Pattern

Every feature follows the same pattern:
1. `app/dashboard/<section>/page.tsx` — Server Component that fetches data via Server Actions and passes it as props
2. `app/dashboard/<section>/<section>-client.tsx` — Client Component that owns all interactive UI (dialogs, forms, state)
3. `actions/<section>.ts` — Server Actions with `'use server'` that talk to Prisma

**Important serialization rule**: Prisma `Decimal` types must be cast to `Number` and `Date` objects to ISO strings before returning from Server Actions to Client Components. See `actions/reservas.ts` for the pattern.

### Auth & Multi-tenancy

- **Dashboard auth**: `lib/auth.ts` exports `requireAuth()` — a React-cached Server Action that validates Supabase session and returns `{ user, usuarioId, pousadaId, perfil }`. All data queries are scoped to `pousadaId`.
- **Dashboard layout** (`app/dashboard/layout.tsx`): Also validates the session and redirects to `/login` if unauthenticated.
- **Equipe (team) portal** (`app/equipe/[pousadaId]/`): Separate passwordless area for cleaning/operations staff. Uses cookie-based auth (`equipe_auth_<pousadaId>`), no Supabase. Accessed via `Pousada.linkEquipe` UUID.

### Key Directories

| Path | Purpose |
|------|---------|
| `actions/` | All Server Actions (data fetching + mutations) |
| `app/dashboard/` | Owner/admin dashboard (9 sections) |
| `app/equipe/[pousadaId]/` | Team portal (task management for staff) |
| `components/ui/` | shadcn/ui component library |
| `components/layout/` | Sidebar and Header |
| `lib/auth.ts` | `requireAuth()` — cached auth helper |
| `lib/prisma.ts` | Prisma client singleton |
| `utils/supabase/` | Supabase client factories (client/server/middleware) |
| `prisma/schema.prisma` | Database schema |

### Database Schema Summary

Central entity is `Pousada` (the inn). All records belong to a pousada. Key models:
- `Usuario` — staff linked to a Supabase auth user via `supabaseId`; roles: `ADMIN | RECEPCIONISTA | EQUIPE`
- `Acomodacao` — rooms/units with dynamic pricing fields
- `Reserva` — bookings linking `Hospede` + `Acomodacao`, with `Pagamento` and `ExtraReserva` (consumption)
- `Tarefa` — housekeeping/maintenance tasks shown in the team portal
- `LancamentoFinanceiro` — financial ledger entries, supports recurring expenses via `recorrenciaGrupoId`
- `TicketManutencao` — maintenance tickets that can block an accommodation

### Environment Variables

Required in `.env`:
- `DATABASE_URL` — Prisma connection URL (pooled)
- `DIRECT_URL` — Prisma direct URL (for migrations)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
