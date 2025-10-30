

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export type Permission = 
  | 'SINCRONIZAR_DATOS'
  | 'REGISTRAR_COBROS'
  | 'MAPA_CLIENTES'
  | 'REGISTRAR_GASTOS'
  | 'REGISTRAR_INGRESOS'
  | 'VER_REPORTES'
  | 'VER_DASHBOARD'
  | 'VER_LISTADO_GENERAL'
  | 'VER_DETALLES_PRESTAMO'
  | 'CREAR_CLIENTES'
  | 'EDITAR_CLIENTES'
  | 'CREAR_PRESTAMOS'
  | 'EDITAR_PRESTAMOS'
  | 'ELIMINAR_PRESTAMOS'
  | 'REGISTRAR_TRANSFERENCIAS'
  | 'VER_TRANSFERENCIAS'
  | 'GESTIONAR_USUARIOS'
  | 'VER_AUDITORIA'
  | 'CONFIGURAR_SISTEMA'
  | 'GESTIONAR_PERMISOS'
  | 'REALIZAR_CIERRE_DIA'
  | 'VER_CIERRES_HISTORICOS'

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  ADMINISTRADOR: [], // Los administradores tienen acceso total, no necesitan permisos específicos
  SUPERVISOR: [
    'VER_DASHBOARD',
    'VER_LISTADO_GENERAL',
    'VER_DETALLES_PRESTAMO',
    'REGISTRAR_COBROS',
    'MAPA_CLIENTES',
    'REGISTRAR_GASTOS',
    'REGISTRAR_INGRESOS',
    'VER_REPORTES',
    'CREAR_CLIENTES',
    'EDITAR_CLIENTES',
    'CREAR_PRESTAMOS',
    'EDITAR_PRESTAMOS',
    'ELIMINAR_PRESTAMOS',
    'REGISTRAR_TRANSFERENCIAS',
    'VER_TRANSFERENCIAS',
    'VER_AUDITORIA',
    'REALIZAR_CIERRE_DIA',
    'VER_CIERRES_HISTORICOS',
    'SINCRONIZAR_DATOS'
  ],
  COBRADOR: [
    'VER_DASHBOARD',
    'VER_LISTADO_GENERAL',
    'VER_DETALLES_PRESTAMO',
    'REGISTRAR_COBROS',
    'MAPA_CLIENTES',
    'REGISTRAR_GASTOS',
    'VER_REPORTES',
    'CREAR_CLIENTES',
    'EDITAR_CLIENTES'
  ]
}

/**
 * Verificar si un usuario tiene un permiso específico
 */
export function hasPermission(session: any, permission: Permission): boolean {
  if (!session?.user) return false
  
  // Los administradores tienen acceso total
  if (session.user.role === 'ADMINISTRADOR') return true
  
  // Verificar permisos específicos del usuario
  return session.user.permissions?.includes(permission) || false
}

/**
 * Verificar si un usuario tiene al menos uno de los permisos especificados
 */
export function hasAnyPermission(session: any, permissions: Permission[]): boolean {
  if (!session?.user) return false
  
  // Los administradores tienen acceso total
  if (session.user.role === 'ADMINISTRADOR') return true
  
  // Verificar si tiene al menos uno de los permisos
  return permissions.some(permission => 
    session.user.permissions?.includes(permission)
  )
}

/**
 * Verificar si un usuario tiene todos los permisos especificados
 */
export function hasAllPermissions(session: any, permissions: Permission[]): boolean {
  if (!session?.user) return false
  
  // Los administradores tienen acceso total
  if (session.user.role === 'ADMINISTRADOR') return true
  
  // Verificar si tiene todos los permisos
  return permissions.every(permission => 
    session.user.permissions?.includes(permission)
  )
}

/**
 * Verificar límite de tiempo de uso diario
 */
export async function checkTimeLimit(userId: string): Promise<{
  allowed: boolean
  minutesUsed: number
  minutesLimit?: number
  message?: string
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timeLimit: true }
  })

  if (!user?.timeLimit) {
    return { allowed: true, minutesUsed: 0 }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const timeUsage = await prisma.userTimeUsage.findUnique({
    where: {
      userId_date: {
        userId,
        date: today
      }
    }
  })

  const minutesUsed = timeUsage?.minutes || 0
  const minutesLimit = user.timeLimit

  if (minutesUsed >= minutesLimit) {
    return {
      allowed: false,
      minutesUsed,
      minutesLimit,
      message: `Tiempo de uso diario agotado (${Math.floor(minutesLimit / 60)}h ${minutesLimit % 60}m)`
    }
  }

  return {
    allowed: true,
    minutesUsed,
    minutesLimit
  }
}

/**
 * Registrar tiempo de uso
 */
export async function recordTimeUsage(userId: string, minutes: number = 1): Promise<void> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  await prisma.userTimeUsage.upsert({
    where: {
      userId_date: {
        userId,
        date: today
      }
    },
    update: {
      minutes: {
        increment: minutes
      },
      lastActivity: new Date()
    },
    create: {
      userId,
      date: today,
      minutes,
      lastActivity: new Date()
    }
  })
}

/**
 * Middleware para verificar permisos en server-side
 */
export async function requirePermission(permission: Permission) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    throw new Error('No autenticado')
  }

  if (!session.user.isActive) {
    throw new Error('Usuario desactivado')
  }

  if (!hasPermission(session, permission)) {
    throw new Error(`Permiso requerido: ${permission}`)
  }

  // Verificar límite de tiempo para cobradores
  if (session.user.role === 'COBRADOR') {
    const timeCheck = await checkTimeLimit(session.user.id)
    if (!timeCheck.allowed) {
      throw new Error(timeCheck.message || 'Tiempo de uso agotado')
    }
  }

  return session
}

/**
 * Middleware para verificar rol mínimo
 */
export async function requireRole(minRole: 'COBRADOR' | 'SUPERVISOR' | 'ADMINISTRADOR') {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    throw new Error('No autenticado')
  }

  if (!session.user.isActive) {
    throw new Error('Usuario desactivado')
  }

  const roleHierarchy = {
    'COBRADOR': 1,
    'SUPERVISOR': 2,
    'ADMINISTRADOR': 3
  }

  const userLevel = roleHierarchy[session.user.role]
  const requiredLevel = roleHierarchy[minRole]

  if (userLevel < requiredLevel) {
    throw new Error(`Rol insuficiente. Requerido: ${minRole}`)
  }

  return session
}

