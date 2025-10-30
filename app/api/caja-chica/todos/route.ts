
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

// GET /api/caja-chica/todos - Obtener todos los movimientos (solo admin/supervisor)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Solo admin y supervisor pueden ver todos los movimientos
    if (!["ADMINISTRADOR", "SUPERVISOR"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "No tienes permisos para esta acción" },
        { status: 403 }
      )
    }

    // Obtener todos los movimientos
    const todosMovimientos = await prisma.movimientoCajaChica.findMany({
      orderBy: {
        fecha: "desc",
      },
      include: {
        cobrador: {
          select: {
            firstName: true,
            lastName: true,
            name: true,
          },
        },
        asignadoPor: {
          select: {
            firstName: true,
            lastName: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(
      todosMovimientos.map((mov) => ({
        id: mov.id,
        tipo: mov.tipo,
        monto: mov.monto.toNumber(),
        descripcion: mov.descripcion,
        fecha: mov.fecha.toISOString(),
        estado: mov.estado,
        cobradorId: mov.cobradorId,
        cobrador: {
          nombre: mov.cobrador.firstName || mov.cobrador.name || "",
          apellido: mov.cobrador.lastName || "",
        },
        asignadoPorId: mov.asignadoPorId,
        asignadoPor: mov.asignadoPor ? {
          nombre: mov.asignadoPor.firstName || mov.asignadoPor.name || "",
          apellido: mov.asignadoPor.lastName || "",
        } : undefined,
      }))
    )
  } catch (error) {
    console.error("Error al obtener todos los movimientos:", error)
    return NextResponse.json(
      { error: "Error al obtener movimientos" },
      { status: 500 }
    )
  }
}
