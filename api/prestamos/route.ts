import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

// ============================================================
// ✅ GET /api/prestamos - Obtener todos los préstamos activos
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const conSaldo = searchParams.get("conSaldo") === "true"

    // Obtener préstamos activos con información completa
    const prestamos = await prisma.prestamo.findMany({
      where: { estado: "ACTIVO" },
      include: {
        cliente: {
          select: {
            id: true,
            codigoCliente: true,
            documento: true,
            nombre: true,
            apellido: true,
            direccionCliente: true,
            direccionCobro: true,
            telefono: true,
            foto: true,
            pais: true,
            ciudad: true,
            referenciasPersonales: true
          }
        },
        pagos: { orderBy: { fecha: "desc" } }
      },
      orderBy: [{ fechaInicio: "desc" }]
    })

    // Procesar préstamos y calcular saldos
    const prestamosConSaldo = prestamos.map((prestamo: any) => {
      const totalPagado = prestamo.pagos.reduce(
        (sum: number, pago: any) => sum + parseFloat(pago.monto.toString()),
        0
      )

      const montoTotal =
        parseFloat(prestamo.monto.toString()) +
        (parseFloat(prestamo.monto.toString()) *
          parseFloat(prestamo.interes.toString())) /
          100

      const saldoPendiente = montoTotal - totalPagado
      const cuotasPagadas = prestamo.pagos.length

      const fechaCreacion = prestamo.createdAt || prestamo.fechaInicio
      const fechaUltimoPago =
        prestamo.pagos.length > 0 ? prestamo.pagos[0].fecha : null

      const fechaActividadReciente =
        fechaUltimoPago && new Date(fechaUltimoPago) > new Date(fechaCreacion)
          ? fechaUltimoPago
          : fechaCreacion

      return {
        id: prestamo.id,
        monto: parseFloat(prestamo.monto.toString()),
        interes: parseFloat(prestamo.interes.toString()),
        cuotas: prestamo.cuotas,
        valorCuota: parseFloat(prestamo.valorCuota.toString()),
        fechaInicio: prestamo.fechaInicio,
        fechaFin: prestamo.fechaFin,
        estado: prestamo.estado,
        observaciones: prestamo.observaciones,
        tipoPago: prestamo.tipoPago,
        tipoCredito: prestamo.tipoCredito,
        diasGracia: prestamo.diasGracia,
        moraCredito: parseFloat(prestamo.moraCredito?.toString() || "0"),
        microseguroTipo: prestamo.microseguroTipo,
        microseguroTotal: parseFloat(
          prestamo.microseguroTotal?.toString() || "0"
        ),
        fechaActividadReciente,
        cliente: prestamo.cliente,
        saldoPendiente,
        cuotasPagadas,
        montoTotal
      }
    })

    // Agrupar por cliente
    const clientesConPrestamos = new Map<
      string,
      {
        cliente: any
        prestamos: any[]
        fechaActividadReciente: Date
        saldoTotalPendiente: number
        cuotasTotalesPagadas: number
        montoTotalPrestado: number
      }
    >()

    prestamosConSaldo.forEach((prestamo: any) => {
      const clienteId = prestamo.cliente.id
      if (!clientesConPrestamos.has(clienteId)) {
        clientesConPrestamos.set(clienteId, {
          cliente: prestamo.cliente,
          prestamos: [],
          fechaActividadReciente: prestamo.fechaActividadReciente,
          saldoTotalPendiente: 0,
          cuotasTotalesPagadas: 0,
          montoTotalPrestado: 0
        })
      }

      const clienteData = clientesConPrestamos.get(clienteId)!
      clienteData.prestamos.push(prestamo)
      clienteData.saldoTotalPendiente += prestamo.saldoPendiente
      clienteData.cuotasTotalesPagadas += prestamo.cuotasPagadas
      clienteData.montoTotalPrestado += prestamo.monto

      if (
        new Date(prestamo.fechaActividadReciente) >
        new Date(clienteData.fechaActividadReciente)
      ) {
        clienteData.fechaActividadReciente = prestamo.fechaActividadReciente
      }
    })

    // Convertir a array y ordenar
    const clientesArray = Array.from(clientesConPrestamos.values()).sort(
      (a, b) =>
        new Date(b.fechaActividadReciente).getTime() -
        new Date(a.fechaActividadReciente).getTime()
    )

    // Filtrar según saldo
    const resultado = conSaldo
      ? clientesArray.filter((c: any) => c.saldoTotalPendiente > 0)
      : clientesArray

    return NextResponse.json(resultado)
  } catch (error) {
    console.error("Error al obtener préstamos:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// ============================================================
// ✅ POST /api/prestamos - Crear un nuevo préstamo
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const {
      clienteId,
      monto,
      interes,
      tipoPago = "DIARIO",
      cuotas,
      fechaInicio,
      observaciones,
      tipoCredito = "EFECTIVO",
      diasGracia = 0,
      moraCredito = 0,
      microseguroTipo = "NINGUNO",
      microseguroValor = 0,
      microseguroTotal = 0
    } = body

    if (!clienteId || !monto || interes === undefined || !cuotas || !fechaInicio) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      )
    }

    // Conversión a número
    const montoNum = parseFloat(monto)
    const interesNum = parseFloat(interes)
    const cuotasNum = parseInt(cuotas)
    const diasGraciaNum = parseInt(diasGracia)
    const moraCreditoNum = parseFloat(moraCredito)
    const microseguroValorNum = parseFloat(microseguroValor)
    const microseguroTotalNum = parseFloat(microseguroTotal)

    if (
      isNaN(montoNum) ||
      isNaN(interesNum) ||
      isNaN(cuotasNum) ||
      isNaN(diasGraciaNum) ||
      isNaN(moraCreditoNum)
    ) {
      return NextResponse.json(
        { error: "Los valores numéricos son inválidos" },
        { status: 400 }
      )
    }

    // Validar cliente existente
    const clienteExistente = await prisma.cliente.findUnique({
      where: { id: clienteId }
    })

    if (!clienteExistente) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    // Cálculos financieros
    const interesTotal = montoNum * (interesNum / 100)
    const montoTotal = montoNum + interesTotal
    const valorCuota = montoTotal / cuotasNum

    const fechaFin = new Date(fechaInicio)
    const diasPorTipo: Record<string, number> = {
      DIARIO: 1,
      SEMANAL: 7,
      LUNES_A_VIERNES: 1,
      LUNES_A_SABADO: 1,
      QUINCENAL: 15,
      CATORCENAL: 14,
      FIN_DE_MES: 30,
      MENSUAL: 30,
      TRIMESTRAL: 90,
      CUATRIMESTRAL: 120,
      SEMESTRAL: 180,
      ANUAL: 365
    }
    fechaFin.setDate(
      fechaFin.getDate() + cuotasNum * (diasPorTipo[tipoPago] || 1)
    )

    // Crear préstamo
    const prestamo = await prisma.prestamo.create({
      data: {
        clienteId,
        userId: session.user.id,
        monto: montoNum,
        interes: interesNum,
        tipoPago,
        cuotas: cuotasNum,
        valorCuota,
        fechaInicio: new Date(fechaInicio),
        fechaFin,
        observaciones: observaciones?.trim() || null,
        tipoCredito,
        interesTotal,
        diasGracia: diasGraciaNum,
        moraCredito: moraCreditoNum,
        microseguroTipo,
        microseguroValor: microseguroValorNum,
        microseguroTotal: microseguroTotalNum
      },
      include: { cliente: true }
    })

    return NextResponse.json({
      message: "Préstamo creado exitosamente",
      prestamo: {
        id: prestamo.id,
        monto: parseFloat(prestamo.monto.toString()),
        interes: parseFloat(prestamo.interes.toString()),
        cuotas: prestamo.cuotas,
        valorCuota: parseFloat(prestamo.valorCuota.toString()),
        fechaInicio: prestamo.fechaInicio,
        fechaFin: prestamo.fechaFin,
        estado: prestamo.estado,
        tipoPago: prestamo.tipoPago,
        cliente: prestamo.cliente
      }
    })
  } catch (error) {
    console.error("Error al crear préstamo:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
