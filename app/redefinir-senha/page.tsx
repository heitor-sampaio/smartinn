'use client'

import { useState } from 'react'
import { updatePassword } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'

export default function RedefinirSenhaPage() {
    const [isLoading, setIsLoading] = useState(false)

    async function onSubmit(formData: FormData) {
        setIsLoading(true)
        const result = await updatePassword(formData)

        // Se a API não jogar pro Dashboard significa que deu erro
        if (result?.error) {
            toast.error(result.error)
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold tracking-tight">Nova Senha</CardTitle>
                    <CardDescription>
                        Sua identidade foi verificada. Digite uma nova forte para sua Pousada.
                    </CardDescription>
                </CardHeader>
                <form action={onSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Nova Senha</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="No mínimo 6 caracteres"
                                required
                                minLength={6}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button className="w-full" type="submit" disabled={isLoading}>
                            {isLoading ? 'Salvando...' : 'Salvar Nova Senha'}
                        </Button>
                        <div className="text-center text-sm text-muted-foreground">
                            <Link href="/login" className="underline underline-offset-4 font-normal text-muted-foreground hover:text-primary">
                                Cancelar e voltar ao login
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
