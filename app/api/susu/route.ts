
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

// GET - Listar todos los SUSUs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const estado = searchParams.get('estado')
    const participanteId = searchParams.get('participanteId')

    const where: any = {}

    if (estado) {
      where.estado = estado
    }

    if (participanteId) {
      where.participantes = {
        some: {
          userId: participanteId
        }
      }
    }

    const susus = await prisma.susu.findMany({
      where,
      include: {
        creador: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        participantes: {
          include: {
            usuario: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            pagos: true
          },
          orderBy: {
            orden: 'asc'
          }
        },
        pagos: {
          orderBy: {
            numeroPeriodo: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(susus)
  } catch (error) {
    console.error('Error al obtener SUSUs:', error)
    return NextResponse.json(
      { error: 'Error al obtener los SUSUs' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo SUSU
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que el usuario sea ADMIN o SUPERVISOR
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (user?.role !== 'ADMINISTRADOR' && user?.role !== 'SUPERVISOR') {
      return NextResponse.json(
        { error: 'Solo administradores y supervisores pueden crear SUSUs' },
        { status: 403 }
      )
    }

    const data = await request.json()
    const { nombre, descripcion, montoTotal, frecuencia, fechaInicio, participantes, observaciones } = data

    // Validar datos
    if (!nombre || !montoTotal || !frecuencia || !fechaInicio || !participantes || participantes.length === 0) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Calcular monto por participante
    const montoPorPeriodo = new Prisma.Decimal(montoTotal).div(participantes.length)

    // Crear SUSU con participantes
    const susu = await prisma.susu.create({
      data: {
        nombre,
        descripcion,
        montoTotal: new Prisma.Decimal(montoTotal),
        frecuencia,
        fechaInicio: new Date(fechaInicio),
        creadorId: session.user.id,
        observaciones,
        participantes: {
          create: participantes.map((p: any) => ({
            userId: p.userId,
            orden: p.orden,
            montoPorPeriodo
          }))
        }
      },
      include: {
        creador: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        participantes: {
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
          },
          orderBy: {
            orden: 'asc'
          }
        }
      }
    })

    return NextResponse.json(susu, { status: 201 })
  } catch (error) {
    console.error('Error al crear SUSU:', error)
    return NextResponse.json(
      { error: 'Error al crear el SUSU' },
      { status: 500 }
    )
  }
}
