import { getReservaByToken } from '@/actions/checkin-virtual'
import { CheckinForm } from './checkin-form'
import { AlertCircle } from 'lucide-react'

interface Props {
    params: { token: string }
}

export default async function CheckinPage({ params }: Props) {
    const { token } = params
    const result = await getReservaByToken(token)

    if (result.error || !result.data) {
        return (
            <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center space-y-4">
                    <div className="flex justify-center">
                        <AlertCircle className="h-12 w-12 text-red-500" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">Link inválido</h1>
                    <p className="text-gray-500 text-sm">
                        {result.error || 'Este link de check-in não é válido ou já expirou.'}
                    </p>
                    <p className="text-xs text-gray-400">
                        Se você recebeu este link de uma pousada, entre em contato com a recepção.
                    </p>
                </div>
            </div>
        )
    }

    return <CheckinForm token={token} reserva={result.data} />
}
