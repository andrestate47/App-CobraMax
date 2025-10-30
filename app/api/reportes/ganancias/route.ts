

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
    const fechaInicio = searchParams.get("fechaInicio")
    const fechaFin = searchParams.get("fechaFin")
    
    // Si no se especifican fechas, usar el mes actual
    let fechaInicioDate: Date
    let fechaFinDate: Date
    
    if (fechaInicio && fechaFin) {
      fechaInicioDate = new Date(fechaInicio)
      fechaFinDate = new Date(fechaFin)
      fechaFinDate.setHours(23, 59, 59, 999)
    } else {
      // Mes actual por defecto
      const hoy = new Date()
      fechaInicioDate = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      fechaFinDate = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59, 999)
    }

    // Obtener todos los préstamos en el rango de fechas
    const prestamos = await prisma.prestamo.findMany({
      where: {
        createdAt: {
          gte: fechaInicioDate,
          lte: fechaFinDate
        }
      },
      include: {
        cliente: {
          select: {
            nombre: true,
            apellido: true,
            documento: true
          }
        },
        pagos: {
          where: {
            fecha: {
              gte: fechaInicioDate,
              lte: fechaFinDate
            }
          }
        }
      }
    })

    // Obtener todos los pagos en el rango de fechas
    const todosPagos = await prisma.pago.findMany({
      where: {
        fecha: {
          gte: fechaInicioDate,
          lte: fechaFinDate
        }
      },
      include: {
        prestamo: {
          include: {
            cliente: {
              select: {
                nombre: true,
                apellido: true,
                documento: true
              }
            }
          }
        }
      }
    })

    // Obtener todos los gastos en el rango de fechas
    const gastos = await prisma.gasto.findMany({
      where: {
        fecha: {
          gte: fechaInicioDate,
          lte: fechaFinDate
        }
      }
    })

    // Obtener todos los préstamos para calcular saldos pendientes
    const prestamosConSaldo = await prisma.prestamo.findMany({
      where: {
        estado: 'ACTIVO'
      },
      include: {
        pagos: true,
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            documento: true
          }
        }
      }
    })

    // Obtener préstamos renovados en el rango de fechas
    const prestamosRenovados = await prisma.prestamo.findMany({
      where: {
        estado: 'RENOVADO',
        updatedAt: {
          gte: fechaInicioDate,
          lte: fechaFinDate
        }
      },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            documento: true
          }
        }
      }
    })

    // Obtener nuevos préstamos (que podrían ser renovaciones)
    const prestamosNuevos = await prisma.prestamo.findMany({
      where: {
        createdAt: {
          gte: fechaInicioDate,
          lte: fechaFinDate
        }
      },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            documento: true
          }
        }
      }
    })

    // CÁLCULOS FINANCIEROS

    // 1. Capital Invertido (total de préstamos creados en el período)
    const capitalInvertido = prestamos.reduce((sum: number, prestamo: any) => 
      sum + parseFloat(prestamo.monto.toString()), 0
    )

    // 2. Balance Pendiente (suma de todos los saldos pendientes)
    let balancePendiente = 0
    prestamosConSaldo.forEach((prestamo: any) => {
      const montoTotal = parseFloat(prestamo.monto.toString()) * (1 + parseFloat(prestamo.interes.toString()) / 100)
      const totalPagado = prestamo.pagos.reduce((sum: number, pago: any) => sum + parseFloat(pago.monto.toString()), 0)
      const saldoPendiente = Math.max(0, montoTotal - totalPagado)
      balancePendiente += saldoPendiente
    })

    // 3. Capital Recuperado (pagos realizados en el período)
    const capitalRecuperado = todosPagos.reduce((sum: number, pago: any) => 
      sum + parseFloat(pago.monto.toString()), 0
    )

    // 4. Capital No Recuperado (préstamos vencidos sin pagar)
    const hoy = new Date()
    let capitalNoRecuperado = 0
    prestamosConSaldo
      .filter((prestamo: any) => new Date(prestamo.fechaFin) < hoy)
      .forEach((prestamo: any) => {
        const montoTotal = parseFloat(prestamo.monto.toString()) * (1 + parseFloat(prestamo.interes.toString()) / 100)
        const totalPagado = prestamo.pagos.reduce((sum: number, pago: any) => sum + parseFloat(pago.monto.toString()), 0)
        const saldoPendiente = Math.max(0, montoTotal - totalPagado)
        capitalNoRecuperado += saldoPendiente
      })

    // 5. Total Intereses (intereses generados por préstamos del período)
    const totalIntereses = prestamos.reduce((sum: number, prestamo: any) => {
      const montoInteres = parseFloat(prestamo.monto.toString()) * (parseFloat(prestamo.interes.toString()) / 100)
      return sum + montoInteres
    }, 0)

    // 6. Intereses Cobrados (parte de intereses en los pagos del período)
    let interesesCobrados = 0
    todosPagos.forEach((pago: any) => {
      const prestamo = pago.prestamo
      const montoOriginal = parseFloat(prestamo.monto.toString())
      const tasaInteres = parseFloat(prestamo.interes.toString()) / 100
      const montoConInteres = montoOriginal * (1 + tasaInteres)
      
      // Calcular qué parte del pago corresponde a intereses
      if (montoConInteres > 0) {
        const porcentajeInteres = (montoConInteres - montoOriginal) / montoConInteres
        const interesEnPago = parseFloat(pago.monto.toString()) * porcentajeInteres
        interesesCobrados += interesEnPago
      }
    })

    // 7. Total de Gastos
    const totalGastos = gastos.reduce((sum: number, gasto: any) => 
      sum + parseFloat(gasto.monto.toString()), 0
    )

    // 8. Mora Cobrada (pagos realizados después de fecha de fin del préstamo)
    let moraCobrada = 0
    todosPagos.forEach((pago: any) => {
      const fechaFin = new Date(pago.prestamo.fechaFin)
      const fechaPago = new Date(pago.fecha)
      
      if (fechaPago > fechaFin) {
        // Calcular mora (ejemplo: 5% del monto por día de retraso)
        const diasRetraso = Math.floor((fechaPago.getTime() - fechaFin.getTime()) / (1000 * 60 * 60 * 24))
        const moraPorDia = parseFloat(pago.monto.toString()) * 0.05 / 30 // 5% mensual prorrateado
        moraCobrada += moraPorDia * diasRetraso
      }
    })

    // 9. Utilidad Neta
    const utilidadNeta = capitalRecuperado + interesesCobrados + moraCobrada - capitalInvertido - totalGastos

    // Datos adicionales para análisis
    const cantidadPrestamos = prestamos.length
    const cantidadPagos = todosPagos.length
    const cantidadGastos = gastos.length
    const cantidadClientesActivos = new Set(todosPagos.map((p: any) => p.prestamo.clienteId)).size

    // Préstamos por estado
    const prestamosAlDia = prestamosConSaldo.filter((p: any) => new Date(p.fechaFin) >= hoy).length
    const prestamosVencidos = prestamosConSaldo.filter((p: any) => new Date(p.fechaFin) < hoy).length

    // ROI (Return on Investment)
    const roi = capitalInvertido > 0 ? ((utilidadNeta / capitalInvertido) * 100) : 0

    // ===== RENOVACIONES =====
    const renovacionesGenerales = prestamosRenovados.length
    const renovacionesNuevas = prestamosNuevos.filter((p: any) => {
      const fechaCreacion = new Date(p.createdAt)
      const primerDiaMes = new Date(fechaInicioDate.getFullYear(), fechaInicioDate.getMonth(), 1)
      return fechaCreacion >= primerDiaMes
    }).length
    const renovacionesRealizadas = prestamosRenovados.length
    
    // Préstamos que están próximos a vencer (renovaciones pendientes)
    const prestamosProximosVencer = await prisma.prestamo.findMany({
      where: {
        estado: 'ACTIVO',
        fechaFin: {
          gte: hoy,
          lte: new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 días desde hoy
        }
      }
    })
    const renovacionesPendientes = prestamosProximosVencer.length
    
    const renovacionesPorRealizar = prestamosConSaldo.filter((p: any) => {
      const fechaFin = new Date(p.fechaFin)
      const diasParaVencer = Math.floor((fechaFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
      return diasParaVencer <= 7 && diasParaVencer >= 0
    }).length

    // ===== INTERESES POR CLIENTE =====
    const interesesPorCliente: Record<string, {
      clienteId: string
      nombre: string
      documento: string
      interesGenerado: number
      interesGanado: number
    }> = {}

    // Calcular interés generado por cada cliente
    prestamos.forEach((prestamo: any) => {
      const clienteId = prestamo.clienteId
      const montoInteres = parseFloat(prestamo.monto.toString()) * (parseFloat(prestamo.interes.toString()) / 100)
      
      if (!interesesPorCliente[clienteId]) {
        interesesPorCliente[clienteId] = {
          clienteId: clienteId,
          nombre: `${prestamo.cliente.nombre} ${prestamo.cliente.apellido}`,
          documento: prestamo.cliente.documento,
          interesGenerado: 0,
          interesGanado: 0
        }
      }
      
      interesesPorCliente[clienteId].interesGenerado += montoInteres
    })

    // Calcular interés ganado por cada cliente (de los pagos)
    todosPagos.forEach((pago: any) => {
      const prestamo = pago.prestamo
      const clienteId = prestamo.clienteId
      const montoOriginal = parseFloat(prestamo.monto.toString())
      const tasaInteres = parseFloat(prestamo.interes.toString()) / 100
      const montoConInteres = montoOriginal * (1 + tasaInteres)
      
      if (montoConInteres > 0) {
        const porcentajeInteres = (montoConInteres - montoOriginal) / montoConInteres
        const interesEnPago = parseFloat(pago.monto.toString()) * porcentajeInteres
        
        if (!interesesPorCliente[clienteId]) {
          interesesPorCliente[clienteId] = {
            clienteId: clienteId,
            nombre: `${prestamo.cliente.nombre} ${prestamo.cliente.apellido}`,
            documento: prestamo.cliente.documento,
            interesGenerado: 0,
            interesGanado: 0
          }
        }
        
        interesesPorCliente[clienteId].interesGanado += interesEnPago
      }
    })

    const interesesPorClienteArray = Object.values(interesesPorCliente)
    const interesTotalGenerado = interesesPorClienteArray.reduce((sum: number, c: any) => sum + c.interesGenerado, 0)
    const interesTotalGanado = interesesPorClienteArray.reduce((sum: number, c: any) => sum + c.interesGanado, 0)

    // ===== TRANSFERENCIAS =====
    // Obtener transferencias en el rango de fechas
    const transferencias = await prisma.transferencia.findMany({
      where: {
        fecha: {
          gte: fechaInicioDate,
          lte: fechaFinDate
        }
      },
      include: {
        prestamo: {
          include: {
            cliente: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                documento: true
              }
            }
          }
        }
      }
    })
    
    const transferenciasRealizadas = transferencias.length
    const valorTotalTransferencias = transferencias.reduce((sum: number, t: any) => sum + parseFloat(t.monto.toString()), 0)
    const clientesTransferencia = new Set(transferencias.map((t: any) => t.prestamo.clienteId)).size
    
    // Transferencias pendientes (préstamos de tipo TRANSFERENCIA con saldo pendiente)
    const prestamosPorTransferencia = await prisma.prestamo.findMany({
      where: {
        tipoCredito: 'TRANSFERENCIA',
        estado: 'ACTIVO'
      },
      include: {
        pagos: true,
        transferencias: true
      }
    })
    
    const transferenciasEstimadas = prestamosPorTransferencia.filter((p: any) => {
      const montoTotal = parseFloat(p.monto.toString()) * (1 + parseFloat(p.interes.toString()) / 100)
      const totalPagado = p.pagos.reduce((sum: number, pago: any) => sum + parseFloat(pago.monto.toString()), 0)
      return montoTotal > totalPagado && p.transferencias.length === 0
    }).length

    // ===== SALARIOS DE USUARIOS =====
    const usuarios = await prisma.user.findMany({
      where: {
        isActive: true
      },
      include: {
        configuracionSueldo: true
      },
      orderBy: [
        { role: 'asc' },
        { firstName: 'asc' }
      ]
    })

    // Función para calcular pagos semanales, quincenales y mensuales
    const calcularPagos = (salarioMensual: number) => {
      const pagoSemanal = salarioMensual / 4 // Aproximadamente 4 semanas por mes
      const pagoQuincenal = salarioMensual / 2
      const pagoMensual = salarioMensual
      return { pagoSemanal, pagoQuincenal, pagoMensual }
    }

    const administradores = usuarios
      .filter(u => u.role === 'ADMINISTRADOR')
      .map(u => {
        const salarioBase = u.configuracionSueldo?.salarioBase 
          ? parseFloat(u.configuracionSueldo.salarioBase.toString()) 
          : 0
        const pagos = calcularPagos(salarioBase)
        return {
          id: u.id,
          nombre: u.firstName || '',
          apellido: u.lastName || '',
          nombreCompleto: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
          email: u.email,
          salario: salarioBase,
          pagoSemanal: pagos.pagoSemanal,
          pagoQuincenal: pagos.pagoQuincenal,
          pagoMensual: pagos.pagoMensual,
          comisionPorCobro: u.configuracionSueldo?.comisionPorCobro 
            ? parseFloat(u.configuracionSueldo.comisionPorCobro.toString()) 
            : 0
        }
      })

    const supervisores = usuarios
      .filter(u => u.role === 'SUPERVISOR')
      .map(u => {
        const salarioBase = u.configuracionSueldo?.salarioBase 
          ? parseFloat(u.configuracionSueldo.salarioBase.toString()) 
          : 0
        const pagos = calcularPagos(salarioBase)
        return {
          id: u.id,
          nombre: u.firstName || '',
          apellido: u.lastName || '',
          nombreCompleto: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
          email: u.email,
          salario: salarioBase,
          pagoSemanal: pagos.pagoSemanal,
          pagoQuincenal: pagos.pagoQuincenal,
          pagoMensual: pagos.pagoMensual,
          comisionPorCobro: u.configuracionSueldo?.comisionPorCobro 
            ? parseFloat(u.configuracionSueldo.comisionPorCobro.toString()) 
            : 0
        }
      })

    const cobradores = usuarios
      .filter(u => u.role === 'COBRADOR')
      .map(u => {
        const salarioBase = u.configuracionSueldo?.salarioBase 
          ? parseFloat(u.configuracionSueldo.salarioBase.toString()) 
          : 0
        const pagos = calcularPagos(salarioBase)
        return {
          id: u.id,
          numeroRuta: u.numeroRuta || 'Sin asignar',
          nombre: u.firstName || '',
          apellido: u.lastName || '',
          nombreCompleto: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
          email: u.email,
          salario: salarioBase,
          pagoSemanal: pagos.pagoSemanal,
          pagoQuincenal: pagos.pagoQuincenal,
          pagoMensual: pagos.pagoMensual,
          comisionPorCobro: u.configuracionSueldo?.comisionPorCobro 
            ? parseFloat(u.configuracionSueldo.comisionPorCobro.toString()) 
            : 0
        }
      })

    const totalSalarios = usuarios.reduce((sum: number, u: any) => {
      if (u.configuracionSueldo?.salarioBase) {
        return sum + parseFloat(u.configuracionSueldo.salarioBase.toString())
      }
      return sum
    }, 0)

    // Calcular totales por rol
    const totalSalariosAdministradores = administradores.reduce((sum: number, a: any) => sum + a.salario, 0)
    const totalSalariosSupervisores = supervisores.reduce((sum: number, s: any) => sum + s.salario, 0)
    const totalSalariosCobradores = cobradores.reduce((sum: number, c: any) => sum + c.salario, 0)

    // Calcular promedios
    const promedioSalarioAdministrador = administradores.length > 0 
      ? totalSalariosAdministradores / administradores.length 
      : 0
    const promedioSalarioSupervisor = supervisores.length > 0 
      ? totalSalariosSupervisores / supervisores.length 
      : 0
    const promedioSalarioCobrador = cobradores.length > 0 
      ? totalSalariosCobradores / cobradores.length 
      : 0

    // Calcular totales semanales, quincenales y mensuales
    const pagosSemanales = calcularPagos(totalSalarios)
    const promediosPorRol = {
      administradores: promedioSalarioAdministrador,
      supervisores: promedioSalarioSupervisor,
      cobradores: promedioSalarioCobrador
    }

    const reporte = {
      periodo: {
        fechaInicio: fechaInicioDate,
        fechaFin: fechaFinDate
      },
      metricas: {
        capitalInvertido,
        balancePendiente,
        capitalRecuperado,
        capitalNoRecuperado,
        totalIntereses,
        interesesCobrados,
        totalGastos,
        moraCobrada,
        utilidadNeta,
        roi
      },
      estadisticas: {
        cantidadPrestamos,
        cantidadPagos,
        cantidadGastos,
        cantidadClientesActivos,
        prestamosAlDia,
        prestamosVencidos,
        promedioPrestamosDia: cantidadPrestamos > 0 ? capitalInvertido / cantidadPrestamos : 0,
        promedioPagosDia: cantidadPagos > 0 ? capitalRecuperado / cantidadPagos : 0
      },
      renovaciones: {
        generales: renovacionesGenerales,
        nuevas: renovacionesNuevas,
        pendientes: renovacionesPendientes,
        porRealizar: renovacionesPorRealizar,
        realizadas: renovacionesRealizadas,
        detalles: prestamosRenovados.map((p) => ({
          id: p.id,
          cliente: `${p.cliente.nombre} ${p.cliente.apellido}`,
          documento: p.cliente.documento,
          montoOriginal: parseFloat(p.monto.toString()),
          montoNuevo: 0, // No tenemos referencia al nuevo préstamo
          estado: 'REALIZADA',
          fechaCreacion: p.updatedAt.toISOString()
        }))
      },
      intereses: {
        totalGenerado: interesTotalGenerado,
        totalGanado: interesTotalGanado,
        porCliente: interesesPorClienteArray
      },
      transferencias: {
        realizadas: transferenciasRealizadas,
        pendientes: transferenciasEstimadas,
        clientesTotales: clientesTransferencia,
        valorTotal: valorTotalTransferencias,
        detalles: transferencias.map((t) => ({
          id: t.id,
          cliente: `${t.prestamo.cliente.nombre} ${t.prestamo.cliente.apellido}`,
          documento: t.prestamo.cliente.documento,
          monto: parseFloat(t.monto.toString()),
          fecha: t.fecha.toISOString()
        }))
      },
      salarios: {
        administradores,
        supervisores,
        cobradores,
        totalSalarios,
        cantidadUsuarios: usuarios.length,
        totalesPorRol: {
          administradores: totalSalariosAdministradores,
          supervisores: totalSalariosSupervisores,
          cobradores: totalSalariosCobradores
        },
        promediosPorRol,
        pagosGenerales: {
          semanal: pagosSemanales.pagoSemanal,
          quincenal: pagosSemanales.pagoQuincenal,
          mensual: pagosSemanales.pagoMensual
        },
        porcentajesPorRol: {
          administradores: totalSalarios > 0 ? (totalSalariosAdministradores / totalSalarios) * 100 : 0,
          supervisores: totalSalarios > 0 ? (totalSalariosSupervisores / totalSalarios) * 100 : 0,
          cobradores: totalSalarios > 0 ? (totalSalariosCobradores / totalSalarios) * 100 : 0
        }
      },
      detalles: {
        prestamos: prestamos.map((p: any) => {
          const montoTotal = parseFloat(p.monto.toString()) * (1 + parseFloat(p.interes.toString()) / 100)
          const totalPagado = p.pagos.reduce((sum: number, pago: any) => sum + parseFloat(pago.monto.toString()), 0)
          const saldoPendiente = Math.max(0, montoTotal - totalPagado)
          
          return {
            id: p.id,
            cliente: `${p.cliente.nombre} ${p.cliente.apellido}`,
            documento: p.cliente.documento,
            monto: parseFloat(p.monto.toString()),
            interes: parseFloat(p.interes.toString()),
            saldoPendiente: saldoPendiente,
            fechaInicio: p.fechaInicio,
            fechaVencimiento: p.fechaFin, // Usar fechaFin como fechaVencimiento
            pagosEnPeriodo: p.pagos.length,
            montoPagado: totalPagado
          }
        }),
        pagos: todosPagos.map((p: any) => ({
          id: p.id,
          cliente: `${p.prestamo.cliente.nombre} ${p.prestamo.cliente.apellido}`,
          monto: parseFloat(p.monto.toString()),
          fecha: p.fecha,
          prestamoId: p.prestamoId,
          observaciones: p.observaciones
        })),
        gastos: gastos.map((g: any) => ({
          id: g.id,
          concepto: g.concepto,
          monto: parseFloat(g.monto.toString()),
          fecha: g.fecha,
          observaciones: g.observaciones
        }))
      }
    }

    return NextResponse.json(reporte)
  } catch (error) {
    console.error("Error al obtener reporte de ganancias:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

