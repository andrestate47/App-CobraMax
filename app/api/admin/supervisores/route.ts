

import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/permissions"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

// GET - Obtener lista de supervisores disponibles
export async function GET(request: NextRequest) {
  try {
    await requireRole('ADMINISTRADOR')

    const supervisores = await prisma.user.findMany({
      where: {
        role: {
          in: ['SUPERVISOR', 'ADMINISTRADOR']
        },
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        email: true,
        role: true,
        _count: {
          select: {
            supervisados: true
          }
        }
      },
      orderBy: {
        firstName: 'asc'
      }
    })

    const supervisoresFormateados = supervisores.map(supervisor => ({
      id: supervisor.id,
      name: supervisor.name || `${supervisor.firstName || ''} ${supervisor.lastName || ''}`.trim(),
      email: supervisor.email,
      role: supervisor.role,
      supervisados: supervisor._count.supervisados
    }))

    return NextResponse.json(supervisoresFormateados)

  } catch (error: any) {
    console.error("Error getting supervisors:", error)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: error.message?.includes('autorizado') ? 401 : 500 }
    )
  }
}

