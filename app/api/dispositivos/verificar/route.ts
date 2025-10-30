
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getDeviceInfo } from '@/lib/device-fingerprint'

// POST - Verificar y registrar dispositivo
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const deviceInfo = await getDeviceInfo()
    const userId = session.user.id

    // Los administradores no necesitan autorización de dispositivos
    if (session.user.role === 'ADMINISTRADOR') {
      return NextResponse.json({
        autorizado: true,
        esAdmin: true,
        mensaje: 'Acceso administrativo sin restricciones'
      })
    }

    // Buscar si el dispositivo ya está registrado
    let dispositivo = await prisma.dispositivoAutorizado.findUnique({
      where: {
        userId_deviceId: {
          userId,
          deviceId: deviceInfo.deviceId
        }
      }
    })

    // Si el dispositivo no existe, registrarlo como PENDIENTE
    if (!dispositivo) {
      dispositivo = await prisma.dispositivoAutorizado.create({
        data: {
          userId,
          deviceId: deviceInfo.deviceId,
          userAgent: deviceInfo.userAgent,
          ipAddress: deviceInfo.ipAddress,
          deviceName: deviceInfo.deviceName,
          estado: 'PENDIENTE'
        }
      })

      return NextResponse.json({
        autorizado: false,
        pendiente: true,
        mensaje: 'Dispositivo nuevo detectado. Solicitud de autorización enviada al administrador.',
        dispositivo: {
          deviceName: deviceInfo.deviceName,
          estado: dispositivo.estado
        }
      })
    }

    // Actualizar último acceso
    await prisma.dispositivoAutorizado.update({
      where: { id: dispositivo.id },
      data: { ultimoAcceso: new Date() }
    })

    // Verificar estado del dispositivo
    if (dispositivo.estado === 'AUTORIZADO') {
      return NextResponse.json({
        autorizado: true,
        mensaje: 'Dispositivo autorizado',
        dispositivo: {
          deviceName: deviceInfo.deviceName,
          estado: dispositivo.estado
        }
      })
    }

    if (dispositivo.estado === 'RECHAZADO' || dispositivo.estado === 'BLOQUEADO') {
      return NextResponse.json({
        autorizado: false,
        bloqueado: true,
        mensaje: 'Este dispositivo ha sido bloqueado. Contacte al administrador.',
        dispositivo: {
          deviceName: deviceInfo.deviceName,
          estado: dispositivo.estado
        }
      })
    }

    // Estado PENDIENTE
    return NextResponse.json({
      autorizado: false,
      pendiente: true,
      mensaje: 'Dispositivo pendiente de autorización por el administrador.',
      dispositivo: {
        deviceName: deviceInfo.deviceName,
        estado: dispositivo.estado
      }
    })

  } catch (error) {
    console.error('Error al verificar dispositivo:', error)
    return NextResponse.json(
      { error: 'Error al verificar dispositivo' },
      { status: 500 }
    )
  }
}
