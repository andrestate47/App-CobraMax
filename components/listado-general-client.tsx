
"use client"

import { useState, useEffect } from "react"
import { Session } from "next-auth"
import Link from "next/link"
import { 
  ArrowLeft, 
  Search, 
  Phone, 
  MapPin, 
  DollarSign, 
  Calendar,
  User,
  Filter,
  RefreshCw,
  Plus,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Clock,
  XCircle,
  Copy
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useToast } from "@/hooks/use-toast"
import PagoRapidoModal from "@/components/pago-rapido-modal"
import ImageViewerModal from "@/components/image-viewer-modal"

interface Prestamo {
  id: string
  monto: number
  interes: number
  cuotas: number
  valorCuota: number
  fechaInicio: string
  fechaFin: string
  estado: string
  tipoPago: string
  fechaActividadReciente: string
  saldoPendiente: number
  cuotasPagadas: number
  montoTotal: number
  observaciones?: string
  tipoCredito?: string
  diasGracia?: number
  moraCredito?: number
  microseguroTipo?: string
  microseguroTotal?: number
}

interface ClienteConPrestamos {
  cliente: {
    id: string
    codigoCliente: string
    documento: string
    nombre: string
    apellido: string
    direccionCliente: string
    direccionCobro?: string
    telefono?: string
    foto?: string
    pais?: string
    ciudad?: string
    referenciasPersonales?: string
  }
  prestamos: Prestamo[]
  fechaActividadReciente: string
  saldoTotalPendiente: number
  cuotasTotalesPagadas: number
  montoTotalPrestado: number
}

interface ListadoGeneralClientProps {
  session: Session
}

