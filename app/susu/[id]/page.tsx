
import { Metadata } from 'next'
import SusuDetalleClient from '@/components/susu/susu-detalle-client'

export const metadata: Metadata = {
  title: 'Detalle de SUSU',
  description: 'Ver detalles y gestionar pagos del SUSU'
}

export default function SusuDetallePage({ params }: { params: { id: string } }) {
  return <SusuDetalleClient susuId={params.id} />
}
