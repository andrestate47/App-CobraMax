
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Obtener detalle de un SUSU
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const susu = await prisma.susu.findUnique({
      where: { id: params.id },
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
            pagos: {
              orderBy: {
                numeroPeriodo: 'desc'
              }
            }
          },
          orderBy: {
            orden: 'asc'
          }
        },
        pagos: {
          orderBy: {
            numeroPeriodo: 'desc'
          },
          take: 50
        }
      }
    })

    if (!susu) {
      return NextResponse.json({ error: 'SUSU no encontrado' }, { status: 404 })
    }

    return NextResponse.json(susu)
  } catch (error) {
    console.error('Error al obtener SUSU:', error)
    return NextResponse.json(
      { error: 'Error al obtener el SUSU' },
      { status: 500 }
    )
  }
}

// PATCH - Actualizar estado del SUSU
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const data = await request.json()
    const { estado, observaciones } = data

    const susu = await prisma.susu.update({
      where: { id: params.id },
      data: {
        ...(estado && { estado }),
        ...(observaciones && { observaciones })
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

    return NextResponse.json(susu)
  } catch (error) {
    console.error('Error al actualizar SUSU:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el SUSU' },
      { status: 500 }
    )
  }
}
