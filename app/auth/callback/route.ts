import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const supabase = createClient()

        // Troca o código temporário do e-mail por uma sessão segura via cookies (PKCE)
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Se deu tudo certo, faz um redirecionamento seguro para a página solicitada
            // Ex: /redefinir-senha
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // Se algo der errado (código inválido ou expirado)
    return NextResponse.redirect(`${origin}/login?error=O link expirou ou é invalido.`)
}
