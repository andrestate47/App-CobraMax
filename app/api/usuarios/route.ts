

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Solo administradores y supervisores pueden ver la lista de usuarios
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!currentUser || (currentUser.role !== 'ADMINISTRADOR' && currentUser.role !== 'SUPERVISOR')) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    // Obtener el parámetro de rol de la query string
    const { searchParams } = new URL(request.url)
    const roleFilter = searchParams.get('role')

    // Construir el where clause basado en el filtro de rol
    const whereClause: any = {}
    if (roleFilter && roleFilter !== 'all') {
      whereClause.role = roleFilter
    }

    const usuarios = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        numeroRuta: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Formatear datos para compatibilidad con el componente
    const usuariosFormateados = usuarios.map(u => ({
      ...u,
      nombre: u.firstName || u.name || '',
      apellido: u.lastName || ''
    }))

    return NextResponse.json(usuariosFormateados)
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
