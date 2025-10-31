
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

    // Solo administradores y supervisores pueden actualizar pagos
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!currentUser || (currentUser.role !== 'ADMINISTRADOR' && currentUser.role !== 'SUPERVISOR')) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const data = await request.json()
    const { 
      estado, 
      fechaPago, 
      metodoPago, 
      comprobante, 
      observaciones,
      montoFinal
    } = data

    const updateData: any = {
      updatedAt: new Date()
    }

    if (estado !== undefined) {
      updateData.estado = estado
      if (estado === 'PAGADO' && !fechaPago) {
        updateData.fechaPago = new Date()
      }
    }

    if (fechaPago) {
      updateData.fechaPago = new Date(fechaPago)
    }

    if (metodoPago !== undefined) {
      updateData.metodoPago = metodoPago
    }

    if (comprobante !== undefined) {
      updateData.comprobante = comprobante
    }

    if (observaciones !== undefined) {
      updateData.observaciones = observaciones
    }

    if (montoFinal !== undefined) {
      if (montoFinal <= 0) {
        return NextResponse.json({ error: "Monto final debe ser mayor a 0" }, { status: 400 })
      }
      updateData.montoFinal = parseFloat(montoFinal)
    }

    const pago = await prisma.pagoSueldo.update({
      where: { id: params.id },
      data: updateData,
      include: {
        cobrador: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        },
        pagador: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        },
        configuracion: true
      }
    })

    return NextResponse.json(pago)
  } catch (error) {
    console.error("Error al actualizar pago de sueldo:", error)
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

    // Solo administradores pueden eliminar pagos
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!currentUser || currentUser.role !== 'ADMINISTRADOR') {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    await prisma.pagoSueldo.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Pago eliminado correctamente" })
  } catch (error) {
    console.error("Error al eliminar pago de sueldo:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
