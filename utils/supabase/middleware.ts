import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Atualiza ativamente a sessão logada do usuário.
    // ISSO é muito importante para manter a segurança do SSR atualizada!
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/cadastro')

    // Rotas restritas que exigem login e redirecionam ao login caso bloqueadas:
    // Colocaremos aqui as rotas que exigem login, ex: /dashboard
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/acomodacoes')

    if (!user && isProtectedRoute) {
        // Sem usuário logado tentando acessar dashboard -> redireciona login
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    if (user && isAuthPage) {
        // Com usuário tentando acessar tela de login -> manda pro dashboard
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    if (user && request.nextUrl.pathname === '/') {
        // Usuário na home root redirecionado ao dashboard
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }


    return supabaseResponse
}
