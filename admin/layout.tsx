

import { ReactNode } from "react"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Shield } from "lucide-react"

interface AdminLayoutProps {
  children: ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getServerSession(authOptions)
  
  // Verificar si hay sesión
  if (!session) {
    redirect('/login')
  }
  
  // Verificar si es administrador
  if (session.user.role !== 'ADMINISTRADOR') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Acceso Denegado</h3>
            <p className="text-red-600 mb-4">
              Solo los administradores pueden acceder a este panel
            </p>
            <a
              href="/dashboard"
              className="inline-block bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              Ir al Dashboard
            </a>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return <>{children}</>
}

