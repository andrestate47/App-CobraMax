
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'react-hot-toast'
import { DollarSign, CreditCard, Wallet, FileText } from 'lucide-react'
import type { Susu } from '@/lib/types-susu'

interface RegistrarPagoSusuModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  susu: Susu
  periodoActual: number
  onPagoRegistrado?: () => void
}

export default function RegistrarPagoSusuModal({
  open,
  onOpenChange,
  susu,
  periodoActual,
  onPagoRegistrado
}: RegistrarPagoSusuModalProps) {
  const { data: session } = useSession() || {}
  const [loading, setLoading] = useState(false)
  const [participantesSeleccionados, setParticipantesSeleccionados] = useState<Set<string>>(new Set())
  const [metodoPago, setMetodoPago] = useState<'SALDO' | 'DEPOSITO' | 'TRANSFERENCIA'>('SALDO')
  const [observaciones, setObservaciones] = useState('')
  const [comprobante, setComprobante] = useState('')

  const montoPorPeriodo = Number(susu.montoTotal) / susu.participantes.length

  // Reset form cuando se abre el modal
  useEffect(() => {
    if (open) {
      setParticipantesSeleccionados(new Set())
      setMetodoPago('SALDO')
      setObservaciones('')
      setComprobante('')
    }
  }, [open])

  const toggleParticipante = (participanteId: string) => {
    const newSet = new Set(participantesSeleccionados)
    if (newSet.has(participanteId)) {
      newSet.delete(participanteId)
    } else {
      newSet.add(participanteId)
    }
    setParticipantesSeleccionados(newSet)
  }

  const seleccionarTodos = () => {
    const participantesPendientes = susu.participantes.filter(p => {
      const yaPago = p.pagos?.some(pago => pago.numeroPeriodo === periodoActual)
      return !yaPago
    })

    if (participantesSeleccionados.size === participantesPendientes.length) {
      setParticipantesSeleccionados(new Set())
    } else {
      setParticipantesSeleccionados(new Set(participantesPendientes.map(p => p.id)))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (participantesSeleccionados.size === 0) {
      toast.error('Debe seleccionar al menos un participante')
      return
    }

    setLoading(true)

    try {
      // Registrar pagos para cada participante seleccionado
      const promesas = Array.from(participantesSeleccionados).map(participanteId =>
        fetch(`/api/susu/${susu.id}/pago`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            participanteId,
            numeroPeriodo: periodoActual,
            monto: montoPorPeriodo,
            metodoPago,
            observaciones,
            comprobante
          })
        })
      )

      const resultados = await Promise.all(promesas)
      const errores = resultados.filter(r => !r.ok)

      if (errores.length === 0) {
        toast.success(
          participantesSeleccionados.size === 1
            ? 'Pago registrado exitosamente'
            : `${participantesSeleccionados.size} pagos registrados exitosamente`
        )
        onOpenChange(false)
        onPagoRegistrado?.()
      } else {
        toast.error(`Error al registrar ${errores.length} pago(s)`)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al registrar pagos')
    } finally {
      setLoading(false)
    }
  }

  const getNombreCompleto = (usuario: any) => {
    if (usuario.name) return usuario.name
    if (usuario.firstName && usuario.lastName) {
      return `${usuario.firstName} ${usuario.lastName}`
    }
    return usuario.email
  }

  const getIconoMetodoPago = () => {
    const iconos = {
      SALDO: Wallet,
      DEPOSITO: DollarSign,
      TRANSFERENCIA: CreditCard
    }
    const Icon = iconos[metodoPago]
    return <Icon className="h-4 w-4" />
  }

  const participantesPendientes = susu.participantes.filter(p => {
    const yaPago = p.pagos?.some(pago => pago.numeroPeriodo === periodoActual)
    return !yaPago
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Registrar Pagos - Periodo {periodoActual}</DialogTitle>
          <DialogDescription>
            Registre los pagos de los participantes para el periodo actual
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del periodo */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Periodo</div>
                <div className="text-2xl font-bold text-blue-600">
                  {periodoActual} de {susu.participantes.length}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Monto por Participante</div>
                <div className="text-2xl font-bold text-green-600">
                  S/ {montoPorPeriodo.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Seleccionar participantes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg">Participantes que Pagan</Label>
              {participantesPendientes.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={seleccionarTodos}
                >
                  {participantesSeleccionados.size === participantesPendientes.length
                    ? 'Deseleccionar todos'
                    : 'Seleccionar todos'}
                </Button>
              )}
            </div>

            {participantesPendientes.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg bg-green-50 dark:bg-green-950/20">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-green-700 dark:text-green-400">
                      ¡Periodo completado!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Todos los participantes ya pagaron este periodo
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2"
                    onClick={() => onOpenChange(false)}
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                {participantesPendientes.map((participante) => (
                  <div
                    key={participante.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleParticipante(participante.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={participantesSeleccionados.has(participante.id)}
                        onCheckedChange={() => toggleParticipante(participante.id)}
                      />
                      <div>
                        <div className="font-medium">
                          {getNombreCompleto(participante.usuario)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Orden #{participante.orden}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        S/ {montoPorPeriodo.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {participantesSeleccionados.size > 0 && (
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                <span className="font-medium">Total a Cobrar:</span>
                <span className="text-xl font-bold text-primary">
                  S/ {(montoPorPeriodo * participantesSeleccionados.size).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Método de pago */}
          <div className="space-y-2">
            <Label htmlFor="metodoPago">Método de Pago</Label>
            <Select
              value={metodoPago}
              onValueChange={(value: any) => setMetodoPago(value)}
            >
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  {getIconoMetodoPago()}
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SALDO">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Saldo en la App
                  </div>
                </SelectItem>
                <SelectItem value="DEPOSITO">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Depósito
                  </div>
                </SelectItem>
                <SelectItem value="TRANSFERENCIA">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Transferencia
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Comprobante (opcional) */}
          {(metodoPago === 'DEPOSITO' || metodoPago === 'TRANSFERENCIA') && (
            <div className="space-y-2">
              <Label htmlFor="comprobante">Referencia/Comprobante</Label>
              <Input
                id="comprobante"
                value={comprobante}
                onChange={(e) => setComprobante(e.target.value)}
                placeholder="Número de referencia o comprobante"
              />
            </div>
          )}

          {/* Observaciones */}
          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Notas adicionales sobre el pago (opcional)"
              rows={3}
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || participantesSeleccionados.size === 0}
            >
              {loading
                ? 'Registrando...'
                : participantesSeleccionados.size === 1
                ? 'Registrar Pago'
                : `Registrar ${participantesSeleccionados.size} Pagos`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
