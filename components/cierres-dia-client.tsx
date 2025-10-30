
"use client"

import { useState, useEffect } from "react"
import { Session } from "next-auth"
import Link from "next/link"
import { 
  ArrowLeft, 
  Calendar,
  CheckCircle,
  RefreshCw,
  User,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Eye
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface CierreDia {
  id: string
  fecha: string
  totalCobrado: number
  totalPrestado: number
  totalGastos: number
  saldoEfectivo: number
  observaciones?: string
  createdAt: string
  usuario: {
    nombre: string
  }
}

interface CierresDiaClientProps {
  session: Session
}

export default function CierresDiaClient({ session }: CierresDiaClientProps) {
  const [cierres, setCierres] = useState<CierreDia[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchCierres = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/cierre-dia')
      if (response.ok) {
        const data = await response.json()
        setCierres(data)
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los cierres",
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
    fetchCierres()
  }, [])

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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CO')
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
                <h1 className="text-lg font-semibold text-gray-900">Cierres del Día</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCierres}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
              <Link href="/informes-dia">
                <Button className="btn-primary" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Informe Hoy
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container-mobile py-6">
        {/* Estadísticas generales */}
        {cierres.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="animate-fadeInScale">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Días</CardTitle>
                <Calendar className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {cierres.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Días cerrados
                </p>
              </CardContent>
            </Card>

            <Card className="animate-fadeInScale" style={{ animationDelay: '0.1s' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cobrado</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(cierres.reduce((sum, c) => sum + c.totalCobrado, 0))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Todos los días
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
                  {formatCurrency(cierres.reduce((sum, c) => sum + c.totalPrestado, 0))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Todos los días
                </p>
              </CardContent>
            </Card>

            <Card className="animate-fadeInScale" style={{ animationDelay: '0.3s' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Último Saldo</CardTitle>
                <Wallet className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  cierres[0]?.saldoEfectivo >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(cierres[0]?.saldoEfectivo || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDate(cierres[0]?.fecha)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lista de cierres */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Historial de Cierres
            </h2>
            <div className="text-sm text-gray-500">
              {cierres.length} cierre{cierres.length !== 1 ? 's' : ''}
            </div>
          </div>

          {cierres.map((cierre, index) => (
            <Card 
              key={cierre.id} 
              className="list-item animate-fadeInScale"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {formatDate(cierre.fecha)}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <User className="h-3 w-3" />
                      <span>Cerrado por {cierre.usuario.nombre}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDateTime(cierre.createdAt)}
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Cerrado
                  </Badge>
                </div>

                {/* Métricas del día */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(cierre.totalCobrado)}
                    </div>
                    <div className="text-xs text-gray-500">Cobrado</div>
                  </div>
                  
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <TrendingDown className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-blue-600">
                      {formatCurrency(cierre.totalPrestado)}
                    </div>
                    <div className="text-xs text-gray-500">Prestado</div>
                  </div>
                  
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <DollarSign className="h-5 w-5 text-red-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-red-600">
                      {formatCurrency(cierre.totalGastos)}
                    </div>
                    <div className="text-xs text-gray-500">Gastos</div>
                  </div>
                  
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <Wallet className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                    <div className={`text-lg font-bold ${
                      cierre.saldoEfectivo >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(cierre.saldoEfectivo)}
                    </div>
                    <div className="text-xs text-gray-500">Saldo Final</div>
                  </div>
                </div>

                {cierre.observaciones && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm font-medium text-gray-700 mb-1">
                      Observaciones:
                    </div>
                    <div className="text-sm text-gray-600">
                      {cierre.observaciones}
                    </div>
                  </div>
                )}

                <div className="flex justify-end mt-4">
                  <Link href={`/informes-dia?fecha=${cierre.fecha.split('T')[0]}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalle
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}

          {cierres.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay cierres registrados
              </h3>
              <p className="text-gray-500 mb-6">
                Los cierres del día aparecerán aquí una vez que se realicen
              </p>
              <Link href="/informes-dia">
                <Button className="btn-primary">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Informe del Día
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
