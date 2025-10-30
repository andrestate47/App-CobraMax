
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Solo administradores, supervisores y el propio usuario pueden ver sus comisiones
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!currentUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    if (currentUser.role !== 'ADMINISTRADOR' && 
        currentUser.role !== 'SUPERVISOR' && 
        currentUser.id !== params.userId) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const url = new URL(request.url)
    const fechaInicio = url.searchParams.get('fechaInicio')
    const fechaFin = url.searchParams.get('fechaFin')
    const mes = url.searchParams.get('mes') // formato: YYYY-MM

    // Construir filtros de fecha
    let dateFilter: any = {}
    
    if (fechaInicio && fechaFin) {
      dateFilter = {
        fecha: {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin)
        }
      }
    } else if (mes) {
      const [year, month] = mes.split('-')
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
      
      dateFilter = {
        fecha: {
          gte: startDate,
          lte: endDate
        }
      }
    }

    // Obtener configuración del usuario
    const configuracion = await prisma.configuracionSueldo.findUnique({
      where: { userId: params.userId }
    })

    if (!configuracion) {
      return NextResponse.json({ 
        error: "No se encontró configuración de sueldo para este usuario" 
      }, { status: 404 })
    }

    // Obtener todos los pagos del usuario en el período
    const pagos = await prisma.pago.findMany({
      where: {
        userId: params.userId,
        ...dateFilter
      },
      include: {
        prestamo: {
          select: {
            id: true,
            monto: true,
            cliente: {
              select: {
                nombre: true,
                apellido: true
              }
            }
          }
        }
      },
      orderBy: {
        fecha: 'asc'
      }
    })

    // Calcular comisiones
    const comisionPorcentaje = parseFloat(configuracion.comisionPorCobro.toString())
    const totalCobrado = pagos.reduce((sum, pago) => sum + parseFloat(pago.monto.toString()), 0)
    const totalComisiones = (totalCobrado * comisionPorcentaje) / 100

    // Calcular avances ya otorgados en el período
    const avancesOtorgados = await prisma.pagoSueldo.findMany({
      where: {
        cobradorId: params.userId,
        tipo: 'AVANCE',
        estado: 'PAGADO',
        ...(mes && { periodo: mes })
      }
    })

    const totalAvances = avancesOtorgados.reduce((sum, avance) => sum + parseFloat(avance.montoFinal.toString()), 0)

    // Calcular límite de avance disponible
    const salarioBase = parseFloat(configuracion.salarioBase.toString())
    const sueldoTotal = salarioBase + totalComisiones
    const limiteAvance = (sueldoTotal * configuracion.limitePorcentajeAvance) / 100
    const avanceDisponible = Math.max(0, limiteAvance - totalAvances)

    const resumen = {
      periodo: mes || 'personalizado',
      configuracion: {
        salarioBase: salarioBase,
        comisionPorcentaje: comisionPorcentaje,
        limitePorcentajeAvance: configuracion.limitePorcentajeAvance,
        montoMinimoAvance: parseFloat(configuracion.montoMinimoAvance.toString())
      },
      cobros: {
        totalCobrado: totalCobrado,
        cantidadCobros: pagos.length,
        totalComisiones: totalComisiones
      },
      sueldo: {
        salarioBase: salarioBase,
        comisiones: totalComisiones,
        total: sueldoTotal
      },
      avances: {
        totalOtorgados: totalAvances,
        limiteDisponible: limiteAvance,
        disponible: avanceDisponible,
        puedeAvanzar: avanceDisponible >= parseFloat(configuracion.montoMinimoAvance.toString())
      },
      detalleCobros: pagos.map(pago => ({
        id: pago.id,
        fecha: pago.fecha,
        monto: parseFloat(pago.monto.toString()),
        comision: (parseFloat(pago.monto.toString()) * comisionPorcentaje) / 100,
        cliente: `${pago.prestamo.cliente.nombre} ${pago.prestamo.cliente.apellido}`,
        prestamoId: pago.prestamo.id
      }))
    }

    return NextResponse.json(resumen)
  } catch (error) {
    console.error("Error al calcular comisiones:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
