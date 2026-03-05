'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { signUp } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'

export default function CadastroPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    async function onSubmit(formData: FormData) {
        setIsLoading(true)
        const result = await signUp(formData)

        if (result?.error) {
            toast.error(result.error)
            setIsLoading(false)
        } else if (result?.success) {
            router.push(`/verificar-email?email=${encodeURIComponent(formData.get('email') as string)}`)
        }
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
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
                    <CardTitle className="text-2xl font-bold tracking-tight">Criar Conta</CardTitle>
                    <CardDescription>
                        Experimente o SmartInn por 30 dias gratuitamente.
                    </CardDescription>
                </CardHeader>
                <form action={onSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="nomePousada">Nome da Pousada</Label>
                            <Input
                                id="nomePousada"
                                name="nomePousada"
                                placeholder="Ex Pousada das Rosas"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="nomeUsuario">Seu Nome (Administrador)</Label>
                            <Input
                                id="nomeUsuario"
                                name="nomeUsuario"
                                placeholder="Maria da Silva"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail Profissional</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="maria@pousadarosas.com.br"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Criar Senha</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Mínimo de 6 caracteres"
                                required
                                minLength={6}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button className="w-full" type="submit" disabled={isLoading}>
                            {isLoading ? 'Configurando Pousada...' : 'Finalizar Cadastro'}
                        </Button>
                        <div className="text-center text-sm text-muted-foreground">
                            Já tem uma conta?{' '}
                            <Link href="/login" className="underline underline-offset-4 font-semibold text-primary">
                                Faça login
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
