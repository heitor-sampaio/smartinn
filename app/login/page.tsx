'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    async function onSubmit(formData: FormData) {
        setIsLoading(true)
        const result = await signIn(formData)

        if (result?.error) {
            toast.error(result.error)
            setIsLoading(false)
        } else {
            toast.success("Login realizado com sucesso!")
            // O redirect dentro do signIn() de Server Action vai forçar 
            // o Client a redirecionar o usuário pro /dashboard
        }
    }

    return (
        <div className="flex h-screen w-full items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-2">
                        <Image
                            src="/smartinn-logo.png"
                            alt="SmartInn"
                            width={160}
                            height={45}
                            className="h-10 w-auto object-contain"
                            priority
                        />
                    </div>
                    <CardDescription>
                        Entre com suas credenciais para gerenciar sua pousada.
                    </CardDescription>
                </CardHeader>
                <form action={onSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="contato@pousadarosas.com.br"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Senha</Label>
                                <Link href="/esqueci-senha" className="text-sm font-medium text-primary hover:underline underline-offset-4">
                                    Esqueceu a senha?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="******"
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button className="w-full" type="submit" disabled={isLoading}>
                            {isLoading ? 'Entrando...' : 'Entrar'}
                        </Button>
                        <div className="text-center text-sm text-muted-foreground">
                            Não possui uma conta?{' '}
                            <Link href="/cadastro" className="underline underline-offset-4 font-semibold text-primary">
                                Crie sua pousada
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
