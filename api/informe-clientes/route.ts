import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get("fecha") || new Date().toISOString().split("T")[0]

    const fechaInicio = new Date(fecha)
    fechaInicio.setHours(0, 0, 0, 0)
    const fechaFin = new Date(fecha)
    fechaFin.setHours(23, 59, 59, 999)

    // Obtener pagos del día
    const pagos = await prisma.pago.findMany({
      where: { fecha: { gte: fechaInicio, lte: fechaFin } },
      include: {
        prestamo: {
          include: {
            cliente: { select: { id: true, nombre: true, apellido: true } },
          },
        },
      },
    })

    // ✅ Corrección: tipado explícito de 'p'
    const clientesVisitadosIds = [...new Set(pagos.map((p: any) => p.prestamo.clienteId))]

    // Obtener todos los clientes con préstamos activos
    const clientesConPrestamosActivos = await prisma.cliente.findMany({
      where: {
        activo: true,
        prestamos: { some: { estado: "ACTIVO" } },
      },
      include: {
        prestamos: {
          where: { estado: "ACTIVO" },
          include: {
            pagos: { select: { monto: true, fecha: true } },
          },
        },
      },
    })

    // Calcular métricas
    const totalClientes = clientesConPrestamosActivos.length
    const totalPrestamosActivos = clientesConPrestamosActivos.reduce(
      (sum: number, c: any) => sum + c.prestamos.length,
      0
    )

    const totalCobradoHoy = pagos.reduce(
      (sum: number, p: any) => sum + Number(p.monto),
      0
    )

    const clientesVisitados = clientesConPrestamosActivos.filter((c: any) =>
      clientesVisitadosIds.includes(c.id)
    )

    const clientesNoVisitados = clientesConPrestamosActivos.filter(
      (c: any) => !clientesVisitadosIds.includes(c.id)
    )

    const prestamosVencidos = await prisma.prestamo.findMany({
      where: { estado: "ACTIVO", fechaFin: { lt: new Date() } },
      include: {
        cliente: {
          select: {
            nombre: true,
            apellido: true,
            documento: true,
            telefono: true,
          },
        },
        pagos: { select: { monto: true, fecha: true }, orderBy: { fecha: "desc" } },
      },
    })

    const totalPrestamosVencidos = prestamosVencidos.length

    // Construir informe final
    const informe = {
      fecha,
      resumen: {
        totalClientes,
        totalPrestamosActivos,
        totalPrestamosVencidos,
        totalCobradoHoy,
        clientesVisitados: clientesVisitados.length,
        clientesNoVisitados: clientesNoVisitados.length,
      },
      detalles: {
        clientesVisitados: clientesVisitados.map((c: any) => {
          const totalPrestado = c.prestamos.reduce(
            (sum: number, p: any) => sum + Number(p.monto),
            0
          )
          const totalPagado = c.prestamos.reduce(
            (sum: number, p: any) =>
              sum +
              p.pagos.reduce(
                (pSum: number, pago: any) => pSum + Number(pago.monto),
                0
              ),
            0
          )
          return {
            id: c.id,
            nombre: `${c.nombre} ${c.apellido}`,
            prestamosActivos: c.prestamos.length,
            totalPrestado,
            totalPagado,
            saldoPendiente: totalPrestado - totalPagado,
          }
        }),

        clientesNoVisitados: clientesNoVisitados.map((c: any) => {
          const totalPrestado = c.prestamos.reduce(
            (sum: number, p: any) => sum + Number(p.monto),
            0
          )
          const totalPagado = c.prestamos.reduce(
            (sum: number, p: any) =>
              sum +
              p.pagos.reduce(
                (pSum: number, pago: any) => pSum + Number(pago.monto),
                0
              ),
            0
          )
          return {
            id: c.id,
            nombre: `${c.nombre} ${c.apellido}`,
            prestamosActivos: c.prestamos.length,
            totalPrestado,
            totalPagado,
            saldoPendiente: totalPrestado - totalPagado,
          }
        }),

        prestamosVencidos: prestamosVencidos.map((p: any) => {
          const totalPagado = p.pagos.reduce(
            (sum: number, pago: any) => sum + Number(pago.monto),
            0
          )
          const saldoPendiente = Number(p.monto) - totalPagado
          return {
            id: p.id,
            cliente: `${p.cliente.nombre} ${p.cliente.apellido}`,
            documento: p.cliente.documento,
            telefono: p.cliente.telefono,
            monto: Number(p.monto),
            valorCuota: Number(p.valorCuota),
            cuotas: p.cuotas,
            fechaVencimiento: p.fechaFin,
            diasVencido: Math.ceil(
              (new Date().getTime() - new Date(p.fechaFin).getTime()) /
                (1000 * 60 * 60 * 24)
            ),
            totalPagado,
            saldoPendiente,
          }
        }),

        cobrosHoy: pagos.map((p: any) => ({
          id: p.id,
          cliente: `${p.prestamo.cliente.nombre} ${p.prestamo.cliente.apellido}`,
          monto: Number(p.monto),
          fecha: p.fecha,
        })),
      },
    }

    return NextResponse.json(informe)
  } catch (error) {
    console.error("Error al generar informe:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
