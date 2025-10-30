
"use client"

import { useState, useEffect } from "react"
import { Session } from "next-auth"
import Link from "next/link"
import { 
  ArrowLeft, 
  Plus,
  Search, 
  Calendar,
  Receipt,
  RefreshCw,
  User,
  DollarSign,
  Trash2,
  FileText,
  ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import NuevoGastoModal from "@/components/nuevo-gasto-modal"

interface Gasto {
  id: string
  concepto: string
  monto: number
  fecha: string
  observaciones?: string
  fotoComprobante?: string
  usuario: {
    nombre: string
  }
}

interface GastosClientProps {
  session: Session
}

export default function GastosClient({ session }: GastosClientProps) {
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [filteredGastos, setFilteredGastos] = useState<Gasto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [fechaFiltro, setFechaFiltro] = useState("")
  const [showNuevoGasto, setShowNuevoGasto] = useState(false)
  const { toast } = useToast()

  const fetchGastos = async () => {
    setLoading(true)
    try {
      let url = '/api/gastos'
      if (fechaFiltro) {
        url += `?fecha=${fechaFiltro}`
      }
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setGastos(data)
        setFilteredGastos(data)
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los gastos",
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
    fetchGastos()
  }, [fechaFiltro])

  useEffect(() => {
    const filtered = gastos.filter(gasto => {
      const searchLower = searchTerm.toLowerCase()
      return (
        gasto.concepto.toLowerCase().includes(searchLower) ||
        gasto.usuario.nombre.toLowerCase().includes(searchLower) ||
        gasto.observaciones?.toLowerCase().includes(searchLower)
      )
    })
    setFilteredGastos(filtered)
  }, [searchTerm, gastos])

  const onGastoSuccess = () => {
    setShowNuevoGasto(false)
    fetchGastos() // Recargar lista
    toast({
      title: "Gasto registrado",
      description: "El gasto se ha registrado exitosamente",
    })
  }

  const handleVerComprobante = async (gastoId: string) => {
    try {
      const response = await fetch(`/api/gastos/comprobante/${gastoId}`)
      if (response.ok) {
        const data = await response.json()
        window.open(data.url, '_blank')
      } else {
        toast({
          title: "Error",
          description: "No se pudo obtener el comprobante",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Error al obtener el comprobante",
        variant: "destructive",
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CO')
  }

  const getTotalGastos = () => {
    return filteredGastos.reduce((total, gasto) => total + gasto.monto, 0)
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
                <h1 className="text-lg font-semibold text-gray-900">Gastos</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchGastos}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
              <Button
                onClick={() => setShowNuevoGasto(true)}
                className="btn-primary"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Gasto
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-mobile py-6">
        {/* Filtros */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por concepto, usuario u observaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="date"
                value={fechaFiltro}
                onChange={(e) => setFechaFiltro(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {filteredGastos.length} resultado{filteredGastos.length !== 1 ? 's' : ''}
            </div>
            
            {filteredGastos.length > 0 && (
              <div className="text-lg font-semibold text-red-600">
                Total: {formatCurrency(getTotalGastos())}
              </div>
            )}
          </div>
        </div>

        {/* Lista de gastos */}
        <div className="space-y-4">
          {filteredGastos.map((gasto, index) => (
            <Card 
              key={gasto.id} 
              className="list-item animate-fadeInScale"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <Receipt className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {gasto.concepto}
                        </h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <User className="h-3 w-3 mr-1" />
                          {gasto.usuario.nombre}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDateTime(gasto.fecha)}
                        </div>
                        {gasto.observaciones && (
                          <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                            {gasto.observaciones}
                          </p>
                        )}
                        {gasto.fotoComprobante && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => handleVerComprobante(gasto.id)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Ver comprobante
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(gasto.monto)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredGastos.length === 0 && (
            <div className="text-center py-12">
              <Receipt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay gastos registrados
              </h3>
              <p className="text-gray-500 mb-6">
                {fechaFiltro || searchTerm 
                  ? "No se encontraron gastos que coincidan con los filtros"
                  : "Comienza registrando tu primer gasto"
                }
              </p>
              <Button
                onClick={() => setShowNuevoGasto(true)}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Registrar Gasto
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de nuevo gasto */}
      <NuevoGastoModal
        isOpen={showNuevoGasto}
        onClose={() => setShowNuevoGasto(false)}
        onSuccess={onGastoSuccess}
      />
    </div>
  )
}
