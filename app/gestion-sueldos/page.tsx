
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import GestionSueldosClient from "@/components/gestion-sueldos-client"

export default async function GestionSueldosPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect("/auth/login")
  }

  // Verificar permisos - solo administradores y supervisores
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { role: true }
  })

  if (!user || (user.role !== 'ADMINISTRADOR' && user.role !== 'SUPERVISOR')) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <GestionSueldosClient />
    </div>
  )
}
