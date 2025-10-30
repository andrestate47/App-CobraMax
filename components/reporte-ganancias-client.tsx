

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
  Download,
  Filter,
  BarChart3,
  PieChart,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calculator,
  Repeat,
  Users,
  CreditCard,
  ArrowRightLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"


interface ReporteGanancias {
  periodo: {
    fechaInicio: string
    fechaFin: string
  }
  metricas: {
    capitalInvertido: number
    balancePendiente: number
    capitalRecuperado: number
    capitalNoRecuperado: number
    totalIntereses: number
    interesesCobrados: number
    totalGastos: number
    moraCobrada: number
    utilidadNeta: number
    roi: number
  }
  estadisticas: {
    cantidadPrestamos: number
    cantidadPagos: number
    cantidadGastos: number
    cantidadClientesActivos: number
    prestamosAlDia: number
    prestamosVencidos: number
    promedioPrestamosDia: number
    promedioPagosDia: number
  }
  renovaciones: {
    generales: number
    nuevas: number
    pendientes: number
    porRealizar: number
    realizadas: number
    detalles: Array<{
      id: string
      cliente: string
      documento: string
      montoOriginal: number
      montoNuevo: number
      estado: string
      fechaCreacion: string
    }>
  }
  intereses: {
    totalGenerado: number
    totalGanado: number
    porCliente: Array<{
      clienteId: string
      nombre: string
      documento: string
      interesGenerado: number
      interesGanado: number
    }>
  }
  transferencias: {
    realizadas: number
    pendientes: number
    clientesTotales: number
    valorTotal: number
    detalles: Array<{
      id: string
      cliente: string
      documento: string
      monto: number
      fecha: string
    }>
  }
  salarios: {
    administradores: Array<{
      id: string
      nombre: string
      apellido: string
      nombreCompleto: string
      email: string
      salario: number
      pagoSemanal: number
      pagoQuincenal: number
      pagoMensual: number
      comisionPorCobro: number
    }>
    supervisores: Array<{
      id: string
      nombre: string
      apellido: string
      nombreCompleto: string
      email: string
      salario: number
      pagoSemanal: number
      pagoQuincenal: number
      pagoMensual: number
      comisionPorCobro: number
    }>
    cobradores: Array<{
      id: string
      numeroRuta: string
      nombre: string
      apellido: string
      nombreCompleto: string
      email: string
      salario: number
      pagoSemanal: number
      pagoQuincenal: number
      pagoMensual: number
      comisionPorCobro: number
    }>
    totalSalarios: number
    cantidadUsuarios: number
    totalesPorRol: {
      administradores: number
      supervisores: number
      cobradores: number
    }
    promediosPorRol: {
      administradores: number
      supervisores: number
      cobradores: number
    }
    pagosGenerales: {
      semanal: number
      quincenal: number
      mensual: number
    }
    porcentajesPorRol: {
      administradores: number
      supervisores: number
      cobradores: number
    }
  }
  detalles: {
    prestamos: Array<{
      id: string
      cliente: string
      documento: string
      monto: number
      interes: number
      saldoPendiente: number
      fechaInicio: string
      fechaVencimiento: string
      pagosEnPeriodo: number
      montoPagado: number
    }>
    pagos: Array<{
      id: string
      cliente: string
      monto: number
      fecha: string
      prestamoId: string
      observaciones?: string
    }>
    gastos: Array<{
      id: string
      concepto: string
      monto: number
      fecha: string
      observaciones?: string
    }>
  }
}

interface ReporteGananciasClientProps {
  session: Session
}

