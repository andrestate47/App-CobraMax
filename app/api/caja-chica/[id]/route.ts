
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

// PATCH /api/caja-chica/[id] - Aprobar/Rechazar movimiento
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Solo supervisores y administradores pueden aprobar/rechazar
    if (session.user.role === "COBRADOR") {
      return NextResponse.json(
        { error: "No tienes permisos para esta acción" },
        { status: 403 }
      )
    }

    const { estado } = await req.json()
    const movimientoId = params.id

    if (!estado || !["APROBADO", "RECHAZADO"].includes(estado)) {
      return NextResponse.json(
        { error: "Estado inválido" },
        { status: 400 }
      )
    }

    const movimiento = await prisma.movimientoCajaChica.update({
      where: { id: movimientoId },
      data: {
        estado,
        asignadoPorId: session.user.id
      },
      include: {
        cobrador: true,
        asignadoPor: true
      }
    })

    return NextResponse.json(movimiento)
  } catch (error) {
    console.error("Error actualizando movimiento:", error)
    return NextResponse.json(
      { error: "Error actualizando movimiento" },
      { status: 500 }
    )
  }
}
