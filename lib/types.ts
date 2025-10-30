
import { UserRole } from "@prisma/client"

export interface SessionUser {
  id: string
  email: string
  name?: string
  firstName?: string
  lastName?: string
  role: UserRole
  isActive: boolean
  timeLimit?: number
  permissions: string[]
  supervisor?: {
    id: string
    name?: string
    firstName?: string
    lastName?: string
  }
}

declare module "next-auth" {
  interface Session {
    user: SessionUser & {
      name?: string
      email?: string
      image?: string
    }
  }

  interface User {
    id: string
    email?: string
    name?: string
    firstName?: string
    lastName?: string
    role: UserRole
    isActive: boolean
    timeLimit?: number
    permissions: string[]
    supervisor?: {
      id: string
      name?: string
      firstName?: string
      lastName?: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole
    firstName?: string
    lastName?: string
    isActive?: boolean
    timeLimit?: number
    permissions?: string[]
    supervisor?: {
      id: string
      name?: string
      firstName?: string
      lastName?: string
    }
  }
}

export interface Cliente {
  id: string
  cedula: string
  nombre: string
  apellido: string
  direccion: string
  telefono?: string
  foto?: string
  posicionRuta?: number
  activo: boolean
}

export interface PrestamoConCliente {
  id: string
  monto: number
  interes: number
  cuotas: number
  valorCuota: number
  fechaInicio: Date
  fechaFin: Date
  estado: string
  cliente: Cliente
  saldoPendiente: number
  cuotasPagadas: number
}

export interface InformeDelDia {
  totalCobrado: number
  totalPrestado: number
  totalGastos: number
  saldoEfectivo: number
  fecha: Date
}
