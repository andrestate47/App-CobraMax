

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { monto, interes, tipoPago, cuotas, fechaInicio, observaciones } = body

    // Validar campos obligatorios
    if (!monto || !interes || !cuotas || !fechaInicio) {
      return NextResponse.json(
        { error: "Todos los campos obligatorios deben ser completados" },
        { status: 400 }
      )
    }

    // Verificar que el préstamo existe y está activo
    const prestamoAnterior = await prisma.prestamo.findUnique({
      where: { id },
      include: {
        cliente: true,
        pagos: true
      }
    })

    if (!prestamoAnterior) {
      return NextResponse.json(
        { error: "Préstamo no encontrado" },
        { status: 404 }
      )
    }

    if (prestamoAnterior.estado !== "ACTIVO") {
      return NextResponse.json(
        { error: "Solo se pueden renovar préstamos activos" },
        { status: 400 }
      )
    }

    // Calcular saldo pendiente del préstamo anterior
    const totalPagado = prestamoAnterior.pagos.reduce((sum, pago) => 
      sum + parseFloat(pago.monto.toString()), 0)
    const montoOriginal = parseFloat(prestamoAnterior.monto.toString())
    const tasaInteres = parseFloat(prestamoAnterior.interes.toString()) / 100
    const montoTotalAnterior = montoOriginal * (1 + tasaInteres)
    const saldoPendiente = Math.max(0, montoTotalAnterior - totalPagado)

    // Validar valores numéricos
    const montoNuevo = parseFloat(monto.toString())
    const interesNuevo = parseFloat(interes.toString())
    const cuotasNuevas = parseInt(cuotas.toString())

    if (montoNuevo <= 0 || interesNuevo < 0 || cuotasNuevas <= 0) {
      return NextResponse.json(
        { error: "Los valores deben ser válidos y positivos" },
        { status: 400 }
      )
    }

    // El monto efectivo del nuevo préstamo es el monto nuevo menos el saldo pendiente
    const montoEfectivo = montoNuevo - saldoPendiente
    
    if (montoEfectivo <= 0) {
      return NextResponse.json(
        { error: "El monto de renovación debe ser mayor al saldo pendiente" },
        { status: 400 }
      )
    }

    // Calcular fechas
    const fechaInicioDate = new Date(fechaInicio)
    const fechaFin = new Date(fechaInicioDate)
    
    // Agregar días según el tipo de pago
    const diasPorCuota = {
      'DIARIO': 1,
      'SEMANAL': 7,
      'LUNES_A_VIERNES': 1,     // Pago diario de lunes a viernes
      'LUNES_A_SABADO': 1,      // Pago diario de lunes a sábado
      'QUINCENAL': 15,
      'CATORCENAL': 14,         // Cada 14 días
      'FIN_DE_MES': 30,
      'MENSUAL': 30,
      'TRIMESTRAL': 90,
      'CUATRIMESTRAL': 120,     // Cada 4 meses
      'SEMESTRAL': 180,
      'ANUAL': 365
    }
    
    const dias = (diasPorCuota[tipoPago as keyof typeof diasPorCuota] || 1) * cuotasNuevas
    fechaFin.setDate(fechaFin.getDate() + dias)

    // Calcular valor de cuota
    const montoConInteres = montoNuevo * (1 + interesNuevo / 100)
    const valorCuota = montoConInteres / cuotasNuevas

    // Usar transacción para marcar el préstamo anterior como renovado y crear el nuevo
    const resultado = await prisma.$transaction(async (tx) => {
      // Marcar préstamo anterior como RENOVADO
      await tx.prestamo.update({
        where: { id },
        data: { 
          estado: "RENOVADO",
          observaciones: prestamoAnterior.observaciones 
            ? `${prestamoAnterior.observaciones} | RENOVADO el ${new Date().toISOString().split('T')[0]}`
            : `RENOVADO el ${new Date().toISOString().split('T')[0]}`
        }
      })

      // Crear nuevo préstamo
      const nuevoPrestamo = await tx.prestamo.create({
        data: {
          clienteId: prestamoAnterior.clienteId,
          userId: session.user.id,
          monto: montoNuevo,
          interes: interesNuevo,
          tipoPago: tipoPago as 'DIARIO' | 'SEMANAL' | 'LUNES_A_VIERNES' | 'LUNES_A_SABADO' | 'QUINCENAL' | 'CATORCENAL' | 'FIN_DE_MES' | 'MENSUAL' | 'TRIMESTRAL' | 'CUATRIMESTRAL' | 'SEMESTRAL' | 'ANUAL',
          cuotas: cuotasNuevas,
          valorCuota: valorCuota,
          fechaInicio: fechaInicioDate,
          fechaFin: fechaFin,
          estado: "ACTIVO",
          observaciones: observaciones 
            ? `RENOVACIÓN de ${prestamoAnterior.id} | ${observaciones}`
            : `RENOVACIÓN de ${prestamoAnterior.id}`
        },
        include: {
          cliente: true
        }
      })

      // Si había saldo pendiente, registrar un pago automático en el nuevo préstamo
      if (saldoPendiente > 0) {
        await tx.pago.create({
          data: {
            prestamoId: nuevoPrestamo.id,
            userId: session.user.id,
            monto: saldoPendiente,
            observaciones: `Descuento por saldo pendiente del préstamo anterior ${prestamoAnterior.id}`,
            fecha: new Date()
          }
        })
      }

      return nuevoPrestamo
    })

    return NextResponse.json({
      message: "Préstamo renovado exitosamente",
      prestamoAnterior: {
        id: prestamoAnterior.id,
        saldoPendiente: saldoPendiente
      },
      prestamoNuevo: {
        id: resultado.id,
        monto: parseFloat(resultado.monto.toString()),
        interes: parseFloat(resultado.interes.toString()),
        cuotas: resultado.cuotas,
        valorCuota: parseFloat(resultado.valorCuota.toString()),
        fechaInicio: resultado.fechaInicio,
        fechaFin: resultado.fechaFin,
        estado: resultado.estado,
        montoEfectivo: montoEfectivo,
        descuentoAplicado: saldoPendiente,
        cliente: {
          id: resultado.cliente.id,
          codigoCliente: resultado.cliente.codigoCliente,
          documento: resultado.cliente.documento,
          nombre: resultado.cliente.nombre,
          apellido: resultado.cliente.apellido,
          direccionCliente: resultado.cliente.direccionCliente,
          direccionCobro: resultado.cliente.direccionCobro,
          telefono: resultado.cliente.telefono
        }
      }
    })

  } catch (error) {
    console.error("Error al renovar préstamo:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

