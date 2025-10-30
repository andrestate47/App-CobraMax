
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { registrarEliminacion } from "@/lib/auditoria"
import { TipoEntidad } from "@prisma/client"

// PUT /api/prestamos/[id] - Editar préstamo
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const prestamoId = params.id
    const body = await request.json()
    const { monto, interes, tipoPago, cuotas, fechaInicio, observaciones } = body

    // Validaciones básicas
    if (!monto || !interes || !tipoPago || !cuotas || !fechaInicio) {
      return NextResponse.json(
        { error: "Todos los campos obligatorios son requeridos" },
        { status: 400 }
      )
    }

    const montoNum = parseFloat(monto)
    const interesNum = parseFloat(interes)
    const cuotasNum = parseInt(cuotas)

    if (montoNum <= 0 || interesNum < 0 || cuotasNum <= 0) {
      return NextResponse.json(
        { error: "Los valores deben ser válidos y positivos" },
        { status: 400 }
      )
    }

    // Verificar que el préstamo existe
    const prestamoExistente = await prisma.prestamo.findUnique({
      where: { id: prestamoId },
      include: {
        pagos: true,
        cliente: true
      }
    })

    if (!prestamoExistente) {
      return NextResponse.json({ error: "Préstamo no encontrado" }, { status: 404 })
    }

    // Calcular nueva fecha de fin y valor de cuota
    const fechaInicioDate = new Date(fechaInicio)
    let fechaFin = new Date(fechaInicioDate)
    
    // Calcular fecha de fin basada en tipo de pago y número de cuotas
    const diasPorTipo = {
      'DIARIO': 1,
      'SEMANAL': 7,
      'QUINCENAL': 15,
      'FIN_DE_MES': 30,
      'MENSUAL': 30,
      'TRIMESTRAL': 90,
      'SEMESTRAL': 180,
      'ANUAL': 365
    }

    const diasTotal = (diasPorTipo[tipoPago as keyof typeof diasPorTipo] || 1) * cuotasNum
    fechaFin.setDate(fechaFin.getDate() + diasTotal)

    // Calcular nuevo valor de cuota
    const montoTotal = montoNum * (1 + interesNum / 100)
    const valorCuota = montoTotal / cuotasNum

    // Actualizar préstamo
    const prestamoActualizado = await prisma.prestamo.update({
      where: { id: prestamoId },
      data: {
        monto: montoNum,
        interes: interesNum,
        tipoPago,
        cuotas: cuotasNum,
        fechaInicio: fechaInicioDate,
        fechaFin,
        valorCuota,
        observaciones: observaciones || null,
        // No cambiar la fecha de creación ni el usuario
      },
      include: {
        cliente: true,
        pagos: true,
        usuario: {
          select: {
            firstName: true,
            lastName: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      message: "Préstamo actualizado exitosamente",
      prestamo: prestamoActualizado
    })

  } catch (error) {
    console.error("Error al actualizar préstamo:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor" 
    }, { 
      status: 500 
    })
  }
}

// DELETE /api/prestamos/[id] - Eliminar préstamo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const prestamoId = params.id

    // Verificar que el préstamo existe
    const prestamoExistente = await prisma.prestamo.findUnique({
      where: { id: prestamoId },
      include: {
        pagos: true,
        cliente: {
          select: {
            nombre: true,
            apellido: true,
            codigoCliente: true
          }
        }
      }
    })

    if (!prestamoExistente) {
      return NextResponse.json({ error: "Préstamo no encontrado" }, { status: 404 })
    }

    // Obtener información del usuario que elimina
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true }
    })

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Registrar en auditoría solo si NO es administrador
    if (usuario.role !== 'ADMINISTRADOR') {
      await registrarEliminacion(
        usuario.id,
        TipoEntidad.PRESTAMO,
        prestamoId,
        {
          cliente: `${prestamoExistente.cliente.nombre} ${prestamoExistente.cliente.apellido}`,
          codigoCliente: prestamoExistente.cliente.codigoCliente,
          monto: prestamoExistente.monto.toString(),
          interes: prestamoExistente.interes.toString(),
          cuotas: prestamoExistente.cuotas,
          valorCuota: prestamoExistente.valorCuota.toString(),
          fechaInicio: prestamoExistente.fechaInicio,
          fechaFin: prestamoExistente.fechaFin,
          estado: prestamoExistente.estado,
          pagosEliminados: prestamoExistente.pagos.length
        },
        request
      )
    }

    // Eliminar préstamo y todos sus pagos relacionados (cascada)
    // Con la configuración onDelete: Cascade, los pagos se eliminan automáticamente
    await prisma.prestamo.delete({
      where: { id: prestamoId }
    })

    return NextResponse.json({ 
      message: "Préstamo eliminado exitosamente",
      deletedId: prestamoId,
      deletedPayments: prestamoExistente.pagos.length
    })

  } catch (error) {
    console.error("Error al eliminar préstamo:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor" 
    }, { 
      status: 500 
    })
  }
}
