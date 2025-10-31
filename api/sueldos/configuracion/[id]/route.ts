
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Solo administradores y supervisores pueden actualizar configuraciones
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!currentUser || (currentUser.role !== 'ADMINISTRADOR' && currentUser.role !== 'SUPERVISOR')) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const data = await request.json()
    const { salarioBase, comisionPorCobro, limitePorcentajeAvance, montoMinimoAvance, activo } = data

    // Validaciones
    if (salarioBase !== undefined && salarioBase < 0) {
      return NextResponse.json({ error: "Salario base debe ser mayor a 0" }, { status: 400 })
    }

    if (comisionPorCobro !== undefined && (comisionPorCobro < 0 || comisionPorCobro > 100)) {
      return NextResponse.json({ error: "Comisión debe estar entre 0 y 100%" }, { status: 400 })
    }

    if (limitePorcentajeAvance !== undefined && (limitePorcentajeAvance < 0 || limitePorcentajeAvance > 100)) {
      return NextResponse.json({ error: "Límite de avance debe estar entre 0 y 100%" }, { status: 400 })
    }

    const configuracion = await prisma.configuracionSueldo.update({
      where: { id: params.id },
      data: {
        ...(salarioBase !== undefined && { salarioBase: parseFloat(salarioBase) }),
        ...(comisionPorCobro !== undefined && { comisionPorCobro: parseFloat(comisionPorCobro) }),
        ...(limitePorcentajeAvance !== undefined && { limitePorcentajeAvance: parseInt(limitePorcentajeAvance) }),
        ...(montoMinimoAvance !== undefined && { montoMinimoAvance: parseFloat(montoMinimoAvance) }),
        ...(activo !== undefined && { activo }),
        updatedAt: new Date()
      },
      include: {
        usuario: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json(configuracion)
  } catch (error) {
    console.error("Error al actualizar configuración de sueldo:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Solo administradores pueden eliminar configuraciones
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!currentUser || currentUser.role !== 'ADMINISTRADOR') {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    await prisma.configuracionSueldo.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Configuración eliminada correctamente" })
  } catch (error) {
    console.error("Error al eliminar configuración de sueldo:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
