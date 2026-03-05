'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, BedDouble, LogOut } from 'lucide-react'
import { NAVIGATION_LINKS } from './sidebar'
import { signOut } from '@/actions/auth'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
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

export function Header({ email }: { email?: string }) {
    const pathname = usePathname()

    // Extrai as iniciais do e-mail para o Avatar
    const getInitials = (email?: string) => {
        if (!email) return 'PA'
        return email.substring(0, 2).toUpperCase()
    }

    return (
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 justify-between md:justify-end">
            {/* Mobile Sidebar (Sheet) */}
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Abrir menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col">
                    <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                        <BedDouble className="h-6 w-6" />
                        <span>PousadaApp</span>
                    </Link>
                    <nav className="grid gap-2 mt-6 text-lg font-medium">
                        {NAVIGATION_LINKS.map((link) => {
                            const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
                                        isActive && "bg-muted text-foreground"
                                    )}
                                >
                                    <link.icon className="h-5 w-5" />
                                    {link.text}
                                </Link>
                            )
                        })}
                    </nav>
                </SheetContent>
            </Sheet>

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
        </header>
    )
}
