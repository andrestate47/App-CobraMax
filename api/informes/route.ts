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
        phone: true,
      },
    })

    // Obtener pagos del día
    const pagos = await prisma.pago.findMany({
      where: {
        fecha: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
      include: {
        prestamo: {
          include: {
            cliente: true,
          },
        },
      },
    })

    // Obtener préstamos creados en el día
    const prestamos = await prisma.prestamo.findMany({
      where: {
        createdAt: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
      include: {
        cliente: true,
      },
    })

    // Obtener todos los préstamos activos
    const prestamosActivos = await prisma.prestamo.findMany({
      where: {
        estado: {
          notIn: ["CANCELADO"],
        },
      },
    })

    // Obtener gastos del día
    const gastos = await prisma.gasto.findMany({
      where: {
        fecha: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
    })

    // Obtener clientes nuevos (creados en el día)
    const clientesNuevos = await prisma.cliente.findMany({
      where: {
        createdAt: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
    })

    // Clientes visitados (con pagos en el día)
    const clientesVisitadosIds = [...new Set(pagos.map((p: any) => p.prestamo.clienteId))]

    // Obtener todos los clientes con préstamos activos
    const clientesConPrestamosActivos = await prisma.cliente.findMany({
      where: {
        prestamos: {
          some: {
            estado: {
              notIn: ["CANCELADO"],
            },
          },
        },
      },
    })

    // ✅ Corrección: tipado explícito del parámetro cliente
    const clientesPendientes = clientesConPrestamosActivos.filter(
      (cliente: any) => !clientesVisitadosIds.includes(cliente.id)
    )

    // Calcular renovaciones (clientes que tienen más de un préstamo)
    const clientesConPrestamos = await prisma.cliente.findMany({
      include: {
        prestamos: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    })

    const clientesRenovacion = clientesConPrestamos.filter(
      (c: any) => c.prestamos.length > 1
    )

    const renovacionesRealizadas = prestamos.filter((p: any) => {
      const cliente = clientesConPrestamos.find((c: any) => c.id === p.clienteId)
      return cliente && cliente.prestamos.length > 1
    })

    const fechaLimiteRenovacion = new Date(fecha)
    fechaLimiteRenovacion.setDate(fechaLimiteRenovacion.getDate() + 5)

    const clientesPorRenovar = await prisma.cliente.findMany({
      where: {
        prestamos: {
          some: {
            estado: "ACTIVO",
            fechaFin: {
              lte: fechaLimiteRenovacion,
            },
          },
        },
      },
    })

    const renovacionesPendientes = await prisma.prestamo.findMany({
      where: {
        estado: "ACTIVO",
        fechaFin: {
          lt: fecha,
        },
      },
    })

    const totalCobrado = pagos.reduce(
      (sum: number, pago: any) => sum + parseFloat(pago.monto.toString()),
      0
    )

    let moraCobrada = 0
    for (const pago of pagos) {
      const prestamo = await prisma.prestamo.findUnique({
        where: { id: pago.prestamoId },
      })
      if (prestamo && prestamo.fechaFin < pago.fecha) {
        const diasMora = Math.floor(
          (pago.fecha.getTime() - prestamo.fechaFin.getTime()) /
            (1000 * 60 * 60 * 24)
        )
        const moraPorDia = parseFloat(prestamo.moraCredito.toString())
        moraCobrada += moraPorDia * diasMora
      }
    }

    const dineroTransferencia = prestamos
      .filter((p: any) => p.tipoCredito === "TRANSFERENCIA")
      .reduce((sum: number, p: any) => sum + parseFloat(p.monto.toString()), 0)

    const transferenciasRealizadas = prestamos.filter(
      (p: any) => p.tipoCredito === "TRANSFERENCIA"
    ).length

    const transferenciasPendientes = await prisma.prestamo.count({
      where: {
        tipoCredito: "TRANSFERENCIA",
        estado: "ACTIVO",
        createdAt: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
    })

    const totalPrestado = prestamos.reduce(
      (sum: number, prestamo: any) => sum + parseFloat(prestamo.monto.toString()),
      0
    )

    const totalGastos = gastos.reduce(
      (sum: number, gasto: any) => sum + parseFloat(gasto.monto.toString()),
      0
    )

    const fechaAnterior = new Date(fecha)
    fechaAnterior.setDate(fechaAnterior.getDate() - 1)

    const cierreAnterior = await prisma.cierreDia.findUnique({
      where: { fecha: fechaAnterior },
    })

    const saldoInicial = cierreAnterior
      ? parseFloat(cierreAnterior.saldoEfectivo.toString())
      : 0

    const saldoEfectivo = saldoInicial + totalCobrado - totalPrestado - totalGastos

    const cierreDia = await prisma.cierreDia.findUnique({
      where: { fecha },
    })

    const informe = {
      fecha,
      nombreCobrador: usuario
        ? `${usuario.firstName} ${usuario.lastName}`
        : "N/A",
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
      resumenClientes: {
        clientesNuevos: clientesNuevos.length,
        clientesVisitados: clientesVisitadosIds.length,
        clientesPendientes: clientesPendientes.length,
        clientesPorVisitar:
          clientesConPrestamosActivos.length - clientesVisitadosIds.length,
      },
      resumenPrestamos: {
        nuevosPrestamos: prestamos.length,
        prestamosRealizados: prestamosActivos.length,
      },
      resumenRenovaciones: {
        renovacionClientes: clientesRenovacion.length,
        clientesPorRenovar: clientesPorRenovar.length,
        renovacionesPendientes: renovacionesPendientes.length,
        renovacionesRealizadas: renovacionesRealizadas.length,
      },
      resumenTransferencias: {
        totalTransferencia: dineroTransferencia,
        transferenciasRealizadas,
        transferenciasPendientes,
      },
      detallePagos: pagos.map((pago: any) => ({
        id: pago.id,
        monto: parseFloat(pago.monto.toString()),
        mora: 0,
        metodoPago: "EFECTIVO",
        fecha: pago.fecha,
        observaciones: pago.observaciones,
        cliente: {
          nombre: pago.prestamo.cliente.nombre,
          apellido: pago.prestamo.cliente.apellido,
          documento: pago.prestamo.cliente.documento,
        },
      })),
      detallePrestamos: prestamos.map((prestamo: any) => ({
        id: prestamo.id,
        monto: parseFloat(prestamo.monto.toString()),
        interes: parseFloat(prestamo.interes.toString()),
        fechaInicio: prestamo.fechaInicio,
        cliente: {
          nombre: prestamo.cliente.nombre,
          apellido: prestamo.cliente.apellido,
        },
      })),
      detalleGastos: gastos.map((gasto: any) => ({
        id: gasto.id,
        concepto: gasto.concepto,
        monto: parseFloat(gasto.monto.toString()),
        fecha: gasto.fecha,
        observaciones: gasto.observaciones,
      })),
      detalleClientesNuevos: clientesNuevos.map((cliente: any) => ({
        id: cliente.id,
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        documento: cliente.documento,
      })),
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
