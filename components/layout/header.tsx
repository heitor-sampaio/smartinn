'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, LogOut } from 'lucide-react'
import { NAVIGATION_LINKS } from './sidebar'
import { PerfilUsuario } from '@prisma/client'
import { signOut } from '@/actions/auth'

import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { AlertsSheet, type AlertsData } from './alerts-sheet'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export function Header({ email, alerts, perfil }: { email?: string; alerts: AlertsData; perfil: PerfilUsuario }) {
    const pathname = usePathname()
    const links = NAVIGATION_LINKS.filter(l => l.roles.includes(perfil))

    const getInitials = (email?: string) => {
        if (!email) return 'SI'
        return email.substring(0, 2).toUpperCase()
    }

    return (
        <header className="flex h-16 items-center gap-4 border-b bg-muted/40 px-4 lg:px-6 justify-between md:justify-end">
            {/* Mobile: menu hambúrguer + logo centralizada */}
            <div className="flex items-center gap-3 md:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="shrink-0">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Abrir menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="flex flex-col p-0 w-72">
                        {/* Header do drawer */}
                        <div className="flex h-16 items-center border-b px-4">
                            <SheetClose asChild>
                                <Link href="/dashboard" className="flex items-center">
                                    <Image
                                        src="/smartinn-logo.png"
                                        alt="SmartInn"
                                        width={120}
                                        height={34}
                                        className="h-7 w-auto object-contain dark:invert"
                                        priority
                                    />
                                </Link>
                            </SheetClose>
                        </div>

                        {/* Links de navegação */}
                        <nav className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto">
                            {links.map((link) => {
                                const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
                                return (
                                    <SheetClose asChild key={link.href}>
                                        <Link
                                            href={link.href}
                                            className={cn(
                                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                                                isActive
                                                    ? "bg-muted text-primary"
                                                    : "text-muted-foreground hover:text-primary hover:bg-muted/50"
                                            )}
                                        >
                                            <link.icon className="h-5 w-5 shrink-0" />
                                            {link.text}
                                        </Link>
                                    </SheetClose>
                                )
                            })}
                        </nav>

                        {/* Footer do drawer */}
                        <div className="border-t p-4 flex items-center justify-center">
                            <Link
                                href="https://www.archlabs.com.br"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="opacity-70 hover:opacity-100 transition-opacity dark:invert"
                            >
                                <img
                                    src="/arch-logo.png"
                                    alt="Arch Sistemas Inteligentes"
                                    className="w-14 h-auto object-contain"
                                />
                            </Link>
                        </div>
                    </SheetContent>
                </Sheet>

                {/* Logo centralizada no header mobile */}
                <Link href="/dashboard">
                    <Image
                        src="/smartinn-logo.png"
                        alt="SmartInn"
                        width={100}
                        height={28}
                        className="h-6 w-auto object-contain dark:invert"
                        priority
                    />
                </Link>
            </div>

            {/* Alertas + Perfil */}
            <div className="flex items-center gap-1">
            <AlertsSheet {...alerts} />

            {/* User Profile Dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback>{getInitials(email)}</AvatarFallback>
                        </Avatar>
                        <span className="sr-only">Minha conta</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                    <DropdownMenuLabel className="text-xs text-muted-foreground font-normal overflow-hidden text-ellipsis max-w-[200px]">
                        {email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href="/dashboard/configuracoes">Configurações</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <form action={signOut} className="w-full">
                            <button type="submit" className="flex w-full items-center text-red-500 font-medium cursor-pointer">
                                <LogOut className="mr-2 h-4 w-4" />
                                Sair
                            </button>
                        </form>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            </div>
        </header>
    )
}
