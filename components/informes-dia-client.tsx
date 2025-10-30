
"use client"

import { useState, useEffect } from "react"
import { Session } from "next-auth"
import Link from "next/link"
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  Wallet,
  RefreshCw,
  Eye,
  Lock,
  CheckCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface InformeDelDia {
  fecha: string
  nombreCobrador: string
  numeroRuta: string
  totalCobrado: number
  moraCobrada: number
  dineroTransferencia: number
  totalPrestado: number
  totalGastos: number
  saldoInicial: number
  saldoEfectivo: number
  cerrado: boolean
  cierreId?: string
  cantidadPagos: number
  cantidadPrestamos: number
  cantidadGastos: number
  resumenClientes: {
    clientesNuevos: number
    clientesVisitados: number
    clientesPendientes: number
    clientesPorVisitar: number
  }
  resumenPrestamos: {
    nuevosPrestamos: number
    prestamosRealizados: number
  }
  resumenRenovaciones: {
    renovacionClientes: number
    clientesPorRenovar: number
    renovacionesPendientes: number
    renovacionesRealizadas: number
  }
  resumenTransferencias: {
    totalTransferencia: number
    transferenciasRealizadas: number
    transferenciasPendientes: number
  }
  detallePagos: Array<{
    id: string
    monto: number
    mora: number
    metodoPago: string
    fecha: string
    observaciones?: string
    cliente: {
      nombre: string
      apellido: string
      documento: string
    }
  }>
  detallePrestamos: Array<{
    id: string
    monto: number
    interes: number
    fechaInicio: string
    cliente: {
      nombre: string
      apellido: string
    }
  }>
  detalleGastos: Array<{
    id: string
    concepto: string
    monto: number
    fecha: string
    observaciones?: string
  }>
  detalleClientesNuevos: Array<{
    id: string
    nombre: string
    apellido: string
    documento: string
  }>
}

interface InformesDiaClientProps {
  session: Session
}

