
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Users, Calendar, DollarSign, TrendingUp, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import RegistrarPagoSusuModal from './registrar-pago-susu-modal'
import type { Susu } from '@/lib/types-susu'

interface SusuDetalleClientProps {
  susuId: string
}

export default function SusuDetalleClient({ susuId }: SusuDetalleClientProps) {
  const { data: session } = useSession() || {}
  const router = useRouter()
  const [susu, setSusu] = useState<Susu | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalPagoOpen, setModalPagoOpen] = useState(false)

  useEffect(() => {
    cargarSusu()
  }, [susuId])

  const cargarSusu = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/susu/${susuId}`)
      if (response.ok) {
        const data = await response.json()
        setSusu(data)
      } else {
        router.push('/susu')
      }
    } catch (error) {
      console.error('Error al cargar SUSU:', error)
      router.push('/susu')
    } finally {
      setLoading(false)
    }
  }

  const getFrecuenciaLabel = (frecuencia: string) => {
    const labels = {
      SEMANAL: 'Semanal',
      QUINCENAL: 'Quincenal',
      MENSUAL: 'Mensual'
    }
    return labels[frecuencia as keyof typeof labels] || frecuencia
  }

  const getNombreCompleto = (usuario: any) => {
    if (usuario.name) return usuario.name
    if (usuario.firstName && usuario.lastName) {
      return `${usuario.firstName} ${usuario.lastName}`
    }
    return usuario.email
  }

  const calcularMontoPorPeriodo = () => {
    if (!susu || susu.participantes.length === 0) return 0
    return Number(susu.montoTotal) / susu.participantes.length
  }

  const getPeriodoActual = () => {
    if (!susu) return 1
    // Contar cuántos participantes ya recibieron + 1
    const participantesRecibieron = susu.participantes.filter(p => p.yaRecibio).length
    return participantesRecibieron + 1
  }

  const getParticipanteActual = () => {
    if (!susu) return null
    const periodoActual = getPeriodoActual()
    return susu.participantes.find(p => p.orden === periodoActual)
  }

  const calcularProgresoPorParticipante = (participante: any) => {
    const totalPeriodos = susu?.participantes.length || 1
    const pagosRealizados = participante.pagos?.length || 0
    return Math.round((pagosRealizados / totalPeriodos) * 100)
  }

  const getEstadoPago = (participante: any, periodo: number) => {
    const pago = participante.pagos?.find((p: any) => p.numeroPeriodo === periodo)
    if (!pago) {
      if (periodo < getPeriodoActual()) {
        return { estado: 'RETRASO', label: 'Retraso', color: 'text-red-600' }
      }
      return { estado: 'PENDIENTE', label: 'Pendiente', color: 'text-yellow-600' }
    }
    return { estado: 'COMPLETADO', label: 'Pagado', color: 'text-green-600' }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando detalles del SUSU...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!susu) {
    return null
  }

  const periodoActual = getPeriodoActual()
  const participanteActual = getParticipanteActual()
  const montoPorPeriodo = calcularMontoPorPeriodo()

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/susu')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>

      {/* Información Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{susu.nombre}</CardTitle>
                <CardDescription className="mt-2">
                  {susu.descripcion || 'Sin descripción'}
                </CardDescription>
              </div>
              <Badge variant={susu.estado === 'ACTIVO' ? 'default' : 'secondary'}>
                {susu.estado}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Monto Total</div>
                <div className="text-2xl font-bold text-green-600">
                  S/ {Number(susu.montoTotal).toFixed(2)}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Monto por Periodo</div>
                <div className="text-2xl font-bold text-blue-600">
                  S/ {montoPorPeriodo.toFixed(2)}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Frecuencia</div>
                <div className="text-lg font-semibold">
                  {getFrecuenciaLabel(susu.frecuencia)}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Participantes</div>
                <div className="text-lg font-semibold">
                  {susu.participantes.length}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Fecha de Inicio:</span>{' '}
                  <span className="font-medium">
                    {format(new Date(susu.fechaInicio), 'dd MMM yyyy', { locale: es })}
                  </span>
                </div>
                {susu.fechaFin && (
                  <div>
                    <span className="text-muted-foreground">Fecha de Fin:</span>{' '}
                    <span className="font-medium">
                      {format(new Date(susu.fechaFin), 'dd MMM yyyy', { locale: es })}
                    </span>
                  </div>
                )}
                <div className="col-span-2">
                  <span className="text-muted-foreground">Creado por:</span>{' '}
                  <span className="font-medium">
                    {getNombreCompleto(susu.creador)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Periodo Actual */}
        <Card>
          <CardHeader>
            <CardTitle>Periodo Actual</CardTitle>
            <CardDescription>
              {susu.estado === 'COMPLETADO' 
                ? 'SUSU Completado' 
                : `Periodo ${periodoActual} de ${susu.participantes.length}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {susu.estado === 'ACTIVO' && participanteActual && (
              <>
                <div className="p-4 bg-primary/10 rounded-lg space-y-2">
                  <div className="text-sm text-muted-foreground">Le toca recibir a:</div>
                  <div className="text-lg font-bold">
                    {getNombreCompleto(participanteActual.usuario)}
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    S/ {Number(susu.montoTotal).toFixed(2)}
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => setModalPagoOpen(true)}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Registrar Pago
                </Button>
              </>
            )}

            {susu.estado === 'COMPLETADO' && (
              <div className="text-center py-8">
                <CheckCircle2 className="h-16 w-16 mx-auto text-green-600 mb-4" />
                <p className="text-sm text-muted-foreground">
                  Este SUSU ha sido completado exitosamente
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs de detalles */}
      <Tabs defaultValue="participantes" className="w-full">
        <TabsList>
          <TabsTrigger value="participantes">Participantes</TabsTrigger>
          <TabsTrigger value="pagos">Historial de Pagos</TabsTrigger>
          <TabsTrigger value="orden">Orden de Cobro</TabsTrigger>
        </TabsList>

        <TabsContent value="participantes" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {susu.participantes.map((participante) => {
              const progreso = calcularProgresoPorParticipante(participante)
              const estadoPeriodoActual = getEstadoPago(participante, periodoActual)

              return (
                <Card key={participante.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {getNombreCompleto(participante.usuario)}
                        </CardTitle>
                        <CardDescription>
                          Orden #{participante.orden}
                        </CardDescription>
                      </div>
                      {participante.yaRecibio ? (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Ya recibió
                        </Badge>
                      ) : participante.orden === periodoActual ? (
                        <Badge variant="default" className="bg-blue-600">
                          <Clock className="h-3 w-3 mr-1" />
                          Le toca ahora
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Pendiente
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Pagos Realizados</span>
                        <span className="font-semibold">
                          {participante.pagos?.length || 0} / {susu.participantes.length}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${progreso}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Estado actual:</span>{' '}
                        <span className={`font-semibold ${estadoPeriodoActual.color}`}>
                          {estadoPeriodoActual.label}
                        </span>
                      </div>
                    </div>

                    {participante.yaRecibio && participante.fechaRecepcion && (
                      <div className="text-xs text-muted-foreground">
                        Recibió el{' '}
                        {format(new Date(participante.fechaRecepcion), 'dd MMM yyyy', { locale: es })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="pagos">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Pagos</CardTitle>
              <CardDescription>
                Todos los pagos registrados en este SUSU
              </CardDescription>
            </CardHeader>
            <CardContent>
              {susu.pagos.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No hay pagos registrados aún
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {susu.pagos.map((pago) => {
                    const participante = susu.participantes.find(p => p.id === pago.participanteId)
                    return (
                      <div
                        key={pago.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium">
                            {participante ? getNombreCompleto(participante.usuario) : 'Desconocido'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Periodo {pago.numeroPeriodo} • {' '}
                            {format(new Date(pago.fechaPago), 'dd MMM yyyy HH:mm', { locale: es })}
                          </div>
                          {pago.observaciones && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {pago.observaciones}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            S/ {Number(pago.monto).toFixed(2)}
                          </div>
                          <Badge variant="outline" className="mt-1">
                            {pago.metodoPago}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orden">
          <Card>
            <CardHeader>
              <CardTitle>Orden de Cobro</CardTitle>
              <CardDescription>
                Orden en que los participantes recibirán el monto total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {susu.participantes
                  .sort((a, b) => a.orden - b.orden)
                  .map((participante, index) => (
                    <div
                      key={participante.id}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                        participante.yaRecibio
                          ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                          : participante.orden === periodoActual
                          ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`
                          w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold
                          ${participante.yaRecibio 
                            ? 'bg-green-600 text-white' 
                            : participante.orden === periodoActual
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700'}
                        `}>
                          {participante.orden}
                        </div>
                        <div>
                          <div className="font-medium">
                            {getNombreCompleto(participante.usuario)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {participante.usuario.email}
                          </div>
                        </div>
                      </div>
                      <div>
                        {participante.yaRecibio ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Completado
                          </Badge>
                        ) : participante.orden === periodoActual ? (
                          <Badge variant="default" className="bg-blue-600">
                            <Clock className="h-3 w-3 mr-1" />
                            En curso
                          </Badge>
                        ) : participante.orden < periodoActual ? (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Pendiente
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Por venir
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Registrar Pago */}
      <RegistrarPagoSusuModal
        open={modalPagoOpen}
        onOpenChange={setModalPagoOpen}
        susu={susu}
        periodoActual={periodoActual}
        onPagoRegistrado={cargarSusu}
      />
    </div>
  )
}
