
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

// POST - Registrar pago de un participante
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const data = await request.json()
    const { participanteId, numeroPeriodo, monto, metodoPago, observaciones, comprobante } = data

    // Validar datos
    if (!participanteId || !numeroPeriodo || !monto) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el participante pertenezca al SUSU
    const participante = await prisma.susuParticipante.findFirst({
      where: {
        id: participanteId,
        susuId: params.id
      }
    })

    if (!participante) {
      return NextResponse.json(
        { error: 'Participante no encontrado en este SUSU' },
        { status: 404 }
      )
    }

    // Si es método SALDO, verificar que el participante tenga saldo suficiente
    // Por ahora lo dejamos para implementar después la lógica de saldo

    // Crear el pago
    const pago = await prisma.susuPago.create({
      data: {
        susuId: params.id,
        participanteId,
        numeroPeriodo,
        monto: new Prisma.Decimal(monto),
        metodoPago: metodoPago || 'SALDO',
        estado: 'COMPLETADO',
        observaciones,
        comprobante
      },
      include: {
        participante: {
          include: {
            usuario: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    })

    // Verificar si todos los participantes pagaron este periodo
    const totalParticipantes = await prisma.susuParticipante.count({
      where: { susuId: params.id, estado: 'ACTIVO' }
    })

    const pagosPeriodo = await prisma.susuPago.count({
      where: {
        susuId: params.id,
        numeroPeriodo,
        estado: 'COMPLETADO'
      }
    })

    // Si todos pagaron, marcar al que le toca recibir como que ya recibió
    if (pagosPeriodo === totalParticipantes) {
      const participanteQueToca = await prisma.susuParticipante.findFirst({
        where: {
          susuId: params.id,
          orden: numeroPeriodo
        }
      })

      if (participanteQueToca) {
        await prisma.susuParticipante.update({
          where: { id: participanteQueToca.id },
          data: {
            yaRecibio: true,
            fechaRecepcion: new Date()
          }
        })
      }

      // Si fue el último periodo, marcar el SUSU como completado
      if (numeroPeriodo === totalParticipantes) {
        await prisma.susu.update({
          where: { id: params.id },
          data: {
            estado: 'COMPLETADO',
            fechaFin: new Date()
          }
        })
      }
    }

    return NextResponse.json(pago, { status: 201 })
  } catch (error) {
    console.error('Error al registrar pago:', error)
    return NextResponse.json(
      { error: 'Error al registrar el pago' },
      { status: 500 }
    )
  }
}

// GET - Obtener pagos de un SUSU
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const numeroPeriodo = searchParams.get('numeroPeriodo')

    const where: any = { susuId: params.id }
    if (numeroPeriodo) {
      where.numeroPeriodo = parseInt(numeroPeriodo)
    }

    const pagos = await prisma.susuPago.findMany({
      where,
      include: {
        participante: {
          include: {
            usuario: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: [
        { numeroPeriodo: 'desc' },
        { fechaPago: 'desc' }
      ]
    })

    return NextResponse.json(pagos)
  } catch (error) {
    console.error('Error al obtener pagos:', error)
    return NextResponse.json(
      { error: 'Error al obtener los pagos' },
      { status: 500 }
    )
  }
}
