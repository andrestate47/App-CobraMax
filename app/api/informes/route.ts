
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fechaParam = searchParams.get("fecha")
    
    // Si no se especifica fecha, usar hoy
    const fecha = fechaParam ? new Date(fechaParam) : new Date()
    fecha.setHours(0, 0, 0, 0)
    
    const fechaInicio = new Date(fecha)
    const fechaFin = new Date(fecha)
    fechaFin.setHours(23, 59, 59, 999)

    // Obtener información del cobrador/usuario
    const usuario = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        firstName: true,
        lastName: true,
        phone: true
      }
    })

    // Obtener pagos del día
    const pagos = await prisma.pago.findMany({
      where: {
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      include: {
        prestamo: {
          include: {
            cliente: true
          }
        }
      }
    })

    // Obtener préstamos creados en el día
    const prestamos = await prisma.prestamo.findMany({
      where: {
        createdAt: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      include: {
        cliente: true
      }
    })

    // Obtener todos los préstamos activos
    const prestamosActivos = await prisma.prestamo.findMany({
      where: {
        estado: {
          notIn: ["CANCELADO"]
        }
      }
    })

    // Obtener gastos del día
    const gastos = await prisma.gasto.findMany({
      where: {
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        }
      }
    })

    // Obtener clientes nuevos (creados en el día)
    const clientesNuevos = await prisma.cliente.findMany({
      where: {
        createdAt: {
          gte: fechaInicio,
          lte: fechaFin
        }
      }
    })

    // Obtener clientes visitados (con pagos en el día)
    const clientesVisitadosIds = [...new Set(pagos.map(p => p.prestamo.clienteId))]
    
    // Obtener todos los clientes con préstamos activos
    const clientesConPrestamosActivos = await prisma.cliente.findMany({
      where: {
        prestamos: {
          some: {
            estado: {
              notIn: ["CANCELADO"]
            }
          }
        }
      }
    })

    // Clientes pendientes (con préstamos activos sin pago en el día)
    const clientesPendientes = clientesConPrestamosActivos.filter(
      cliente => !clientesVisitadosIds.includes(cliente.id)
    )

    // Calcular renovaciones (clientes que tienen más de un préstamo)
    const clientesConPrestamos = await prisma.cliente.findMany({
      include: {
        prestamos: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    // Clientes con renovaciones (más de un préstamo)
    const clientesRenovacion = clientesConPrestamos.filter(c => c.prestamos.length > 1)
    
    // Renovaciones realizadas en el día (préstamos creados hoy para clientes que ya tenían préstamos)
    const renovacionesRealizadas = prestamos.filter(p => {
      const cliente = clientesConPrestamos.find(c => c.id === p.clienteId)
      return cliente && cliente.prestamos.length > 1
    })

    // Clientes por renovar (con préstamos próximos a vencer - últimos 5 días)
    const fechaLimiteRenovacion = new Date(fecha)
    fechaLimiteRenovacion.setDate(fechaLimiteRenovacion.getDate() + 5)
    
    const clientesPorRenovar = await prisma.cliente.findMany({
      where: {
        prestamos: {
          some: {
            estado: "ACTIVO",
            fechaFin: {
              lte: fechaLimiteRenovacion
            }
          }
        }
      }
    })

    // Renovaciones pendientes (clientes con préstamos activos que ya vencieron)
    const renovacionesPendientes = await prisma.prestamo.findMany({
      where: {
        estado: "ACTIVO",
        fechaFin: {
          lt: fecha
        }
      }
    })

    // Calcular totales
    const totalCobrado = pagos.reduce((sum, pago) => 
      sum + parseFloat(pago.monto.toString()), 0
    )

    // Calcular mora cobrada (pagos en préstamos vencidos)
    let moraCobrada = 0
    for (const pago of pagos) {
      const prestamo = await prisma.prestamo.findUnique({
        where: { id: pago.prestamoId }
      })
      if (prestamo && prestamo.fechaFin < pago.fecha) {
        // Calcular mora aproximada
        const diasMora = Math.floor(
          (pago.fecha.getTime() - prestamo.fechaFin.getTime()) / (1000 * 60 * 60 * 24)
        )
        const moraPorDia = parseFloat(prestamo.moraCredito.toString())
        moraCobrada += moraPorDia * diasMora
      }
    }

    // Calcular dinero en transferencia (préstamos tipo TRANSFERENCIA)
    const dineroTransferencia = prestamos
      .filter(p => p.tipoCredito === "TRANSFERENCIA")
      .reduce((sum, p) => sum + parseFloat(p.monto.toString()), 0)
    
    // Transferencias realizadas
    const transferenciasRealizadas = prestamos.filter(p => p.tipoCredito === "TRANSFERENCIA").length
    
    // Transferencias pendientes (asumiendo que son préstamos TRANSFERENCIA sin completar)
    const transferenciasPendientes = await prisma.prestamo.count({
      where: {
        tipoCredito: "TRANSFERENCIA",
        estado: "ACTIVO",
        createdAt: {
          gte: fechaInicio,
          lte: fechaFin
        }
      }
    })
    
    const totalPrestado = prestamos.reduce((sum, prestamo) => 
      sum + parseFloat(prestamo.monto.toString()), 0
    )
    
    const totalGastos = gastos.reduce((sum, gasto) => 
      sum + parseFloat(gasto.monto.toString()), 0
    )

    // Obtener saldo inicial (efectivo del día anterior)
    const fechaAnterior = new Date(fecha)
    fechaAnterior.setDate(fechaAnterior.getDate() - 1)
    
    const cierreAnterior = await prisma.cierreDia.findUnique({
      where: { fecha: fechaAnterior }
    })
    
    const saldoInicial = cierreAnterior ? 
      parseFloat(cierreAnterior.saldoEfectivo.toString()) : 0

    // Calcular saldo actual
    const saldoEfectivo = saldoInicial + totalCobrado - totalPrestado - totalGastos

    // Verificar si ya hay un cierre para este día
    const cierreDia = await prisma.cierreDia.findUnique({
      where: { fecha }
    })

    const informe = {
      fecha,
      nombreCobrador: usuario ? `${usuario.firstName} ${usuario.lastName}` : "N/A",
      numeroRuta: usuario?.phone || "N/A",
      totalCobrado,
      moraCobrada,
      dineroTransferencia,
      totalPrestado,
      totalGastos,
      saldoInicial,
      saldoEfectivo,
      cerrado: !!cierreDia,
      cierreId: cierreDia?.id,
      cantidadPagos: pagos.length,
      cantidadPrestamos: prestamos.length,
      cantidadGastos: gastos.length,
      // Resumen de clientes y créditos
      resumenClientes: {
        clientesNuevos: clientesNuevos.length,
        clientesVisitados: clientesVisitadosIds.length,
        clientesPendientes: clientesPendientes.length,
        clientesPorVisitar: clientesConPrestamosActivos.length - clientesVisitadosIds.length
      },
      // Resumen de préstamos
      resumenPrestamos: {
        nuevosPrestamos: prestamos.length,
        prestamosRealizados: prestamosActivos.length
      },
      // Resumen de renovaciones
      resumenRenovaciones: {
        renovacionClientes: clientesRenovacion.length,
        clientesPorRenovar: clientesPorRenovar.length,
        renovacionesPendientes: renovacionesPendientes.length,
        renovacionesRealizadas: renovacionesRealizadas.length
      },
      // Resumen de transferencias
      resumenTransferencias: {
        totalTransferencia: dineroTransferencia,
        transferenciasRealizadas: transferenciasRealizadas,
        transferenciasPendientes: transferenciasPendientes
      },
      detallePagos: pagos.map(pago => ({
        id: pago.id,
        monto: parseFloat(pago.monto.toString()),
        mora: 0, // TODO: Calcular mora si el préstamo estaba vencido
        metodoPago: "EFECTIVO", // TODO: Agregar campo al modelo
        fecha: pago.fecha,
        observaciones: pago.observaciones,
        cliente: {
          nombre: pago.prestamo.cliente.nombre,
          apellido: pago.prestamo.cliente.apellido,
          documento: pago.prestamo.cliente.documento
        }
      })),
      detallePrestamos: prestamos.map(prestamo => ({
        id: prestamo.id,
        monto: parseFloat(prestamo.monto.toString()),
        interes: parseFloat(prestamo.interes.toString()),
        fechaInicio: prestamo.fechaInicio,
        cliente: {
          nombre: prestamo.cliente.nombre,
          apellido: prestamo.cliente.apellido
        }
      })),
      detalleGastos: gastos.map(gasto => ({
        id: gasto.id,
        concepto: gasto.concepto,
        monto: parseFloat(gasto.monto.toString()),
        fecha: gasto.fecha,
        observaciones: gasto.observaciones
      })),
      detalleClientesNuevos: clientesNuevos.map(cliente => ({
        id: cliente.id,
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        documento: cliente.documento
      }))
    }

    return NextResponse.json(informe)
  } catch (error) {
    console.error("Error al obtener informe:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
