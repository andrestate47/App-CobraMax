
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
    const fecha = searchParams.get('fecha') || new Date().toISOString().split('T')[0]
    
    // Convertir fecha a rango del día
    const fechaInicio = new Date(fecha)
    fechaInicio.setHours(0, 0, 0, 0)
    const fechaFin = new Date(fecha)
    fechaFin.setHours(23, 59, 59, 999)

    // 1. CLIENTES TOTALES
    const totalClientes = await prisma.cliente.count({
      where: { activo: true }
    })

    // 2. PRÉSTAMOS TOTALES Y ACTIVOS
    const prestamosData = await prisma.prestamo.aggregate({
      _count: { id: true },
      where: { estado: 'ACTIVO' }
    })

    // 2.1 PRÉSTAMOS CANCELADOS (COMPLETADOS)
    const prestamosCancelados = await prisma.prestamo.count({
      where: { estado: 'CANCELADO' }
    })

    // 2.2 PRÉSTAMOS NUEVOS HOY
    const prestamosNuevosHoy = await prisma.prestamo.count({
      where: {
        createdAt: {
          gte: fechaInicio,
          lte: fechaFin
        }
      }
    })

    // 2.3 PRÉSTAMOS VENCIDOS (Total)
    const prestamosVencidosTotal = await prisma.prestamo.count({
      where: {
        estado: 'ACTIVO',
        fechaFin: {
          lt: new Date()
        }
      }
    })

    // 3. CLIENTES VISITADOS HOY
    const clientesVisitados = await prisma.cliente.findMany({
      where: {
        activo: true,
        visitas: {
          some: {
            fecha: {
              gte: fechaInicio,
              lte: fechaFin
            }
          }
        }
      },
      include: {
        visitas: {
          where: {
            fecha: {
              gte: fechaInicio,
              lte: fechaFin
            }
          },
          include: {
            usuario: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            fecha: 'desc'
          },
          take: 1
        },
        prestamos: {
          where: { estado: 'ACTIVO' },
          include: {
            pagos: {
              select: {
                monto: true
              }
            }
          }
        }
      }
    })

    // 4. CLIENTES NO VISITADOS HOY (con préstamos activos)
    const clientesNoVisitados = await prisma.cliente.findMany({
      where: {
        activo: true,
        prestamos: {
          some: { estado: 'ACTIVO' }
        },
        NOT: {
          visitas: {
            some: {
              fecha: {
                gte: fechaInicio,
                lte: fechaFin
              }
            }
          }
        }
      },
      include: {
        visitas: {
          orderBy: {
            fecha: 'desc'
          },
          take: 1
        },
        prestamos: {
          where: { estado: 'ACTIVO' },
          include: {
            pagos: {
              select: {
                monto: true
              }
            }
          }
        }
      }
    })

    // 5. PRÉSTAMOS VENCIDOS
    const prestamosVencidos = await prisma.prestamo.findMany({
      where: {
        estado: 'ACTIVO',
        fechaFin: {
          lt: new Date()
        }
      },
      include: {
        cliente: {
          select: {
            nombre: true,
            apellido: true,
            documento: true,
            telefono: true,
            direccionCobro: true,
            direccionCliente: true
          }
        },
        pagos: {
          select: {
            monto: true,
            fecha: true
          },
          orderBy: {
            fecha: 'desc'
          }
        }
      }
    })

    // 6. NUEVOS CLIENTES (creados hoy)
    const nuevosClientes = await prisma.cliente.findMany({
      where: {
        createdAt: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      include: {
        prestamos: {
          select: {
            id: true,
            monto: true,
            estado: true,
            fechaInicio: true,
            tipoPago: true,
            interes: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // 7. NUEVOS PRÉSTAMOS (creados hoy)
    const nuevosPrestamos = await prisma.prestamo.findMany({
      where: {
        createdAt: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      include: {
        cliente: {
          select: {
            nombre: true,
            apellido: true,
            documento: true,
            telefono: true,
            direccionCobro: true
          }
        },
        usuario: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        pagos: {
          select: {
            monto: true,
            fecha: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // 8. COBROS DE HOY
    const cobrosHoy = await prisma.pago.findMany({
      where: {
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      include: {
        prestamo: {
          include: {
            cliente: {
              select: {
                nombre: true,
                apellido: true,
                documento: true,
                telefono: true
              }
            },
            pagos: {
              select: {
                monto: true
              }
            }
          }
        },
        usuario: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    })

    // 9. CLIENTES CON MORA (préstamos vencidos + saldo pendiente)
    const clientesConMora = await prisma.cliente.findMany({
      where: {
        activo: true,
        prestamos: {
          some: {
            estado: 'ACTIVO',
            fechaFin: {
              lt: new Date()
            }
          }
        }
      },
      include: {
        visitas: {
          orderBy: {
            fecha: 'desc'
          },
          take: 1
        },
        prestamos: {
          where: {
            estado: 'ACTIVO',
            fechaFin: {
              lt: new Date()
            }
          },
          include: {
            pagos: {
              select: {
                monto: true
              }
            }
          }
        }
      }
    })

    // 10. TODOS LOS PRÉSTAMOS ACTIVOS (para pestaña Total)
    const todosPrestamosTotales = await prisma.prestamo.findMany({
      where: { estado: 'ACTIVO' },
      include: {
        cliente: {
          select: {
            nombre: true,
            apellido: true,
            documento: true,
            telefono: true,
            direccionCobro: true,
            direccionCliente: true
          }
        },
        pagos: {
          select: {
            monto: true,
            fecha: true
          },
          orderBy: {
            fecha: 'desc'
          }
        }
      },
      orderBy: {
        fechaInicio: 'desc'
      }
    })

    // 11. PRÉSTAMOS CANCELADOS (completados)
    const prestamosCanceladosLista = await prisma.prestamo.findMany({
      where: { estado: 'CANCELADO' },
      include: {
        cliente: {
          select: {
            nombre: true,
            apellido: true,
            documento: true,
            telefono: true,
            direccionCobro: true,
            direccionCliente: true
          }
        },
        pagos: {
          select: {
            monto: true,
            fecha: true
          },
          orderBy: {
            fecha: 'desc'
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 100 // Limitamos a los últimos 100
    })

    // 12. PRÉSTAMOS EN MORA (préstamos específicos vencidos con info del cliente)
    const prestamosEnMoraLista = await prisma.prestamo.findMany({
      where: {
        estado: 'ACTIVO',
        fechaFin: {
          lt: new Date()
        }
      },
      include: {
        cliente: {
          select: {
            nombre: true,
            apellido: true,
            documento: true,
            telefono: true,
            direccionCobro: true,
            direccionCliente: true
          }
        },
        pagos: {
          select: {
            monto: true,
            fecha: true
          },
          orderBy: {
            fecha: 'desc'
          }
        }
      },
      orderBy: {
        fechaFin: 'asc' // Los más vencidos primero
      }
    })

    // Calcular totales de cobros
    const totalCobrado = cobrosHoy.reduce((sum, pago) => sum + Number(pago.monto), 0)

    // Construir respuesta
    const informe = {
      fecha,
      resumen: {
        totalClientes,
        totalPrestamos: prestamosData._count.id,
        clientesVisitadosHoy: clientesVisitados.length,
        clientesNoVisitadosHoy: clientesNoVisitados.length,
        prestamosVencidos: prestamosVencidos.length,
        nuevosClientesHoy: nuevosClientes.length,
        nuevosPrestamosHoy: nuevosPrestamos.length,
        cobrosHoy: cobrosHoy.length,
        totalCobradoHoy: totalCobrado,
        clientesConMora: clientesConMora.length,
        // Nuevas estadísticas de préstamos
        prestamosCancelados,
        prestamosNuevosHoyCount: prestamosNuevosHoy,
        prestamosVencidosCount: prestamosVencidosTotal,
        prestamosEnMora: clientesConMora.reduce((sum, cliente) => sum + cliente.prestamos.length, 0)
      },
      detalles: {
        clientesVisitados: clientesVisitados.map(cliente => {
          const totalPrestado = cliente.prestamos.reduce((sum, p) => sum + Number(p.monto), 0)
          const totalPagado = cliente.prestamos.reduce((sum, p) => 
            sum + p.pagos.reduce((pSum, pago) => pSum + Number(pago.monto), 0), 0
          )
          const saldoPendiente = totalPrestado - totalPagado
          const prestamosVencidos = cliente.prestamos.filter(p => new Date(p.fechaFin) < new Date())
          
          return {
            id: cliente.id,
            nombre: `${cliente.nombre} ${cliente.apellido}`,
            documento: cliente.documento,
            telefono: cliente.telefono,
            direccion: cliente.direccionCobro || cliente.direccionCliente,
            ultimaVisita: cliente.visitas[0]?.fecha || null,
            visitadoPor: cliente.visitas[0]?.usuario ? 
              `${cliente.visitas[0].usuario.firstName} ${cliente.visitas[0].usuario.lastName}` : null,
            tipoVisita: cliente.visitas[0]?.tipo || null,
            observaciones: cliente.visitas[0]?.observaciones || null,
            prestamosActivos: cliente.prestamos.length,
            totalPrestado,
            totalPagado,
            saldoPendiente,
            prestamosVencidos: prestamosVencidos.length,
            diasMora: prestamosVencidos.length > 0 ? 
              Math.max(...prestamosVencidos.map(p => 
                Math.ceil((new Date().getTime() - new Date(p.fechaFin).getTime()) / (1000 * 60 * 60 * 24))
              )) : 0
          }
        }),
        
        clientesNoVisitados: clientesNoVisitados.map(cliente => {
          const totalPrestado = cliente.prestamos.reduce((sum, p) => sum + Number(p.monto), 0)
          const totalPagado = cliente.prestamos.reduce((sum, p) => 
            sum + p.pagos.reduce((pSum, pago) => pSum + Number(pago.monto), 0), 0
          )
          const saldoPendiente = totalPrestado - totalPagado
          const prestamosVencidos = cliente.prestamos.filter(p => new Date(p.fechaFin) < new Date())
          const ultimaVisita = cliente.visitas[0]?.fecha || null
          const diasSinVisita = ultimaVisita ? 
            Math.ceil((new Date().getTime() - new Date(ultimaVisita).getTime()) / (1000 * 60 * 60 * 24)) : null
          
          return {
            id: cliente.id,
            nombre: `${cliente.nombre} ${cliente.apellido}`,
            documento: cliente.documento,
            telefono: cliente.telefono,
            direccion: cliente.direccionCobro || cliente.direccionCliente,
            prestamosActivos: cliente.prestamos.length,
            montoTotal: totalPrestado,
            totalPrestado,
            totalPagado,
            saldoPendiente,
            prestamosVencidos: prestamosVencidos.length,
            ultimaVisita,
            diasSinVisita,
            diasMora: prestamosVencidos.length > 0 ? 
              Math.max(...prestamosVencidos.map(p => 
                Math.ceil((new Date().getTime() - new Date(p.fechaFin).getTime()) / (1000 * 60 * 60 * 24))
              )) : 0
          }
        }),
        
        prestamosVencidos: prestamosVencidos.map(prestamo => {
          const totalPagado = prestamo.pagos.reduce((sum, p) => sum + Number(p.monto), 0)
          const saldoPendiente = Number(prestamo.monto) - totalPagado
          const cuotasPagadas = Math.floor(totalPagado / Number(prestamo.valorCuota))
          const porcentajePagado = (totalPagado / Number(prestamo.monto) * 100).toFixed(1)
          const ultimoPago = prestamo.pagos.length > 0 ? prestamo.pagos[0].fecha : null
          
          return {
            id: prestamo.id,
            cliente: `${prestamo.cliente.nombre} ${prestamo.cliente.apellido}`,
            documento: prestamo.cliente.documento,
            telefono: prestamo.cliente.telefono,
            direccion: prestamo.cliente.direccionCobro || prestamo.cliente.direccionCliente,
            monto: Number(prestamo.monto),
            valorCuota: Number(prestamo.valorCuota),
            cuotas: prestamo.cuotas,
            fechaVencimiento: prestamo.fechaFin,
            diasVencido: Math.ceil((new Date().getTime() - new Date(prestamo.fechaFin).getTime()) / (1000 * 60 * 60 * 24)),
            totalPagado,
            saldoPendiente,
            cuotasPagadas,
            porcentajePagado,
            ultimoPago
          }
        }),
        
        nuevosClientes: nuevosClientes.map(cliente => {
          const prestamosActivos = cliente.prestamos.filter(p => p.estado === 'ACTIVO')
          const primerPrestamo = cliente.prestamos.length > 0 ? cliente.prestamos[0] : null
          
          return {
            id: cliente.id,
            nombre: `${cliente.nombre} ${cliente.apellido}`,
            documento: cliente.documento,
            telefono: cliente.telefono,
            direccion: cliente.direccionCobro || cliente.direccionCliente,
            fechaRegistro: cliente.createdAt,
            totalPrestamos: cliente.prestamos.length,
            prestamosActivos: prestamosActivos.length,
            tienePrestamo: cliente.prestamos.length > 0,
            montoPrimerPrestamo: primerPrestamo ? Number(primerPrestamo.monto) : null,
            tipoPagoPrimerPrestamo: primerPrestamo?.tipoPago || null,
            interesPrimerPrestamo: primerPrestamo ? Number(primerPrestamo.interes) : null
          }
        }),
        
        nuevosPrestamos: nuevosPrestamos.map(prestamo => {
          const totalPagado = prestamo.pagos.reduce((sum, p) => sum + Number(p.monto), 0)
          const cuotasPagadas = Math.floor(totalPagado / Number(prestamo.valorCuota))
          const porcentajePagado = (totalPagado / Number(prestamo.monto) * 100).toFixed(1)
          
          return {
            id: prestamo.id,
            cliente: `${prestamo.cliente.nombre} ${prestamo.cliente.apellido}`,
            documento: prestamo.cliente.documento,
            telefono: prestamo.cliente.telefono,
            direccion: prestamo.cliente.direccionCobro,
            monto: Number(prestamo.monto),
            interes: Number(prestamo.interes),
            tipoPago: prestamo.tipoPago,
            valorCuota: Number(prestamo.valorCuota),
            cuotas: prestamo.cuotas,
            fechaInicio: prestamo.fechaInicio,
            fechaFin: prestamo.fechaFin,
            creadoPor: `${prestamo.usuario.firstName} ${prestamo.usuario.lastName}`,
            totalPagado,
            cuotasPagadas,
            porcentajePagado,
            pagosRealizados: prestamo.pagos.length
          }
        }),
        
        cobrosHoy: cobrosHoy.map(pago => {
          const totalPagado = pago.prestamo.pagos.reduce((sum, p) => sum + Number(p.monto), 0)
          const montoPrestamo = Number(pago.prestamo.monto)
          const porcentajePagado = (totalPagado / montoPrestamo * 100).toFixed(1)
          const cuotasPagadas = Math.floor(totalPagado / Number(pago.prestamo.valorCuota))
          const saldoPendiente = montoPrestamo - totalPagado
          
          return {
            id: pago.id,
            cliente: `${pago.prestamo.cliente.nombre} ${pago.prestamo.cliente.apellido}`,
            documento: pago.prestamo.cliente.documento,
            telefono: pago.prestamo.cliente.telefono,
            monto: Number(pago.monto),
            fecha: pago.fecha,
            prestamoId: pago.prestamoId,
            montoPrestamo,
            valorCuota: Number(pago.prestamo.valorCuota),
            cuotasTotales: pago.prestamo.cuotas,
            totalPagado,
            saldoPendiente,
            cuotasPagadas,
            porcentajePagado,
            cobradoPor: `${pago.usuario.firstName} ${pago.usuario.lastName}`,
            observaciones: pago.observaciones
          }
        }),
        
        clientesConMora: clientesConMora.map(cliente => {
          const totalPrestado = cliente.prestamos.reduce((sum, p) => sum + Number(p.monto), 0)
          const totalPagado = cliente.prestamos.reduce((sum, p) => 
            sum + p.pagos.reduce((pSum, pago) => pSum + Number(pago.monto), 0), 0
          )
          const saldoPendiente = totalPrestado - totalPagado
          const diasMora = Math.max(...cliente.prestamos.map(p => 
            Math.ceil((new Date().getTime() - new Date(p.fechaFin).getTime()) / (1000 * 60 * 60 * 24))
          ))
          const ultimaVisita = cliente.visitas[0]?.fecha || null
          const diasSinGestion = ultimaVisita ? 
            Math.ceil((new Date().getTime() - new Date(ultimaVisita).getTime()) / (1000 * 60 * 60 * 24)) : null
          
          return {
            id: cliente.id,
            nombre: `${cliente.nombre} ${cliente.apellido}`,
            documento: cliente.documento,
            telefono: cliente.telefono,
            direccion: cliente.direccionCobro || cliente.direccionCliente,
            prestamosEnMora: cliente.prestamos.length,
            montoTotal: totalPrestado,
            totalPrestado,
            totalPagado,
            saldoPendiente,
            diasMora,
            ultimaVisita,
            diasSinGestion,
            cuotasVencidas: cliente.prestamos.reduce((sum, p) => {
              const cuotasPagadas = Math.floor(p.pagos.reduce((pSum, pago) => pSum + Number(pago.monto), 0) / Number(p.valorCuota))
              return sum + (p.cuotas - cuotasPagadas)
            }, 0)
          }
        }),

        // NUEVAS LISTAS PARA LAS SUB-PESTAÑAS DE PRÉSTAMOS
        todosPrestamosTotales: todosPrestamosTotales.map(prestamo => {
          const totalPagado = prestamo.pagos.reduce((sum, p) => sum + Number(p.monto), 0)
          const saldoPendiente = Number(prestamo.monto) - totalPagado
          const cuotasPagadas = Math.floor(totalPagado / Number(prestamo.valorCuota))
          const porcentajePagado = (totalPagado / Number(prestamo.monto) * 100).toFixed(1)
          const ultimoPago = prestamo.pagos.length > 0 ? prestamo.pagos[0].fecha : null
          const estaVencido = new Date(prestamo.fechaFin) < new Date()
          const diasVencido = estaVencido ? 
            Math.ceil((new Date().getTime() - new Date(prestamo.fechaFin).getTime()) / (1000 * 60 * 60 * 24)) : 0
          
          return {
            id: prestamo.id,
            cliente: `${prestamo.cliente.nombre} ${prestamo.cliente.apellido}`,
            documento: prestamo.cliente.documento,
            telefono: prestamo.cliente.telefono,
            direccion: prestamo.cliente.direccionCobro || prestamo.cliente.direccionCliente,
            monto: Number(prestamo.monto),
            interes: Number(prestamo.interes),
            tipoPago: prestamo.tipoPago,
            valorCuota: Number(prestamo.valorCuota),
            cuotas: prestamo.cuotas,
            fechaInicio: prestamo.fechaInicio,
            fechaFin: prestamo.fechaFin,
            totalPagado,
            saldoPendiente,
            cuotasPagadas,
            porcentajePagado,
            ultimoPago,
            estaVencido,
            diasVencido
          }
        }),

        prestamosCanceladosLista: prestamosCanceladosLista.map(prestamo => {
          const totalPagado = prestamo.pagos.reduce((sum, p) => sum + Number(p.monto), 0)
          const cuotasPagadas = prestamo.cuotas
          const ultimoPago = prestamo.pagos.length > 0 ? prestamo.pagos[0].fecha : null
          
          return {
            id: prestamo.id,
            cliente: `${prestamo.cliente.nombre} ${prestamo.cliente.apellido}`,
            documento: prestamo.cliente.documento,
            telefono: prestamo.cliente.telefono,
            direccion: prestamo.cliente.direccionCobro || prestamo.cliente.direccionCliente,
            monto: Number(prestamo.monto),
            interes: Number(prestamo.interes),
            tipoPago: prestamo.tipoPago,
            valorCuota: Number(prestamo.valorCuota),
            cuotas: prestamo.cuotas,
            fechaInicio: prestamo.fechaInicio,
            fechaFin: prestamo.fechaFin,
            totalPagado,
            cuotasPagadas,
            ultimoPago,
            fechaCompletado: prestamo.updatedAt
          }
        }),

        prestamosEnMoraLista: prestamosEnMoraLista.map(prestamo => {
          const totalPagado = prestamo.pagos.reduce((sum, p) => sum + Number(p.monto), 0)
          const saldoPendiente = Number(prestamo.monto) - totalPagado
          const cuotasPagadas = Math.floor(totalPagado / Number(prestamo.valorCuota))
          const porcentajePagado = (totalPagado / Number(prestamo.monto) * 100).toFixed(1)
          const ultimoPago = prestamo.pagos.length > 0 ? prestamo.pagos[0].fecha : null
          const diasVencido = Math.ceil((new Date().getTime() - new Date(prestamo.fechaFin).getTime()) / (1000 * 60 * 60 * 24))
          
          return {
            id: prestamo.id,
            cliente: `${prestamo.cliente.nombre} ${prestamo.cliente.apellido}`,
            documento: prestamo.cliente.documento,
            telefono: prestamo.cliente.telefono,
            direccion: prestamo.cliente.direccionCobro || prestamo.cliente.direccionCliente,
            monto: Number(prestamo.monto),
            interes: Number(prestamo.interes),
            tipoPago: prestamo.tipoPago,
            valorCuota: Number(prestamo.valorCuota),
            cuotas: prestamo.cuotas,
            fechaInicio: prestamo.fechaInicio,
            fechaFin: prestamo.fechaFin,
            totalPagado,
            saldoPendiente,
            cuotasPagadas,
            porcentajePagado,
            ultimoPago,
            diasVencido,
            cuotasVencidas: prestamo.cuotas - cuotasPagadas
          }
        })
      }
    }

    return NextResponse.json(informe)

  } catch (error) {
    console.error("Error al generar informe de clientes:", error)
    return NextResponse.json(
      { error: "Error al generar informe de clientes" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
