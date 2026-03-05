import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
    // A cada request interceptado pelo Next.js (das rotas configuradas no matcher)
    // chamaremos a função updateSession do nosso utils de SSR
    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Intercepta qualquer requisição EXCETO as estáticas, de imagens (svg, png)
         * e scripts do lado do cliente (_next).
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
