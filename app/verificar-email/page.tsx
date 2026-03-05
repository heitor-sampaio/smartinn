import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MailCheck } from 'lucide-react'

export default function VerificarEmailPage({
    searchParams,
}: {
    searchParams: { email?: string }
}) {
    const email = searchParams.email

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md shadow-lg text-center">
                <CardHeader className="space-y-4 pt-8">
                    <div className="flex justify-center">
                        <Image
                            src="/smartinn-logo.png"
                            alt="SmartInn"
                            width={160}
                            height={45}
                            className="h-10 w-auto object-contain"
                            priority
                        />
                    </div>
                    <div className="flex justify-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                            <MailCheck className="h-10 w-10 text-primary" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold tracking-tight">Confirme seu e-mail</h1>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Enviamos um link de confirmação para
                        </p>
                        {email && (
                            <p className="font-semibold text-primary break-all">
                                {email}
                            </p>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="space-y-4 px-8">
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                        <p className="font-semibold mb-1">⚠️ Ação necessária antes do login</p>
                        <p>
                            Clique no link enviado para o seu e-mail para ativar sua conta.
                            Sem essa confirmação, não será possível acessar o sistema.
                        </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Não encontrou o e-mail? Verifique a pasta de <strong>spam</strong> ou lixo eletrônico.
                    </p>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 pb-8 px-8">
                    <Button asChild className="w-full">
                        <Link href="/login">
                            Já confirmei, ir para o login
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
