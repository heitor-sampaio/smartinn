import { getReservaFichaByToken } from '@/actions/checkin-virtual'
import { FichaClient } from './ficha-client'

export default async function FichaPage({ params }: { params: { token: string } }) {
    const result = await getReservaFichaByToken(params.token)

    if (result.error || !result.data) {
        return (
            <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center space-y-3">
                    <p className="text-lg font-semibold text-gray-800">Reserva não encontrada</p>
                    <p className="text-sm text-muted-foreground">{result.error}</p>
                </div>
            </div>
        )
    }

    return <FichaClient token={params.token} reserva={result.data} />
}
