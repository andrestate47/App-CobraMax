
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Decimal } from "@prisma/client/runtime/library"

// GET /api/caja-chica - Obtener saldo y movimientos del cobrador actual
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const userId = session.user.id

    // Obtener todos los movimientos del cobrador
    const movimientos = await prisma.movimientoCajaChica.findMany({
      where: {
        cobradorId: userId,
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
      orderBy: {
        fecha: "desc",
      },
    })

    // Calcular balances
    let totalEntregado = new Decimal(0)
    let totalGastado = new Decimal(0)
    let totalDevuelto = new Decimal(0)

    movimientos.forEach((mov) => {
      if (mov.tipo === "ENTREGADO" || mov.tipo === "ENTREGA") {
        totalEntregado = totalEntregado.plus(mov.monto)
      } else if (mov.tipo === "GASTADO" || mov.tipo === "GASTO") {
        totalGastado = totalGastado.plus(mov.monto)
      } else if (mov.tipo === "DEVUELTO" || mov.tipo === "DEVOLUCION") {
        totalDevuelto = totalDevuelto.plus(mov.monto)
      }
    })

    const balance = totalEntregado.minus(totalGastado).minus(totalDevuelto)

    return NextResponse.json({
      balance: {
        balance: balance.toNumber(),
        totalEntregado: totalEntregado.toNumber(),
        totalGastado: totalGastado.toNumber(),
        totalDevuelto: totalDevuelto.toNumber(),
      },
      movimientos: movimientos.map((mov) => ({
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
      })),
    })
  } catch (error) {
    console.error("Error al obtener caja chica:", error)
    return NextResponse.json(
      { error: "Error al obtener datos de caja chica" },
      { status: 500 }
    )
  }
}

// POST /api/caja-chica - Crear nuevo movimiento (solo admin/supervisor)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Solo admin y supervisor pueden asignar caja chica
    if (!["ADMINISTRADOR", "SUPERVISOR"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "No tienes permisos para esta acción" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { cobradorId, tipo, monto, descripcion, observaciones, comprobante } = body

    // Validaciones
    if (!cobradorId || !tipo || !monto) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      )
    }

    const montoDecimal = new Decimal(String(monto))

    // Obtener saldo actual del cobrador
    const ultimoMovimiento = await prisma.movimientoCajaChica.findFirst({
      where: { cobradorId },
      orderBy: { fecha: "desc" },
    })

    const saldoAnterior = ultimoMovimiento?.saldoNuevo || new Decimal(0)
    
    // Calcular nuevo saldo según el tipo
    let saldoNuevo = saldoAnterior
    if (tipo === "ENTREGA" || tipo === "ENTREGADO") {
      saldoNuevo = saldoAnterior.plus(montoDecimal)
    } else if (tipo === "DEVOLUCION" || tipo === "DEVUELTO" || tipo === "GASTO" || tipo === "GASTADO") {
      saldoNuevo = saldoAnterior.minus(montoDecimal)
    } else if (tipo === "AJUSTE") {
      // Para ajustes, el monto puede ser positivo o negativo
      saldoNuevo = saldoAnterior.plus(montoDecimal)
    }

    // Crear el movimiento - Las entregas se aprueban automáticamente
    const movimiento = await prisma.movimientoCajaChica.create({
      data: {
        cobradorId,
        asignadoPorId: session.user.id,
        tipo,
        monto: montoDecimal,
        saldoAnterior,
        saldoNuevo,
        descripcion,
        observaciones,
        comprobante,
        estado: tipo === "ENTREGADO" || tipo === "ENTREGA" ? "APROBADO" : "APROBADO",
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

    return NextResponse.json({
      success: true,
      movimiento: {
        id: movimiento.id,
        tipo: movimiento.tipo,
        monto: movimiento.monto.toNumber(),
        saldoAnterior: movimiento.saldoAnterior.toNumber(),
        saldoNuevo: movimiento.saldoNuevo.toNumber(),
        fecha: movimiento.fecha.toISOString(),
        descripcion: movimiento.descripcion,
        observaciones: movimiento.observaciones,
        estado: movimiento.estado,
        cobrador: `${movimiento.cobrador.firstName || movimiento.cobrador.name || ""} ${movimiento.cobrador.lastName || ""}`.trim(),
        asignadoPor: `${movimiento.asignadoPor?.firstName || movimiento.asignadoPor?.name || ""} ${movimiento.asignadoPor?.lastName || ""}`.trim(),
      },
    })
  } catch (error) {
    console.error("Error al crear movimiento de caja chica:", error)
    return NextResponse.json(
      { error: "Error al crear movimiento de caja chica" },
      { status: 500 }
    )
  }
}
