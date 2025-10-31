

import { Metadata } from "next"
import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import AdminUsuarios from "@/components/admin-usuarios"
import { ArrowLeft, Home, Shield } from "lucide-react"

export const metadata: Metadata = {
  title: "Gestión de Usuarios - B.&.D.S.C",
  description: "Panel de administración para gestionar usuarios, roles y permisos",
}

export default function AdminUsuariosPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navegación y Breadcrumbs */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Link href="/dashboard" className="hover:text-primary transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">Gestión de Usuarios</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard" className="flex items-center">
                  <Home className="h-4 w-4 mr-2" />
                  Inicio
                </Link>
              </Button>
            </div>
          </div>

          {/* Botón de regreso prominente */}
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild className="text-gray-600 hover:text-gray-900">
              <Link href="/dashboard" className="flex items-center">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Link>
            </Button>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
              <p className="text-lg text-gray-600">
                Administra usuarios, roles, permisos y configuraciones del sistema
              </p>
            </div>
          </div>
        </div>
        
        <Suspense fallback={
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }>
          <AdminUsuarios />
        </Suspense>
      </div>
    </div>
  )
}

