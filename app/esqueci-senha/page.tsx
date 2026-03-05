'use client'

import { useState } from 'react'
import { resetPassword } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'

export default function EsqueciSenhaPage() {
    const [isLoading, setIsLoading] = useState(false)

    async function onSubmit(formData: FormData) {
        setIsLoading(true)
        const result = await resetPassword(formData)

        if (result?.error) {
            toast.error(result.error)
            setIsLoading(false)
        } else if (result?.success) {
            toast.success(result.success)
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold tracking-tight">Recuperar Senha</CardTitle>
                    <CardDescription>
                        Digite o e-mail da sua conta. Lhe enviaremos um link seguro para redefinir sua senha.
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
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button className="w-full" type="submit" disabled={isLoading}>
                            {isLoading ? 'Enviando link...' : 'Enviar link de recuperação'}
                        </Button>
                        <div className="text-center text-sm text-muted-foreground">
                            Lembrou sua senha?{' '}
                            <Link href="/login" className="underline underline-offset-4 font-semibold text-primary">
                                Voltar ao login
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
