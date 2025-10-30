
import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/permissions"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

// GET - Obtener registros de auditoría
export async function GET(request: NextRequest) {
  try {
    await requireRole('ADMINISTRADOR')

    const { searchParams } = new URL(request.url)
    const entidad = searchParams.get('entidad')
    const usuarioId = searchParams.get('usuarioId')
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {
      accion: 'ELIMINAR' // Solo mostrar eliminaciones
    }

    if (entidad) {
      where.entidad = entidad
    }

    if (usuarioId) {
      where.usuarioId = usuarioId
    }

    if (desde || hasta) {
      where.fecha = {}
      if (desde) {
        where.fecha.gte = new Date(desde)
      }
      if (hasta) {
        where.fecha.lte = new Date(hasta)
      }
    }

    const [registros, total] = await Promise.all([
      prisma.registroAuditoria.findMany({
        where,
        orderBy: { fecha: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          usuarioId: true,
          accion: true,
          entidad: true,
          entidadId: true,
          detalles: true,
          ipAddress: true,
          userAgent: true,
          fecha: true,
        }
      }),
      prisma.registroAuditoria.count({ where })
    ])

    // Obtener información de usuarios
    const usuarioIds = [...new Set(registros.map(r => r.usuarioId))]
    const usuarios = await prisma.user.findMany({
      where: { id: { in: usuarioIds } },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        role: true
      }
    })

    const usuariosMap = new Map(usuarios.map(u => [u.id, u]))

    const registrosConUsuario = registros.map(r => ({
      ...r,
      usuario: usuariosMap.get(r.usuarioId),
      detalles: r.detalles ? JSON.parse(r.detalles) : null
    }))

    return NextResponse.json({
      registros: registrosConUsuario,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error: any) {
    console.error("Error getting audit logs:", error)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: error.message?.includes('autorizado') ? 401 : 500 }
    )
  }
}
