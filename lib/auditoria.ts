
import { prisma } from '@/lib/db'
import { TipoAccion, TipoEntidad } from '@prisma/client'

interface RegistrarAuditoriaParams {
  usuarioId: string
  accion: TipoAccion
  entidad: TipoEntidad
  entidadId: string
  detalles?: any
  ipAddress?: string
  userAgent?: string
}

export async function registrarAuditoria(params: RegistrarAuditoriaParams) {
  try {
    const { usuarioId, accion, entidad, entidadId, detalles, ipAddress, userAgent } = params

    await prisma.registroAuditoria.create({
      data: {
        usuarioId,
        accion,
        entidad,
        entidadId,
        detalles: detalles ? JSON.stringify(detalles) : null,
        ipAddress,
        userAgent,
      },
    })
  } catch (error) {
    console.error('Error al registrar auditoría:', error)
  }
}

export async function registrarEliminacion(
  usuarioId: string,
  entidad: TipoEntidad,
  entidadId: string,
  detalles: any,
  request?: Request
) {
  const ipAddress = request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined
  const userAgent = request?.headers.get('user-agent') || undefined

  await registrarAuditoria({
    usuarioId,
    accion: TipoAccion.ELIMINAR,
    entidad,
    entidadId,
    detalles,
    ipAddress,
    userAgent,
  })
}