export default function InformesDiaClient({ session }: InformesDiaClientProps) {
  const [informe, setInforme] = useState<InformeDelDia | null>(null)
  const [loading, setLoading] = useState(true)
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [showDetalle, setShowDetalle] = useState(false)
  const { toast } = useToast()

  const fetchInforme = async (fecha: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/informes?fecha=${fecha}`)
      if (response.ok) {
        const data = await response.json()
        setInforme(data)
      } else {
        toast({
          title: "Error",
          description: "No se pudo cargar el informe",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInforme(fechaSeleccionada)
  }, [fechaSeleccionada])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleCerrarDia = async () => {
    if (!informe) return

    if (session.user.role !== "ADMINISTRADOR") {
      toast({
        title: "Sin permisos",
        description: "Solo los administradores pueden cerrar el día",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('/api/cierre-dia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fecha: fechaSeleccionada,
          totalCobrado: informe.totalCobrado,
          totalPrestado: informe.totalPrestado,
          totalGastos: informe.totalGastos,
          saldoEfectivo: informe.saldoEfectivo
        }),
      })

      if (response.ok) {
        toast({
          title: "Día cerrado",
          description: "El cierre del día se ha registrado exitosamente",
        })
        fetchInforme(fechaSeleccionada) // Recargar informe
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "No se pudo cerrar el día",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container-mobile py-4">
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container-mobile">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Informes del Día</h1>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchInforme(fechaSeleccionada)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>
      </div>

      <div className="container-mobile py-6">
        {/* Selector de fecha */}
        <div className="mb-6">
          <Label htmlFor="fecha">Fecha del informe</Label>
          <Input
            id="fecha"
            type="date"
            value={fechaSeleccionada}
            onChange={(e) => setFechaSeleccionada(e.target.value)}
            className="mt-1 max-w-xs"
          />
        </div>

        {informe && (
          <div className="space-y-6">
            {/* Header del informe */}
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {formatDate(informe.fecha)}
              </h2>
              <div className="flex flex-col items-center space-y-2">
                <div className="flex items-center space-x-2">
                  {informe.cerrado ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Día Cerrado
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <Calendar className="h-3 w-3 mr-1" />
                      Día Abierto
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Cobrador:</strong> {informe.nombreCobrador} | <strong>Ruta:</strong> {informe.numeroRuta}
                </div>
              </div>
            </div>

            {/* Tarjetas de resumen principal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="animate-fadeInScale">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Cobrado</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(informe.totalCobrado)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {informe.cantidadPagos} pago{informe.cantidadPagos !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

              <Card className="animate-fadeInScale" style={{ animationDelay: '0.1s' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Mora Cobrada</CardTitle>
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(informe.moraCobrada)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pagos con mora
                  </p>
                </CardContent>
              </Card>

              <Card className="animate-fadeInScale" style={{ animationDelay: '0.2s' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Dinero en Transferencia</CardTitle>
                  <DollarSign className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(informe.dineroTransferencia)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Transferencias bancarias
                  </p>
                </CardContent>
              </Card>

              <Card className="animate-fadeInScale" style={{ animationDelay: '0.3s' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Saldo en Efectivo</CardTitle>
                  <Wallet className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${
                    informe.saldoEfectivo >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(informe.saldoEfectivo)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Saldo inicial: {formatCurrency(informe.saldoInicial)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Resumen de Clientes y Créditos */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Resumen de Clientes y Créditos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="animate-fadeInScale">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Clientes Nuevos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {informe.resumenClientes.clientesNuevos}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Registrados hoy
                    </p>
                  </CardContent>
                </Card>

                <Card className="animate-fadeInScale" style={{ animationDelay: '0.1s' }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Clientes Visitados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {informe.resumenClientes.clientesVisitados}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Con pagos hoy
                    </p>
                  </CardContent>
                </Card>

                <Card className="animate-fadeInScale" style={{ animationDelay: '0.2s' }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Clientes Pendientes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {informe.resumenClientes.clientesPendientes}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Sin pago hoy
                    </p>
                  </CardContent>
                </Card>

                <Card className="animate-fadeInScale" style={{ animationDelay: '0.3s' }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Clientes por Visitar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {informe.resumenClientes.clientesPorVisitar}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Con préstamos activos
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Resumen de Préstamos */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Préstamos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="animate-fadeInScale">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Nuevos Préstamos</CardTitle>
                    <TrendingDown className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {informe.resumenPrestamos.nuevosPrestamos}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Otorgados hoy
                    </p>
                  </CardContent>
                </Card>

                <Card className="animate-fadeInScale" style={{ animationDelay: '0.1s' }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Préstamos Realizados</CardTitle>
                    <Wallet className="h-4 w-4 text-indigo-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-indigo-600">
                      {informe.resumenPrestamos.prestamosRealizados}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total activos
                    </p>
                  </CardContent>
                </Card>

                <Card className="animate-fadeInScale" style={{ animationDelay: '0.2s' }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Prestado</CardTitle>
                    <TrendingDown className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(informe.totalPrestado)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {informe.cantidadPrestamos} préstamo{informe.cantidadPrestamos !== 1 ? 's' : ''} hoy
                    </p>
                  </CardContent>
                </Card>

                <Card className="animate-fadeInScale" style={{ animationDelay: '0.3s' }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Gastos</CardTitle>
                    <DollarSign className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(informe.totalGastos)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {informe.cantidadGastos} gasto{informe.cantidadGastos !== 1 ? 's' : ''}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Resumen de Renovaciones */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Renovaciones</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="animate-fadeInScale">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Renovación Clientes</CardTitle>
                    <RefreshCw className="h-4 w-4 text-cyan-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-cyan-600">
                      {informe.resumenRenovaciones.renovacionClientes}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Clientes con renovaciones
                    </p>
                  </CardContent>
                </Card>

                <Card className="animate-fadeInScale" style={{ animationDelay: '0.1s' }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Clientes por Renovar</CardTitle>
                    <Calendar className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {informe.resumenRenovaciones.clientesPorRenovar}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Próximos a vencer
                    </p>
                  </CardContent>
                </Card>

                <Card className="animate-fadeInScale" style={{ animationDelay: '0.2s' }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Renovación Pendientes</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {informe.resumenRenovaciones.renovacionesPendientes}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Préstamos vencidos
                    </p>
                  </CardContent>
                </Card>

                <Card className="animate-fadeInScale" style={{ animationDelay: '0.3s' }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Renovaciones Realizadas</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {informe.resumenRenovaciones.renovacionesRealizadas}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Renovados hoy
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Resumen de Transferencias */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Transferencias</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="animate-fadeInScale">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Transferencias</CardTitle>
                    <DollarSign className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCurrency(informe.resumenTransferencias.totalTransferencia)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Monto total
                    </p>
                  </CardContent>
                </Card>

                <Card className="animate-fadeInScale" style={{ animationDelay: '0.1s' }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Transferencias Realizadas</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {informe.resumenTransferencias.transferenciasRealizadas}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Completadas hoy
                    </p>
                  </CardContent>
                </Card>

                <Card className="animate-fadeInScale" style={{ animationDelay: '0.2s' }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Transferencias Pendientes</CardTitle>
                    <TrendingDown className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {informe.resumenTransferencias.transferenciasPendientes}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Por confirmar
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => setShowDetalle(!showDetalle)}
                variant="outline"
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                {showDetalle ? 'Ocultar' : 'Ver'} Detalle
              </Button>

              {!informe.cerrado && session.user.role === "ADMINISTRADOR" && (
                <Button
                  onClick={handleCerrarDia}
                  className="flex-1 btn-primary"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Cerrar Día
                </Button>
              )}

              <Link href="/cierres-dia" className="flex-1">
                <Button variant="outline" className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  Ver Historial
                </Button>
              </Link>
            </div>

            {/* Detalle */}
            {showDetalle && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-slideInUp">
                {/* Detalle de pagos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Pagos del día</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-80 overflow-y-auto">
                    {informe.detallePagos.length > 0 ? (
                      informe.detallePagos.map(pago => (
                        <div key={pago.id} className="border-l-4 border-green-400 pl-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-sm">
                                {pago.cliente.nombre} {pago.cliente.apellido}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(pago.fecha).toLocaleTimeString('es-CO')}
                              </p>
                              <p className="text-xs text-gray-600">
                                {pago.metodoPago}
                                {pago.mora > 0 && ` | Mora: ${formatCurrency(pago.mora)}`}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">
                                {formatCurrency(pago.monto)}
                              </p>
                            </div>
                          </div>
                          {pago.observaciones && (
                            <p className="text-xs text-gray-500 mt-1">
                              {pago.observaciones}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">
                        No hay pagos registrados
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Detalle de préstamos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Préstamos del día</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-80 overflow-y-auto">
                    {informe.detallePrestamos.length > 0 ? (
                      informe.detallePrestamos.map(prestamo => (
                        <div key={prestamo.id} className="border-l-4 border-blue-400 pl-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-sm">
                                {prestamo.cliente.nombre} {prestamo.cliente.apellido}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(prestamo.fechaInicio).toLocaleTimeString('es-CO')}
                              </p>
                              <p className="text-xs text-gray-600">
                                Interés: {prestamo.interes}%
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-blue-600">
                                {formatCurrency(prestamo.monto)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">
                        No hay préstamos registrados
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Detalle de gastos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Gastos del día</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-80 overflow-y-auto">
                    {informe.detalleGastos.length > 0 ? (
                      informe.detalleGastos.map(gasto => (
                        <div key={gasto.id} className="border-l-4 border-red-400 pl-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-sm">
                                {gasto.concepto}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(gasto.fecha).toLocaleTimeString('es-CO')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-red-600">
                                {formatCurrency(gasto.monto)}
                              </p>
                            </div>
                          </div>
                          {gasto.observaciones && (
                            <p className="text-xs text-gray-500 mt-1">
                              {gasto.observaciones}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">
                        No hay gastos registrados
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Detalle de clientes nuevos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Clientes Nuevos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-80 overflow-y-auto">
                    {informe.detalleClientesNuevos.length > 0 ? (
                      informe.detalleClientesNuevos.map(cliente => (
                        <div key={cliente.id} className="border-l-4 border-blue-400 pl-3">
                          <div>
                            <p className="font-medium text-sm">
                              {cliente.nombre} {cliente.apellido}
                            </p>
                            <p className="text-xs text-gray-500">
                              Doc: {cliente.documento}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">
                        No hay clientes nuevos
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
