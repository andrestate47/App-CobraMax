
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Obtener dispositivos (para administradores)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Solo administradores pueden ver todos los dispositivos
    if (session.user.role !== 'ADMINISTRADOR') {
      return NextResponse.json(
        { error: 'Solo administradores pueden gestionar dispositivos' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')

    const where = estado ? { estado: estado as any } : {}

    const dispositivos = await prisma.dispositivoAutorizado.findMany({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(dispositivos)
  } catch (error) {
    console.error('Error al obtener dispositivos:', error)
    return NextResponse.json(
      { error: 'Error al obtener dispositivos' },
      { status: 500 }
    )
  }
}

// POST - Aprobar o rechazar un dispositivo
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Solo administradores pueden aprobar/rechazar
    if (session.user.role !== 'ADMINISTRADOR') {
      return NextResponse.json(
        { error: 'Solo administradores pueden gestionar dispositivos' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { dispositivoId, accion } = body

    if (!dispositivoId || !accion) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    if (!['AUTORIZAR', 'RECHAZAR', 'BLOQUEAR'].includes(accion)) {
      return NextResponse.json(
        { error: 'Acción inválida' },
        { status: 400 }
      )
    }

    let nuevoEstado: 'AUTORIZADO' | 'RECHAZADO' | 'BLOQUEADO'
    
    if (accion === 'AUTORIZAR') nuevoEstado = 'AUTORIZADO'
    else if (accion === 'RECHAZAR') nuevoEstado = 'RECHAZADO'
    else nuevoEstado = 'BLOQUEADO'

    const dispositivo = await prisma.dispositivoAutorizado.update({
      where: { id: dispositivoId },
      data: {
        estado: nuevoEstado,
        aprobadoPor: session.user.id,
        fechaAprobacion: new Date()
      },
      include: {
        usuario: {
          select: {
            email: true,
            name: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      dispositivo,
      message: `Dispositivo ${accion.toLowerCase()} exitosamente`
    })
  } catch (error) {
    console.error('Error al gestionar dispositivo:', error)
    return NextResponse.json(
      { error: 'Error al gestionar dispositivo' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar un dispositivo
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Solo administradores pueden eliminar
    if (session.user.role !== 'ADMINISTRADOR') {
      return NextResponse.json(
        { error: 'Solo administradores pueden eliminar dispositivos' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const dispositivoId = searchParams.get('id')

    if (!dispositivoId) {
      return NextResponse.json(
        { error: 'ID de dispositivo requerido' },
        { status: 400 }
      )
    }

    await prisma.dispositivoAutorizado.delete({
      where: { id: dispositivoId }
    })

    return NextResponse.json({
      success: true,
      message: 'Dispositivo eliminado exitosamente'
    })
  } catch (error) {
    console.error('Error al eliminar dispositivo:', error)
    return NextResponse.json(
      { error: 'Error al eliminar dispositivo' },
      { status: 500 }
    )
  }
}
