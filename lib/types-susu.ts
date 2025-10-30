
import { Decimal } from '@prisma/client/runtime/library'

export type EstadoSusu = 'ACTIVO' | 'COMPLETADO' | 'CANCELADO'
export type FrecuenciaSusu = 'SEMANAL' | 'QUINCENAL' | 'MENSUAL'
export type MetodoPagoSusu = 'SALDO' | 'DEPOSITO' | 'TRANSFERENCIA'
export type EstadoPagoSusu = 'COMPLETADO' | 'RETRASO' | 'PENDIENTE'
export type EstadoParticipante = 'ACTIVO' | 'RETIRADO' | 'COMPLETADO'

export interface SusuParticipante {
  id: string
  susuId: string
  userId: string
  orden: number
  montoPorPeriodo: Decimal | number
  yaRecibio: boolean
  fechaRecepcion: Date | null
  estado: EstadoParticipante
  usuario: {
    id: string
    name: string | null
    firstName: string | null
    lastName: string | null
    email: string
  }
  pagos?: SusuPago[]
}

export interface SusuPago {
  id: string
  susuId: string
  participanteId: string
  numeroPeriodo: number
  monto: Decimal | number
  fechaPago: Date
  metodoPago: MetodoPagoSusu
  estado: EstadoPagoSusu
  observaciones: string | null
  comprobante: string | null
}

export interface Susu {
  id: string
  nombre: string
  descripcion: string | null
  montoTotal: Decimal | number
  frecuencia: FrecuenciaSusu
  fechaInicio: Date
  fechaFin: Date | null
  estado: EstadoSusu
  creadorId: string
  observaciones: string | null
  createdAt: Date
  updatedAt: Date
  creador: {
    id: string
    name: string | null
    firstName: string | null
    lastName: string | null
    email: string
  }
  participantes: SusuParticipante[]
  pagos: SusuPago[]
}

export interface CreateSusuData {
  nombre: string
  descripcion?: string
  montoTotal: number
  frecuencia: FrecuenciaSusu
  fechaInicio: Date
  participantes: {
    userId: string
    orden: number
  }[]
  observaciones?: string
}

export interface RegistrarPagoSusuData {
  susuId: string
  participanteId: string
  numeroPeriodo: number
  monto: number
  metodoPago: MetodoPagoSusu
  observaciones?: string
  comprobante?: string
}
