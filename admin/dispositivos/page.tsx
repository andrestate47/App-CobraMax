
import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DispositivosClient from './dispositivos-client'

export default async function DispositivosPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMINISTRADOR') {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Suspense fallback={<div>Cargando...</div>}>
        <DispositivosClient />
      </Suspense>
    </div>
  )
}
