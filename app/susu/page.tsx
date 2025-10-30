
import { Metadata } from 'next'
import SusuListClient from '@/components/susu/susu-list-client'

export const metadata: Metadata = {
  title: 'SUSU - Sistema de Ahorro Rotativo',
  description: 'Gestiona tus SUSUs y participa en grupos de ahorro'
}

export default function SusuPage() {
  return <SusuListClient />
}