export default function ReporteGananciasClient({ session }: ReporteGananciasClientProps) {
  const [reporte, setReporte] = useState<ReporteGanancias | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("resumen")
  const [fechaInicio, setFechaInicio] = useState(() => {
    const hoy = new Date()
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    return primerDiaMes.toISOString().split('T')[0]
  })
  const [fechaFin, setFechaFin] = useState(() => {
    const hoy = new Date()
    return hoy.toISOString().split('T')[0]
  })
  const { toast } = useToast()

  const fetchReporte = async (inicio: string, fin: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/reportes/ganancias?fechaInicio=${inicio}&fechaFin=${fin}`)
      if (response.ok) {
        const data = await response.json()
        setReporte(data)
      } else {
        toast({
          title: "Error",
          description: "No se pudo cargar el reporte de ganancias",
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
    fetchReporte(fechaInicio, fechaFin)
  }, [fechaInicio, fechaFin])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  const aplicarFiltroRapido = (tipo: string) => {
    const hoy = new Date()
    let inicio: Date
    let fin: Date = new Date(hoy)

    switch (tipo) {
      case 'hoy':
        inicio = new Date(hoy)
        break
      case 'semana':
        inicio = new Date(hoy)
        inicio.setDate(hoy.getDate() - 7)
        break
      case 'mes':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
        break
      case 'trimestre':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 3, 1)
        break
      case 'año':
        inicio = new Date(hoy.getFullYear(), 0, 1)
        break
      default:
        return
    }

    setFechaInicio(inicio.toISOString().split('T')[0])
    setFechaFin(fin.toISOString().split('T')[0])
  }

  const exportarReporte = () => {
    if (!reporte) return

    try {
      // Crear datos para exportar
      const datosExportacion = {
        titulo: "Reporte de Ganancias",
        periodo: `${formatDate(reporte.periodo.fechaInicio)} - ${formatDate(reporte.periodo.fechaFin)}`,
        metricas: {
          "Capital Invertido": formatCurrency(reporte.metricas.capitalInvertido),
          "Balance Pendiente": formatCurrency(reporte.metricas.balancePendiente),
          "Capital Recuperado": formatCurrency(reporte.metricas.capitalRecuperado),
          "Capital No Recuperado": formatCurrency(reporte.metricas.capitalNoRecuperado),
          "Total Intereses": formatCurrency(reporte.metricas.totalIntereses),
          "Intereses Cobrados": formatCurrency(reporte.metricas.interesesCobrados),
          "Total de Gastos": formatCurrency(reporte.metricas.totalGastos),
          "Mora Cobrada": formatCurrency(reporte.metricas.moraCobrada),
          "Utilidad Neta": formatCurrency(reporte.metricas.utilidadNeta),
          "ROI (%)": formatPercentage(reporte.metricas.roi)
        },
        estadisticas: reporte.estadisticas,
        generado: new Date().toLocaleString('es-CO')
      }

      // Convertir a JSON y crear archivo
      const dataStr = JSON.stringify(datosExportacion, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      // Crear link de descarga
      const link = document.createElement('a')
      link.href = url
      link.download = `reporte_ganancias_${fechaInicio}_${fechaFin}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Exportación exitosa",
        description: "El reporte se ha descargado correctamente",
      })
    } catch (error) {
      console.error("Error al exportar:", error)
      toast({
        title: "Error",
        description: "No se pudo exportar el reporte",
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

  if (!reporte) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container-mobile py-4">
          <Card>
            <CardContent className="text-center py-12">
              <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No se pudo cargar el reporte
              </h3>
              <p className="text-gray-600">
                Inténtalo de nuevo más tarde
              </p>
            </CardContent>
          </Card>
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
                <h1 className="text-lg font-semibold text-gray-900">Reporte de Ganancias</h1>
                <p className="text-sm text-gray-600">
                  {formatDate(reporte.periodo.fechaInicio)} - {formatDate(reporte.periodo.fechaFin)}
                </p>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={exportarReporte}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      <div className="container-mobile py-6 space-y-6">
        {/* Filtros de fecha */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros de Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Filtros rápidos */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Períodos rápidos</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[
                    { key: 'hoy', label: 'Hoy' },
                    { key: 'semana', label: 'Última semana' },
                    { key: 'mes', label: 'Este mes' },
                    { key: 'trimestre', label: 'Último trimestre' },
                    { key: 'año', label: 'Este año' }
                  ].map(filtro => (
                    <Button
                      key={filtro.key}
                      variant="outline"
                      size="sm"
                      onClick={() => aplicarFiltroRapido(filtro.key)}
                    >
                      {filtro.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Rango personalizado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fechaInicio">Fecha de inicio</Label>
                  <Input
                    id="fechaInicio"
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="fechaFin">Fecha de fin</Label>
                  <Input
                    id="fechaFin"
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Capital Invertido */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Capital Invertido</CardTitle>
              <Wallet className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(reporte.metricas.capitalInvertido)}
              </div>
              <p className="text-xs text-gray-600">
                {reporte.estadisticas.cantidadPrestamos} préstamos
              </p>
            </CardContent>
          </Card>

          {/* Balance Pendiente */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance Pendiente</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(reporte.metricas.balancePendiente)}
              </div>
              <p className="text-xs text-gray-600">
                {reporte.estadisticas.prestamosAlDia + reporte.estadisticas.prestamosVencidos} préstamos pendientes
              </p>
            </CardContent>
          </Card>

          {/* Capital Recuperado */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Capital Recuperado</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(reporte.metricas.capitalRecuperado)}
              </div>
              <p className="text-xs text-gray-600">
                {reporte.estadisticas.cantidadPagos} pagos recibidos
              </p>
            </CardContent>
          </Card>

          {/* Capital No Recuperado */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Capital No Recuperado</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(reporte.metricas.capitalNoRecuperado)}
              </div>
              <p className="text-xs text-gray-600">
                {reporte.estadisticas.prestamosVencidos} préstamos vencidos
              </p>
            </CardContent>
          </Card>

          {/* Total Intereses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Intereses</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(reporte.metricas.totalIntereses)}
              </div>
              <p className="text-xs text-gray-600">
                Intereses generados
              </p>
            </CardContent>
          </Card>

          {/* Intereses Cobrados */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Intereses Cobrados</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(reporte.metricas.interesesCobrados)}
              </div>
              <p className="text-xs text-gray-600">
                {formatPercentage((reporte.metricas.interesesCobrados / Math.max(reporte.metricas.totalIntereses, 1)) * 100)} del total
              </p>
            </CardContent>
          </Card>

          {/* Total de Gastos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Gastos</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(reporte.metricas.totalGastos)}
              </div>
              <p className="text-xs text-gray-600">
                {reporte.estadisticas.cantidadGastos} gastos registrados
              </p>
            </CardContent>
          </Card>

          {/* Mora Cobrada */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mora Cobrada</CardTitle>
              <Target className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">
                {formatCurrency(reporte.metricas.moraCobrada)}
              </div>
              <p className="text-xs text-gray-600">
                Por pagos tardíos
              </p>
            </CardContent>
          </Card>

          {/* Utilidad Neta */}
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilidad Neta</CardTitle>
              <Calculator className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${
                reporte.metricas.utilidadNeta >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {formatCurrency(reporte.metricas.utilidadNeta)}
              </div>
              <p className="text-xs text-gray-600">
                ROI: {formatPercentage(reporte.metricas.roi)}
              </p>
              <Badge variant={reporte.metricas.utilidadNeta >= 0 ? "default" : "destructive"} className="mt-2">
                {reporte.metricas.utilidadNeta >= 0 ? "Ganancia" : "Pérdida"}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Sección de Renovaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="h-5 w-5 text-blue-600" />
              Reporte de Renovaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{reporte.renovaciones?.generales || 0}</p>
                <p className="text-xs text-gray-600">Renovaciones Generales</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{reporte.renovaciones?.nuevas || 0}</p>
                <p className="text-xs text-gray-600">Renovaciones Nuevas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{reporte.renovaciones?.pendientes || 0}</p>
                <p className="text-xs text-gray-600">Renovaciones Pendientes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{reporte.renovaciones?.porRealizar || 0}</p>
                <p className="text-xs text-gray-600">Por Realizar</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">{reporte.renovaciones?.realizadas || 0}</p>
                <p className="text-xs text-gray-600">Renovaciones Realizadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sección de Intereses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Intereses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(reporte.intereses?.totalGenerado || 0)}
                </p>
                <p className="text-sm text-gray-600">Interés Total Generado</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(reporte.intereses?.totalGanado || 0)}
                </p>
                <p className="text-sm text-gray-600">Interés Total Ganado</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sección de Transferencias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-indigo-600" />
              Transferencias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{reporte.transferencias?.realizadas || 0}</p>
                <p className="text-xs text-gray-600">Transferencias Realizadas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{reporte.transferencias?.pendientes || 0}</p>
                <p className="text-xs text-gray-600">Transferencias Pendientes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{reporte.transferencias?.clientesTotales || 0}</p>
                <p className="text-xs text-gray-600">Clientes por Transferencia</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(reporte.transferencias?.valorTotal || 0)}
                </p>
                <p className="text-xs text-gray-600">Valor Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sección de Salarios de Usuarios - Vista General */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Reporte de Salario de Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">
                  {formatCurrency(reporte.salarios?.totalSalarios || 0)}
                </p>
                <p className="text-sm text-gray-600">Total en Salarios Mensuales</p>
                <p className="text-xs text-gray-500 mt-1">{reporte.salarios?.cantidadUsuarios || 0} usuarios activos</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-lg font-bold text-red-600">{reporte.salarios?.administradores?.length || 0}</p>
                  <p className="text-xs text-gray-600">Administradores</p>
                  <p className="text-sm font-semibold text-red-700 mt-1">
                    {formatCurrency(reporte.salarios?.totalesPorRol?.administradores || 0)}
                  </p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-lg font-bold text-blue-600">{reporte.salarios?.supervisores?.length || 0}</p>
                  <p className="text-xs text-gray-600">Supervisores</p>
                  <p className="text-sm font-semibold text-blue-700 mt-1">
                    {formatCurrency(reporte.salarios?.totalesPorRol?.supervisores || 0)}
                  </p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-lg font-bold text-green-600">{reporte.salarios?.cobradores?.length || 0}</p>
                  <p className="text-xs text-gray-600">Cobradores</p>
                  <p className="text-sm font-semibold text-green-700 mt-1">
                    {formatCurrency(reporte.salarios?.totalesPorRol?.cobradores || 0)}
                  </p>
                </div>
              </div>

              {/* Pagos Generales Totales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs text-gray-600 mb-1">Pago Semanal Total</p>
                  <p className="text-lg font-bold text-purple-600">
                    {formatCurrency(reporte.salarios?.pagosGenerales?.semanal || 0)}
                  </p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs text-gray-600 mb-1">Pago Quincenal Total</p>
                  <p className="text-lg font-bold text-purple-600">
                    {formatCurrency(reporte.salarios?.pagosGenerales?.quincenal || 0)}
                  </p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs text-gray-600 mb-1">Pago Mensual Total</p>
                  <p className="text-lg font-bold text-purple-600">
                    {formatCurrency(reporte.salarios?.pagosGenerales?.mensual || 0)}
                  </p>
                </div>
              </div>

              {/* Distribución Porcentual */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Distribución de Gastos por Perfil</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span className="text-sm text-gray-600">Administradores</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatPercentage(reporte.salarios?.porcentajesPorRol?.administradores || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span className="text-sm text-gray-600">Supervisores</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatPercentage(reporte.salarios?.porcentajesPorRol?.supervisores || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="text-sm text-gray-600">Cobradores</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatPercentage(reporte.salarios?.porcentajesPorRol?.cobradores || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs para detalles */}
        <div className="space-y-4">
          <div className="flex overflow-x-auto space-x-1 bg-muted p-1 rounded-lg">
            {[
              { key: 'resumen', label: 'Resumen' },
              { key: 'prestamos', label: 'Préstamos' },
              { key: 'pagos', label: 'Pagos' },
              { key: 'gastos', label: 'Gastos' },
              { key: 'renovaciones', label: 'Renovaciones' },
              { key: 'intereses', label: 'Intereses' },
              { key: 'transferencias', label: 'Transferencias' },
              { key: 'salarios', label: 'Salarios' }
            ].map(tab => (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(tab.key)}
                className={`flex-shrink-0 ${
                  activeTab === tab.key 
                    ? 'bg-background shadow-sm' 
                    : 'hover:bg-background/50'
                }`}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {activeTab === "resumen" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Estadísticas generales */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Estadísticas Generales
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Clientes activos:</span>
                    <span className="font-semibold">{reporte.estadisticas.cantidadClientesActivos}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Promedio préstamos:</span>
                    <span className="font-semibold">{formatCurrency(reporte.estadisticas.promedioPrestamosDia)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Promedio pagos:</span>
                    <span className="font-semibold">{formatCurrency(reporte.estadisticas.promedioPagosDia)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Préstamos al día:</span>
                    <span className="font-semibold text-green-600">{reporte.estadisticas.prestamosAlDia}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Préstamos vencidos:</span>
                    <span className="font-semibold text-red-600">{reporte.estadisticas.prestamosVencidos}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Análisis de rentabilidad */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Análisis de Rentabilidad
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ingresos totales:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(reporte.metricas.capitalRecuperado + reporte.metricas.interesesCobrados + reporte.metricas.moraCobrada)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Egresos totales:</span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(reporte.metricas.capitalInvertido + reporte.metricas.totalGastos)}
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-900 font-medium">Margen de ganancia:</span>
                      <span className={`font-bold ${
                        reporte.metricas.utilidadNeta >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatPercentage(reporte.metricas.roi)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "prestamos" && (
            <Card>
              <CardHeader>
                <CardTitle>Detalle de Préstamos ({reporte.detalles.prestamos.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {reporte.detalles.prestamos.map(prestamo => (
                    <div key={prestamo.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{prestamo.cliente}</p>
                          <p className="text-sm text-gray-600">CC: {prestamo.documento}</p>
                        </div>
                        <Badge variant={prestamo.saldoPendiente > 0 ? "secondary" : "default"}>
                          {prestamo.saldoPendiente > 0 ? "Pendiente" : "Pagado"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Monto:</span>
                          <p className="font-semibold">{formatCurrency(prestamo.monto)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Interés:</span>
                          <p className="font-semibold">{prestamo.interes}%</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Saldo:</span>
                          <p className="font-semibold">{formatCurrency(prestamo.saldoPendiente)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Pagado:</span>
                          <p className="font-semibold text-green-600">{formatCurrency(prestamo.montoPagado)}</p>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Inicio: {formatDate(prestamo.fechaInicio)}</span>
                        <span>Vencimiento: {formatDate(prestamo.fechaVencimiento)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "pagos" && (
            <Card>
              <CardHeader>
                <CardTitle>Detalle de Pagos ({reporte.detalles.pagos.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {reporte.detalles.pagos.map(pago => (
                    <div key={pago.id} className="border-l-4 border-green-400 pl-3 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{pago.cliente}</p>
                          <p className="text-sm text-gray-600">{formatDate(pago.fecha)}</p>
                          {pago.observaciones && (
                            <p className="text-xs text-gray-500 mt-1">{pago.observaciones}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(pago.monto)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "gastos" && (
            <Card>
              <CardHeader>
                <CardTitle>Detalle de Gastos ({reporte.detalles.gastos.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {reporte.detalles.gastos.map(gasto => (
                    <div key={gasto.id} className="border-l-4 border-red-400 pl-3 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{gasto.concepto}</p>
                          <p className="text-sm text-gray-600">{formatDate(gasto.fecha)}</p>
                          {gasto.observaciones && (
                            <p className="text-xs text-gray-500 mt-1">{gasto.observaciones}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-600">
                            {formatCurrency(gasto.monto)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "renovaciones" && (
            <Card>
              <CardHeader>
                <CardTitle>Detalle de Renovaciones ({reporte.renovaciones?.detalles?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {reporte.renovaciones?.detalles && reporte.renovaciones.detalles.length > 0 ? (
                    reporte.renovaciones.detalles.map(renovacion => (
                      <div key={renovacion.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{renovacion.cliente}</p>
                            <p className="text-sm text-gray-600">CC: {renovacion.documento}</p>
                          </div>
                          <Badge variant={renovacion.estado === 'REALIZADA' ? "default" : "secondary"}>
                            {renovacion.estado}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Monto Original:</span>
                            <p className="font-semibold">{formatCurrency(renovacion.montoOriginal)}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Monto Nuevo:</span>
                            <p className="font-semibold">{formatCurrency(renovacion.montoNuevo)}</p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          <span>Fecha: {formatDate(renovacion.fechaCreacion)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">No hay renovaciones en este período</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "intereses" && (
            <Card>
              <CardHeader>
                <CardTitle>Intereses por Cliente ({reporte.intereses?.porCliente?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {reporte.intereses?.porCliente && reporte.intereses.porCliente.length > 0 ? (
                    reporte.intereses.porCliente.map((cliente, index) => (
                      <div key={cliente.clienteId || index} className="border-l-4 border-purple-400 pl-3 py-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{cliente.nombre}</p>
                            <p className="text-sm text-gray-600">CC: {cliente.documento}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-600">Generado</p>
                            <p className="text-sm font-bold text-purple-600">
                              {formatCurrency(cliente.interesGenerado)}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">Ganado</p>
                            <p className="text-sm font-bold text-green-600">
                              {formatCurrency(cliente.interesGanado)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">No hay datos de intereses por cliente en este período</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "transferencias" && (
            <Card>
              <CardHeader>
                <CardTitle>Detalle de Transferencias ({reporte.transferencias?.detalles?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {reporte.transferencias?.detalles && reporte.transferencias.detalles.length > 0 ? (
                    reporte.transferencias.detalles.map(transferencia => (
                      <div key={transferencia.id} className="border-l-4 border-indigo-400 pl-3 py-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{transferencia.cliente}</p>
                            <p className="text-sm text-gray-600">CC: {transferencia.documento}</p>
                            <p className="text-sm text-gray-600">{formatDate(transferencia.fecha)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-indigo-600">
                              {formatCurrency(transferencia.monto)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">No hay transferencias en este período</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "salarios" && (
            <div className="space-y-4">
              {/* Estadísticas Generales de Salarios */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-purple-600" />
                    Estadísticas de Salarios por Perfil
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <h4 className="text-sm font-semibold text-red-900 mb-3">Administradores</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Cantidad:</span>
                          <span className="font-semibold">{reporte.salarios?.administradores?.length || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Promedio:</span>
                          <span className="font-semibold">{formatCurrency(reporte.salarios?.promediosPorRol?.administradores || 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-bold text-red-600">{formatCurrency(reporte.salarios?.totalesPorRol?.administradores || 0)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="text-sm font-semibold text-blue-900 mb-3">Supervisores</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Cantidad:</span>
                          <span className="font-semibold">{reporte.salarios?.supervisores?.length || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Promedio:</span>
                          <span className="font-semibold">{formatCurrency(reporte.salarios?.promediosPorRol?.supervisores || 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-bold text-blue-600">{formatCurrency(reporte.salarios?.totalesPorRol?.supervisores || 0)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="text-sm font-semibold text-green-900 mb-3">Cobradores</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Cantidad:</span>
                          <span className="font-semibold">{reporte.salarios?.cobradores?.length || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Promedio:</span>
                          <span className="font-semibold">{formatCurrency(reporte.salarios?.promediosPorRol?.cobradores || 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-bold text-green-600">{formatCurrency(reporte.salarios?.totalesPorRol?.cobradores || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Administradores */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-red-600" />
                    Administradores ({reporte.salarios?.administradores?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reporte.salarios?.administradores && reporte.salarios.administradores.length > 0 ? (
                      reporte.salarios.administradores.map(admin => (
                        <div key={admin.id} className="border border-red-200 p-4 bg-red-50 rounded-lg">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {admin.nombre} {admin.apellido}
                              </p>
                              <p className="text-sm text-gray-600">{admin.email}</p>
                            </div>
                            <Badge className="bg-red-600">Administrador</Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="text-center p-2 bg-white rounded">
                              <p className="text-xs text-gray-600">Pago Semanal</p>
                              <p className="text-sm font-bold text-red-600">{formatCurrency(admin.pagoSemanal)}</p>
                            </div>
                            <div className="text-center p-2 bg-white rounded">
                              <p className="text-xs text-gray-600">Pago Quincenal</p>
                              <p className="text-sm font-bold text-red-600">{formatCurrency(admin.pagoQuincenal)}</p>
                            </div>
                            <div className="text-center p-2 bg-white rounded">
                              <p className="text-xs text-gray-600">Pago Mensual</p>
                              <p className="text-sm font-bold text-red-600">{formatCurrency(admin.pagoMensual)}</p>
                            </div>
                            <div className="text-center p-2 bg-white rounded">
                              <p className="text-xs text-gray-600">Comisión</p>
                              <p className="text-sm font-bold text-gray-900">{admin.comisionPorCobro}%</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">No hay administradores registrados</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Supervisores */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Supervisores ({reporte.salarios?.supervisores?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reporte.salarios?.supervisores && reporte.salarios.supervisores.length > 0 ? (
                      reporte.salarios.supervisores.map(supervisor => (
                        <div key={supervisor.id} className="border border-blue-200 p-4 bg-blue-50 rounded-lg">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {supervisor.nombre} {supervisor.apellido}
                              </p>
                              <p className="text-sm text-gray-600">{supervisor.email}</p>
                            </div>
                            <Badge className="bg-blue-600">Supervisor</Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="text-center p-2 bg-white rounded">
                              <p className="text-xs text-gray-600">Pago Semanal</p>
                              <p className="text-sm font-bold text-blue-600">{formatCurrency(supervisor.pagoSemanal)}</p>
                            </div>
                            <div className="text-center p-2 bg-white rounded">
                              <p className="text-xs text-gray-600">Pago Quincenal</p>
                              <p className="text-sm font-bold text-blue-600">{formatCurrency(supervisor.pagoQuincenal)}</p>
                            </div>
                            <div className="text-center p-2 bg-white rounded">
                              <p className="text-xs text-gray-600">Pago Mensual</p>
                              <p className="text-sm font-bold text-blue-600">{formatCurrency(supervisor.pagoMensual)}</p>
                            </div>
                            <div className="text-center p-2 bg-white rounded">
                              <p className="text-xs text-gray-600">Comisión</p>
                              <p className="text-sm font-bold text-gray-900">{supervisor.comisionPorCobro}%</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">No hay supervisores registrados</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Cobradores */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    Cobradores ({reporte.salarios?.cobradores?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reporte.salarios?.cobradores && reporte.salarios.cobradores.length > 0 ? (
                      reporte.salarios.cobradores.map(cobrador => (
                        <div key={cobrador.id} className="border border-green-200 p-4 bg-green-50 rounded-lg">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="border-green-600 text-green-700">
                                  {cobrador.numeroRuta}
                                </Badge>
                              </div>
                              <p className="font-semibold text-gray-900">
                                {cobrador.nombre} {cobrador.apellido}
                              </p>
                              <p className="text-sm text-gray-600">{cobrador.email}</p>
                            </div>
                            <Badge className="bg-green-600">Cobrador</Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="text-center p-2 bg-white rounded">
                              <p className="text-xs text-gray-600">Pago Semanal</p>
                              <p className="text-sm font-bold text-green-600">{formatCurrency(cobrador.pagoSemanal)}</p>
                            </div>
                            <div className="text-center p-2 bg-white rounded">
                              <p className="text-xs text-gray-600">Pago Quincenal</p>
                              <p className="text-sm font-bold text-green-600">{formatCurrency(cobrador.pagoQuincenal)}</p>
                            </div>
                            <div className="text-center p-2 bg-white rounded">
                              <p className="text-xs text-gray-600">Pago Mensual</p>
                              <p className="text-sm font-bold text-green-600">{formatCurrency(cobrador.pagoMensual)}</p>
                            </div>
                            <div className="text-center p-2 bg-white rounded">
                              <p className="text-xs text-gray-600">Comisión</p>
                              <p className="text-sm font-bold text-gray-900">{cobrador.comisionPorCobro}%</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">No hay cobradores registrados</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Resumen Total de Salarios */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-purple-600" />
                    Resumen Total de Salarios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                      <div>
                        <span className="text-gray-600">Total Administradores</span>
                        <p className="text-xs text-gray-500">{reporte.salarios?.administradores?.length || 0} usuarios</p>
                      </div>
                      <span className="font-bold text-red-600">
                        {formatCurrency(reporte.salarios?.totalesPorRol?.administradores || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div>
                        <span className="text-gray-600">Total Supervisores</span>
                        <p className="text-xs text-gray-500">{reporte.salarios?.supervisores?.length || 0} usuarios</p>
                      </div>
                      <span className="font-bold text-blue-600">
                        {formatCurrency(reporte.salarios?.totalesPorRol?.supervisores || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <div>
                        <span className="text-gray-600">Total Cobradores</span>
                        <p className="text-xs text-gray-500">{reporte.salarios?.cobradores?.length || 0} usuarios</p>
                      </div>
                      <span className="font-bold text-green-600">
                        {formatCurrency(reporte.salarios?.totalesPorRol?.cobradores || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-purple-100 rounded-lg border-2 border-purple-300">
                      <div>
                        <span className="text-lg font-semibold text-gray-900">Total General</span>
                        <p className="text-xs text-gray-600">{reporte.salarios?.cantidadUsuarios || 0} usuarios activos</p>
                      </div>
                      <span className="text-2xl font-bold text-purple-600">
                        {formatCurrency(reporte.salarios?.totalSalarios || 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

