'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Users,
    CalendarDays,
    Settings,
    ClipboardList,
    CircleDollarSign,
    LineChart,
    Package,
    BedDouble,
    HelpCircle
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { PerfilUsuario } from '@prisma/client'

export const NAVIGATION_LINKS = [
    { text: 'Painel', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'RECEPCIONISTA'] as PerfilUsuario[] },
    { text: 'Reservas', href: '/dashboard/reservas', icon: CalendarDays, roles: ['ADMIN', 'RECEPCIONISTA'] as PerfilUsuario[] },
    { text: 'Indicadores', href: '/dashboard/indicadores', icon: LineChart, roles: ['ADMIN'] as PerfilUsuario[] },
    { text: 'Hóspedes', href: '/dashboard/hospedes', icon: Users, roles: ['ADMIN', 'RECEPCIONISTA'] as PerfilUsuario[] },
    { text: 'Financeiro', href: '/dashboard/financeiro', icon: CircleDollarSign, roles: ['ADMIN'] as PerfilUsuario[] },
    { text: 'Tarefas e Manutenção', href: '/dashboard/tarefas', icon: ClipboardList, roles: ['ADMIN', 'RECEPCIONISTA', 'EQUIPE'] as PerfilUsuario[] },
    { text: 'Acomodações', href: '/dashboard/acomodacoes', icon: BedDouble, roles: ['ADMIN', 'RECEPCIONISTA'] as PerfilUsuario[] },
    { text: 'Produtos e Serviços', href: '/dashboard/produtos', icon: Package, roles: ['ADMIN', 'RECEPCIONISTA'] as PerfilUsuario[] },
    { text: 'Configurações', href: '/dashboard/configuracoes', icon: Settings, roles: ['ADMIN'] as PerfilUsuario[] },
    { text: 'Ajuda', href: '/dashboard/ajuda', icon: HelpCircle, roles: ['ADMIN', 'RECEPCIONISTA', 'EQUIPE'] as PerfilUsuario[] },
]

export function Sidebar({ perfil }: { perfil: PerfilUsuario }) {
    const pathname = usePathname()
    const links = NAVIGATION_LINKS.filter(l => l.roles.includes(perfil))

    return (
        <div className="hidden border-r bg-muted/40 md:flex md:flex-col min-h-screen">
            <div className="flex h-16 items-center border-b px-4 lg:px-6">
                <Link href="/dashboard" className="flex items-center">
                    <Image
                        src="/smartinn-logo.png"
                        alt="SmartInn"
                        width={105}
                        height={30}
                        className="h-7 w-auto object-contain dark:invert"
                        priority
                    />
                </Link>
            </div>
            <div className="flex-1">
                <nav className="grid items-start px-2 py-4 text-sm font-medium lg:px-4 gap-1">
                    {links.map((link) => {
                        const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                                    isActive
                                        ? "bg-muted text-primary"
                                        : "text-muted-foreground hover:text-primary"
                                )}
                            >
                                <link.icon className="h-4 w-4" />
                                {link.text}
                            </Link>
                        )
                    })}
                </nav>
            </div>
            <div className="mt-auto border-t p-4 flex items-center justify-center">
                <Link
                    href="https://www.archlabs.com.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-70 hover:opacity-100 transition-opacity dark:invert"
                >
                    <img
                        src="/arch-logo.png"
                        alt="Arch Sistemas Inteligentes"
                        className="w-16 h-auto object-contain"
                    />
                </Link>
            </div>
        </div>
    )
}