export default function ListadoGeneralClient({ session }: ListadoGeneralClientProps) {
  const [clientes, setClientes] = useState<ClienteConPrestamos[]>([])
  const [filteredClientes, setFilteredClientes] = useState<ClienteConPrestamos[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [soloConSaldo, setSoloConSaldo] = useState(true)
  const [selectedPrestamo, setSelectedPrestamo] = useState<Prestamo | null>(null)
  const [selectedCliente, setSelectedCliente] = useState<ClienteConPrestamos | null>(null)
  const [showPagoModal, setShowPagoModal] = useState(false)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{url: string, title: string, subtitle?: string} | null>(null)
  const { toast } = useToast()

  const fetchClientes = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/prestamos?conSaldo=${soloConSaldo}`)
      if (response.ok) {
        const data = await response.json()
        setClientes(data)
        setFilteredClientes(data)
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los clientes",
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
    fetchClientes()
  }, [soloConSaldo])

  useEffect(() => {
    const filtered = clientes.filter(clienteData => {
      const searchLower = searchTerm.toLowerCase()
      return (
        clienteData.cliente.nombre.toLowerCase().includes(searchLower) ||
        clienteData.cliente.apellido.toLowerCase().includes(searchLower) ||
        clienteData.cliente.documento.includes(searchTerm) ||
        clienteData.cliente.codigoCliente.toLowerCase().includes(searchLower) ||
        clienteData.cliente.telefono?.includes(searchTerm)
      )
    })
    setFilteredClientes(filtered)
  }, [searchTerm, clientes])

  const handlePagoRapido = (prestamo: Prestamo, cliente: ClienteConPrestamos) => {
    setSelectedPrestamo(prestamo)
    setSelectedCliente(cliente)
    setShowPagoModal(true)
  }

  const onPagoSuccess = () => {
    setShowPagoModal(false)
    setSelectedPrestamo(null)
    setSelectedCliente(null)
    fetchClientes() // Recargar lista
    toast({
      title: "Pago registrado",
      description: "El pago se ha registrado exitosamente",
    })
  }

  const toggleCardExpansion = (clienteId: string) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(clienteId)) {
      newExpanded.delete(clienteId)
    } else {
      newExpanded.add(clienteId)
    }
    setExpandedCards(newExpanded)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getProgressPercentage = (cuotasPagadas: number, totalCuotas: number) => {
    return Math.min((cuotasPagadas / totalCuotas) * 100, 100)
  }

  // Función para calcular el estado de alerta del cliente
  const calcularEstadoCliente = (clienteData: ClienteConPrestamos) => {
    // Verificar si algún préstamo está completamente vencido
    const tienePrestamoVencido = clienteData.prestamos.some(prestamo => 
      prestamo.estado === 'VENCIDO' || new Date(prestamo.fechaFin) < new Date()
    )
    
    if (tienePrestamoVencido) {
      return {
        estado: 'VENCIDO',
        icono: XCircle,
        color: 'bg-red-500',
        texto: 'Vencido',
        colorTexto: 'text-white'
      }
    }

    // Verificar morosidad (préstamos con pagos atrasados)
    const hoy = new Date()
    const prestamosConAtraso = clienteData.prestamos.filter(prestamo => {
      if (prestamo.saldoPendiente <= 0) return false // Ya está pagado
      
      // Calcular días desde el último pago esperado
      const diasPorTipo = {
        'DIARIO': 1,
        'SEMANAL': 7,
        'LUNES_A_VIERNES': 1,     // Pago diario de lunes a viernes
        'LUNES_A_SABADO': 1,      // Pago diario de lunes a sábado
        'QUINCENAL': 15,
        'CATORCENAL': 14,         // Cada 14 días
        'FIN_DE_MES': 30,
        'MENSUAL': 30,
        'TRIMESTRAL': 90,
        'CUATRIMESTRAL': 120,     // Cada 4 meses
        'SEMESTRAL': 180,
        'ANUAL': 365
      }
      
      const diasEsperados = diasPorTipo[prestamo.tipoPago as keyof typeof diasPorTipo] || 1
      const fechaInicio = new Date(prestamo.fechaInicio)
      const pagosEsperados = Math.floor((hoy.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24 * diasEsperados))
      
      return prestamo.cuotasPagadas < Math.max(0, pagosEsperados)
    })
    
    if (prestamosConAtraso.length > 0) {
      return {
        estado: 'MOROSO',
        icono: AlertTriangle,
        color: 'bg-orange-500',
        texto: 'Moroso',
        colorTexto: 'text-white'
      }
    }

    // Verificar si está próximo a vencer (en los próximos 3 días)
    const proximoAVencer = clienteData.prestamos.some(prestamo => {
      if (prestamo.saldoPendiente <= 0) return false
      
      const diasPorTipo = {
        'DIARIO': 1,
        'SEMANAL': 7,
        'LUNES_A_VIERNES': 1,     // Pago diario de lunes a viernes
        'LUNES_A_SABADO': 1,      // Pago diario de lunes a sábado
        'QUINCENAL': 15,
        'CATORCENAL': 14,         // Cada 14 días
        'FIN_DE_MES': 30,
        'MENSUAL': 30,
        'TRIMESTRAL': 90,
        'CUATRIMESTRAL': 120,     // Cada 4 meses
        'SEMESTRAL': 180,
        'ANUAL': 365
      }
      
      const diasEsperados = diasPorTipo[prestamo.tipoPago as keyof typeof diasPorTipo] || 1
      const fechaInicio = new Date(prestamo.fechaInicio)
      const pagosRealizados = prestamo.cuotasPagadas
      const fechaProximoPago = new Date(fechaInicio.getTime() + (pagosRealizados * diasEsperados * 24 * 60 * 60 * 1000))
      
      const diferenciaDias = Math.floor((fechaProximoPago.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
      
      return diferenciaDias <= 3 && diferenciaDias >= 0
    })
    
    if (proximoAVencer) {
      return {
        estado: 'PROXIMO_A_VENCER',
        icono: Clock,
        color: 'bg-yellow-500',
        texto: 'Próximo a vencer',
        colorTexto: 'text-white'
      }
    }

    // Cliente al día
    return {
      estado: 'OK',
      icono: CheckCircle,
      color: 'bg-green-500',
      texto: 'Al día',
      colorTexto: 'text-white'
    }
  }

  // Función para obtener información adicional del tipo de pago
  const getTipoPagoBadge = (clienteData: ClienteConPrestamos) => {
    const prestamoMasReciente = clienteData.prestamos.sort((a, b) => 
      new Date(b.fechaActividadReciente).getTime() - new Date(a.fechaActividadReciente).getTime()
    )[0]

    const tipoPago = prestamoMasReciente.tipoPago
    const badges = {
      'DIARIO': { texto: 'Diario', color: 'bg-blue-100 text-blue-800' },
      'SEMANAL': { texto: 'Semanal', color: 'bg-green-100 text-green-800' },
      'LUNES_A_VIERNES': { texto: 'Lun-Vie', color: 'bg-cyan-100 text-cyan-800' },
      'LUNES_A_SABADO': { texto: 'Lun-Sáb', color: 'bg-sky-100 text-sky-800' },
      'QUINCENAL': { texto: 'Quincenal', color: 'bg-orange-100 text-orange-800' },
      'CATORCENAL': { texto: 'Catorcenal', color: 'bg-amber-100 text-amber-800' },
      'FIN_DE_MES': { texto: 'Fin de Mes', color: 'bg-teal-100 text-teal-800' },
      'MENSUAL': { texto: 'Mensual', color: 'bg-purple-100 text-purple-800' },
      'TRIMESTRAL': { texto: 'Trimestral', color: 'bg-indigo-100 text-indigo-800' },
      'CUATRIMESTRAL': { texto: 'Cuatrimestral', color: 'bg-violet-100 text-violet-800' },
      'SEMESTRAL': { texto: 'Semestral', color: 'bg-pink-100 text-pink-800' },
      'ANUAL': { texto: 'Anual', color: 'bg-yellow-100 text-yellow-800' }
    }
    
    return badges[tipoPago as keyof typeof badges] || { 
      texto: tipoPago, 
      color: 'bg-gray-100 text-gray-800' 
    }
  }

  // Función para abrir Google Maps con la dirección
  const abrirImagenModal = (cliente: ClienteConPrestamos['cliente']) => {
    if (cliente.foto) {
      setSelectedImage({
        url: cliente.foto,
        title: `${cliente.nombre} ${cliente.apellido}`,
        subtitle: `Código: ${cliente.codigoCliente} • Doc: ${cliente.documento}`
      })
      setShowImageModal(true)
    }
  }

  const abrirMapa = (direccion: string, tipo: string) => {
    try {
      // Limpiar y formatear la dirección
      const direccionLimpia = direccion.trim()
      if (!direccionLimpia) {
        toast({
          title: "Error",
          description: "La dirección está vacía",
          variant: "destructive",
        })
        return
      }

      // Crear URL de Google Maps
      const direccionFormateada = encodeURIComponent(direccionLimpia)
      const url = `https://www.google.com/maps/search/?api=1&query=${direccionFormateada}`
      
      // Intentar abrir en nueva pestaña
      const nuevaVentana = window.open(url, '_blank', 'noopener,noreferrer')
      
      // Verificar si se bloqueó la popup
      if (!nuevaVentana || nuevaVentana.closed || typeof nuevaVentana.closed === 'undefined') {
        // Si se bloqueó, intentar navegar en la misma pestaña
        toast({
          title: "Ventana bloqueada",
          description: "Tu navegador bloqueó la ventana emergente. Abriendo en la misma pestaña...",
          variant: "default",
        })
        
        // Usar un timeout para que el usuario vea el mensaje
        setTimeout(() => {
          window.location.href = url
        }, 2000)
      } else {
        toast({
          title: "Mapa abierto",
          description: `Se abrió Google Maps con la dirección de ${tipo}`,
          variant: "default",
        })
      }
    } catch (error) {
      console.error('Error al abrir mapa:', error)
      toast({
        title: "Error",
        description: "No se pudo abrir Google Maps. Intenta copiar la dirección manualmente.",
        variant: "destructive",
      })
    }
  }

  // Función para copiar dirección al portapapeles
  const copiarDireccion = async (direccion: string, tipo: string) => {
    try {
      await navigator.clipboard.writeText(direccion)
      toast({
        title: "Dirección copiada",
        description: `Se copió la dirección de ${tipo} al portapapeles`,
        variant: "default",
      })
    } catch (error) {
      console.error('Error al copiar:', error)
      toast({
        title: "Error",
        description: "No se pudo copiar la dirección",
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
                <h1 className="text-lg font-semibold text-gray-900">Listado General</h1>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchClientes}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>
      </div>

      <div className="container-mobile py-6">
        {/* Filtros */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, código, documento o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Button
              variant={soloConSaldo ? "default" : "outline"}
              onClick={() => setSoloConSaldo(!soloConSaldo)}
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>{soloConSaldo ? "Solo con saldo" : "Todos los préstamos"}</span>
            </Button>
            
            <div className="text-sm text-gray-500">
              {filteredClientes.length} cliente{filteredClientes.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Lista de préstamos */}
        <div className="space-y-3">
          {filteredClientes.map((clienteData, index) => {
            const isExpanded = expandedCards.has(clienteData.cliente.id)
            const estadoAlerta = calcularEstadoCliente(clienteData)
            const tipoPagoInfo = getTipoPagoBadge(clienteData)
            const IconoAlerta = estadoAlerta.icono
            
            return (
              <Card 
                key={clienteData.cliente.id} 
                className="list-item animate-fadeInScale"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <Collapsible 
                  open={isExpanded} 
                  onOpenChange={() => toggleCardExpansion(clienteData.cliente.id)}
                >
                  <CardContent className="p-4">
                    {/* Vista compacta del cliente - siempre visible */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="relative w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                          {clienteData.cliente.foto ? (
                            <button
                              onClick={() => abrirImagenModal(clienteData.cliente)}
                              className="w-full h-full rounded-full overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all duration-200"
                              title="Ver foto del cliente"
                            >
                              <img 
                                src={clienteData.cliente.foto} 
                                alt={`${clienteData.cliente.nombre} ${clienteData.cliente.apellido}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ) : (
                            <User className="h-5 w-5 text-gray-400" />
                          )}
                          {/* Ícono de alerta superpuesto */}
                          <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${estadoAlerta.color}`}>
                            <IconoAlerta className="h-3 w-3 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center flex-wrap gap-1">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {clienteData.cliente.nombre} {clienteData.cliente.apellido}
                              </h3>
                              <Badge 
                                className={`text-xs ${estadoAlerta.color} ${estadoAlerta.colorTexto} hover:opacity-80 ${
                                  estadoAlerta.estado === 'MOROSO' || estadoAlerta.estado === 'VENCIDO' ? 'animate-pulse' : ''
                                }`}
                              >
                                {estadoAlerta.texto}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${tipoPagoInfo.color}`}
                              >
                                {tipoPagoInfo.texto}
                              </Badge>
                              {clienteData.prestamos.length > 1 && (
                                <Badge variant="outline" className="text-xs">
                                  {clienteData.prestamos.length} préstamos
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                              Saldo Total: <span className="font-semibold text-red-600">{formatCurrency(clienteData.saldoTotalPendiente)}</span>
                            </span>
                            <span className="text-xs text-gray-500">
                              {clienteData.cuotasTotalesPagadas} cuotas pagadas
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-gray-400">
                              Total prestado: {formatCurrency(clienteData.montoTotalPrestado)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="ml-2 p-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>

                    {/* Vista expandida - historial de préstamos */}
                    <CollapsibleContent className="space-y-3">
                      <div className="pt-3 border-t mt-3">
                        {/* Historial de préstamos */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                            Préstamos de {clienteData.cliente.nombre} ({clienteData.prestamos.length})
                          </h4>
                          
                          {clienteData.prestamos.map((prestamo, prestamoIndex) => {
                            const fechaInicio = new Date(prestamo.fechaInicio).toLocaleDateString('es-CO', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                            const fechaFin = new Date(prestamo.fechaFin).toLocaleDateString('es-CO', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                            
                            return (
                              <div key={prestamo.id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 space-y-3 border border-gray-200 shadow-sm">
                                {/* Header del préstamo */}
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center flex-wrap gap-2">
                                    <Badge variant="outline" className="text-xs font-semibold bg-white">
                                      Préstamo #{prestamoIndex + 1}
                                    </Badge>
                                    <Badge 
                                      variant="default" 
                                      className={`text-xs ${
                                        prestamo.tipoPago === 'DIARIO' ? 'bg-blue-400' :
                                        prestamo.tipoPago === 'SEMANAL' ? 'bg-green-400' :
                                        prestamo.tipoPago === 'LUNES_A_VIERNES' ? 'bg-cyan-400' :
                                        prestamo.tipoPago === 'LUNES_A_SABADO' ? 'bg-sky-400' :
                                        prestamo.tipoPago === 'QUINCENAL' ? 'bg-orange-400' :
                                        prestamo.tipoPago === 'CATORCENAL' ? 'bg-amber-400' :
                                        prestamo.tipoPago === 'FIN_DE_MES' ? 'bg-teal-400' :
                                        prestamo.tipoPago === 'MENSUAL' ? 'bg-purple-400' :
                                        prestamo.tipoPago === 'TRIMESTRAL' ? 'bg-indigo-400' :
                                        prestamo.tipoPago === 'CUATRIMESTRAL' ? 'bg-violet-400' :
                                        prestamo.tipoPago === 'SEMESTRAL' ? 'bg-pink-400' :
                                        prestamo.tipoPago === 'ANUAL' ? 'bg-yellow-400' : 'bg-gray-400'
                                      }`}
                                    >
                                      {prestamo.tipoPago === 'FIN_DE_MES' ? 'Fin de Mes' :
                                       prestamo.tipoPago === 'LUNES_A_VIERNES' ? 'Lun-Vie' :
                                       prestamo.tipoPago === 'LUNES_A_SABADO' ? 'Lun-Sáb' :
                                       prestamo.tipoPago === 'CATORCENAL' ? 'Catorcenal' :
                                       prestamo.tipoPago === 'CUATRIMESTRAL' ? 'Cuatrimestral' :
                                       prestamo.tipoPago}
                                    </Badge>
                                    {prestamo.tipoCredito && (
                                      <Badge variant="secondary" className="text-xs">
                                        {prestamo.tipoCredito === 'EFECTIVO' ? '💵 Efectivo' : '🏦 Transferencia'}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handlePagoRapido(prestamo, clienteData)}
                                      className="btn-primary text-xs"
                                      disabled={prestamo.saldoPendiente <= 0}
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      <DollarSign className="h-3 w-3 mr-1" />
                                      Pago
                                    </Button>
                                    <Link href={`/prestamos/${prestamo.id}`}>
                                      <Button variant="outline" size="sm" className="text-xs">
                                        Ver
                                      </Button>
                                    </Link>
                                  </div>
                                </div>

                                {/* Información del cliente en la card */}
                                <div className="bg-white rounded-lg p-3 border border-gray-300 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <h5 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                                      <User className="h-4 w-4" />
                                      {clienteData.cliente.nombre} {clienteData.cliente.apellido}
                                    </h5>
                                    <span className="text-xs text-gray-500">
                                      {clienteData.cliente.codigoCliente} • {clienteData.cliente.documento}
                                    </span>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    {clienteData.cliente.telefono && (
                                      <div className="flex items-center gap-1">
                                        <Phone className="h-3 w-3 text-green-600" />
                                        <a href={`tel:${clienteData.cliente.telefono}`} className="text-blue-600 hover:underline">
                                          {clienteData.cliente.telefono}
                                        </a>
                                      </div>
                                    )}
                                    {(clienteData.cliente.pais || clienteData.cliente.ciudad) && (
                                      <div className="flex items-center gap-1 text-gray-600">
                                        <MapPin className="h-3 w-3" />
                                        <span>{clienteData.cliente.ciudad || clienteData.cliente.pais}</span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="space-y-1">
                                    <div className="flex items-start gap-1 text-xs">
                                      <MapPin className="h-3 w-3 mt-0.5 text-blue-600 flex-shrink-0" />
                                      <div className="flex-1">
                                        <button 
                                          onClick={() => abrirMapa(clienteData.cliente.direccionCliente, 'cliente')}
                                          className="text-blue-600 hover:underline text-left"
                                        >
                                          {clienteData.cliente.direccionCliente}
                                        </button>
                                      </div>
                                      <button
                                        onClick={() => copiarDireccion(clienteData.cliente.direccionCliente, 'cliente')}
                                        className="text-gray-400 hover:text-gray-600"
                                        title="Copiar"
                                      >
                                        <Copy className="h-3 w-3" />
                                      </button>
                                    </div>

                                    {clienteData.cliente.direccionCobro && (
                                      <div className="flex items-start gap-1 text-xs">
                                        <MapPin className="h-3 w-3 mt-0.5 text-orange-600 flex-shrink-0" />
                                        <div className="flex-1">
                                          <span className="text-gray-500 mr-1">Cobro:</span>
                                          <button 
                                            onClick={() => abrirMapa(clienteData.cliente.direccionCobro!, 'cobro')}
                                            className="text-orange-600 hover:underline text-left"
                                          >
                                            {clienteData.cliente.direccionCobro}
                                          </button>
                                        </div>
                                        <button
                                          onClick={() => copiarDireccion(clienteData.cliente.direccionCobro!, 'cobro')}
                                          className="text-gray-400 hover:text-gray-600"
                                          title="Copiar"
                                        >
                                          <Copy className="h-3 w-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {clienteData.cliente.referenciasPersonales && (
                                    <div className="text-xs bg-amber-50 p-2 rounded border border-amber-200">
                                      <span className="font-medium text-amber-800">📋 Referencias:</span>
                                      <p className="text-gray-700 mt-0.5">{clienteData.cliente.referenciasPersonales}</p>
                                    </div>
                                  )}
                                </div>

                                {/* Información financiera principal */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                                    <p className="text-xs text-gray-600 mb-1">Monto prestado</p>
                                    <p className="text-lg font-bold text-blue-700">{formatCurrency(prestamo.monto)}</p>
                                    <p className="text-xs text-gray-500">Interés: {prestamo.interes}%</p>
                                  </div>
                                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                                    <p className="text-xs text-gray-600 mb-1">Saldo pendiente</p>
                                    <p className="text-lg font-bold text-red-600">{formatCurrency(prestamo.saldoPendiente)}</p>
                                    <p className="text-xs text-gray-500">Total: {formatCurrency(prestamo.montoTotal)}</p>
                                  </div>
                                </div>
                                
                                {/* Detalles del pago */}
                                <div className="grid grid-cols-2 gap-2 text-xs bg-white rounded-lg p-3 border border-gray-200">
                                  <div>
                                    <span className="text-gray-600">Valor por cuota:</span>
                                    <p className="font-semibold text-green-700">{formatCurrency(prestamo.valorCuota)}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Progreso:</span>
                                    <p className="font-semibold text-gray-900">
                                      {prestamo.cuotasPagadas}/{prestamo.cuotas} cuotas
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Fecha inicio:</span>
                                    <p className="font-medium text-gray-900">{fechaInicio}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Fecha fin:</span>
                                    <p className="font-medium text-gray-900">{fechaFin}</p>
                                  </div>
                                  {prestamo.diasGracia !== undefined && prestamo.diasGracia > 0 && (
                                    <div>
                                      <span className="text-gray-600">Días de gracia:</span>
                                      <p className="font-medium text-blue-600">{prestamo.diasGracia} días</p>
                                    </div>
                                  )}
                                  {prestamo.moraCredito !== undefined && prestamo.moraCredito > 0 && (
                                    <div>
                                      <span className="text-gray-600">Mora:</span>
                                      <p className="font-medium text-orange-600">{prestamo.moraCredito}%</p>
                                    </div>
                                  )}
                                </div>

                                {/* Microseguro */}
                                {prestamo.microseguroTipo && prestamo.microseguroTipo !== 'NINGUNO' && prestamo.microseguroTotal && (
                                  <div className="bg-purple-50 rounded-lg p-2 border border-purple-200 text-xs">
                                    <span className="text-purple-700 font-medium">🛡️ Microseguro: </span>
                                    <span className="font-bold text-purple-900">{formatCurrency(prestamo.microseguroTotal)}</span>
                                    <span className="text-purple-600 ml-1">
                                      ({prestamo.microseguroTipo === 'MONTO_FIJO' ? 'Monto fijo' : 'Porcentaje'})
                                    </span>
                                  </div>
                                )}

                                {/* Observaciones */}
                                {prestamo.observaciones && (
                                  <div className="bg-yellow-50 rounded-lg p-2 border border-yellow-200 text-xs">
                                    <span className="text-yellow-700 font-medium">📝 Observaciones: </span>
                                    <p className="text-gray-700 mt-1">{prestamo.observaciones}</p>
                                  </div>
                                )}
                                
                                {/* Barra de progreso individual */}
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs text-gray-600">
                                    <span>Progreso del préstamo</span>
                                    <span className="font-semibold">
                                      {getProgressPercentage(prestamo.cuotasPagadas, prestamo.cuotas).toFixed(1)}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500 shadow-sm"
                                      style={{ 
                                        width: `${getProgressPercentage(prestamo.cuotasPagadas, prestamo.cuotas)}%` 
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </CardContent>
                </Collapsible>
              </Card>
            )
          })}

          {filteredClientes.length === 0 && (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay clientes
              </h3>
              <p className="text-gray-500 mb-6">
                {soloConSaldo 
                  ? "No se encontraron préstamos con saldo pendiente"
                  : "No se encontraron préstamos que coincidan con la búsqueda"
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de pago rápido */}
      {selectedPrestamo && selectedCliente && (
        <PagoRapidoModal
          isOpen={showPagoModal}
          onClose={() => setShowPagoModal(false)}
          prestamo={{
            ...selectedPrestamo,
            cliente: selectedCliente.cliente
          }}
          onSuccess={onPagoSuccess}
        />
      )}

      {/* Modal de imagen */}
      {selectedImage && (
        <ImageViewerModal
          isOpen={showImageModal}
          onClose={() => {
            setShowImageModal(false)
            setSelectedImage(null)
          }}
          imageUrl={selectedImage.url}
          title={selectedImage.title}
          subtitle={selectedImage.subtitle}
        />
      )}
    </div>
  )
}
