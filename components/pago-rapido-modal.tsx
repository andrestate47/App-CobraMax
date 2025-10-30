
"use client"

import { useState, useRef } from "react"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DollarSign, User, Calculator, Loader2, Plus, Receipt, Share2, MessageCircle, ChevronDown } from "lucide-react"
import BoletaPago from "@/components/boleta-pago"

interface PrestamoConCliente {
  id: string
  monto: number
  interes: number
  cuotas: number
  valorCuota: number
  cliente: {
    nombre: string
    apellido: string
    documento: string
    telefono?: string
    direccionCliente?: string
  }
  saldoPendiente: number
  cuotasPagadas: number
}

interface PagoRegistrado {
  id: string
  monto: number
  fecha: string
  observaciones?: string
  numeroBoleta: string
  prestamo: {
    id: string
    monto: number
    interes: number
    valorCuota: number
    montoTotal: number
    saldoPendiente: number
    fechaInicio: string
    tipoPago: string
    cuotas: number
    ultimoPago?: {
      fecha: string
      monto: number
    }
  }
  cliente: {
    nombre: string
    apellido: string
    documento: string
    telefono?: string
    direccionCliente: string
  }
  usuario: {
    nombre: string
  }
  // Nuevos campos adicionales
  tipoCredito?: string
  tipoPagoMetodo?: string
}

interface PagoRapidoModalProps {
  isOpen: boolean
  onClose: () => void
  prestamo: PrestamoConCliente
  onSuccess: () => void
}

export default function PagoRapidoModal({
  isOpen,
  onClose,
  prestamo,
  onSuccess
}: PagoRapidoModalProps) {
  const [step, setStep] = useState<'form' | 'boleta'>('form')
  const [monto, setMonto] = useState("")
  const [observaciones, setObservaciones] = useState("")
  const [loading, setLoading] = useState(false)
  const [pagoRegistrado, setPagoRegistrado] = useState<PagoRegistrado | null>(null)
  const boletaRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const handleMontoChange = (value: string) => {
    // Solo permitir números, punto decimal y un solo punto
    let numericValue = value.replace(/[^0-9.]/g, '')
    
    // Asegurar que solo haya un punto decimal
    const parts = numericValue.split('.')
    if (parts.length > 2) {
      numericValue = parts[0] + '.' + parts.slice(1).join('')
    }
    
    // Limitar a 2 decimales
    if (parts.length === 2 && parts[1].length > 2) {
      numericValue = parts[0] + '.' + parts[1].substring(0, 2)
    }
    
    // Evitar que emppiece con punto
    if (numericValue.startsWith('.')) {
      numericValue = '0' + numericValue
    }
    
    setMonto(numericValue)
  }

  const setPagoCuota = () => {
    // Formatear el número para que sea compatible con nuestras validaciones
    const valorFormateado = Math.round(prestamo.valorCuota * 100) / 100
    setMonto(valorFormateado.toString())
  }

  const setPagoCompleto = () => {
    // Formatear el número para que sea compatible con nuestras validaciones
    const saldoFormateado = Math.round(prestamo.saldoPendiente * 100) / 100
    setMonto(saldoFormateado.toString())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validaciones de entrada más robustas
    if (!monto || monto.trim() === '') {
      toast({
        title: "Campo requerido",
        description: "Por favor ingresa el monto del pago",
        variant: "destructive",
      })
      return
    }

    // Limpiar el monto de cualquier formato y validar que solo contenga números y punto decimal
    const montoLimpio = monto.replace(/[^0-9.]/g, '')
    
    if (montoLimpio === '' || montoLimpio === '.') {
      toast({
        title: "Monto inválido",
        description: "El monto debe ser un número válido",
        variant: "destructive",
      })
      return
    }

    const montoNumerico = parseFloat(montoLimpio)
    
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      toast({
        title: "Monto inválido",
        description: "El monto debe ser un número positivo mayor a cero",
        variant: "destructive",
      })
      return
    }

    // Validar que no tenga más de 2 decimales
    const decimales = montoLimpio.split('.')
    if (decimales.length === 2 && decimales[1].length > 2) {
      toast({
        title: "Formato inválido",
        description: "El monto no puede tener más de 2 decimales",
        variant: "destructive",
      })
      return
    }

    if (montoNumerico > 1000000000) {
      toast({
        title: "Monto muy grande",
        description: "El monto ingresado es demasiado grande. Verifica la cantidad",
        variant: "destructive",
      })
      return
    }

    if (montoNumerico > prestamo.saldoPendiente) {
      const saldoFormateado = formatCurrency(prestamo.saldoPendiente)
      const montoFormateado = formatCurrency(montoNumerico)
      toast({
        title: "Monto excede el saldo",
        description: `El monto (${montoFormateado}) no puede ser mayor al saldo pendiente (${saldoFormateado})`,
        variant: "destructive",
      })
      return
    }

    if (!prestamo.id || typeof prestamo.id !== 'string') {
      toast({
        title: "Error de datos",
        description: "Información del préstamo no válida. Por favor recarga la página e intenta de nuevo",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const requestBody = {
        prestamoId: prestamo.id,
        monto: montoNumerico,
        observaciones: observaciones.trim() || undefined
      }

      const response = await fetch('/api/pagos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        credentials: 'include' // Asegurar que las cookies de sesión se incluyan
      })

      if (response.ok) {
        const result = await response.json()
        
        // Verificar que tenemos los datos necesarios
        if (result.pago && result.pago.numeroBoleta) {
          setPagoRegistrado(result.pago)
          setStep('boleta')
          
          toast({
            title: "¡Pago registrado exitosamente!",
            description: `Se generó la boleta ${result.pago.numeroBoleta}`,
            variant: "default",
          })
        } else {
          throw new Error("Los datos del pago están incompletos. Intenta nuevamente.")
        }
      } else {
        // Manejar respuestas HTTP de error
        let errorMsg = "Error al procesar el pago. Por favor intenta nuevamente."
        
        try {
          const errorData = await response.json()
          if (errorData.error && typeof errorData.error === 'string') {
            errorMsg = errorData.error
          }
        } catch {
          // Si no se puede parsear JSON, usar mensaje por defecto
          if (response.status === 401) {
            errorMsg = "Tu sesión ha expirado. Por favor vuelve a iniciar sesión."
          } else if (response.status === 403) {
            errorMsg = "No tienes permisos para realizar esta acción."
          } else if (response.status === 500) {
            errorMsg = "Error interno del servidor. Por favor intenta más tarde."
          }
        }
        
        toast({
          title: "Error al procesar el pago",
          description: errorMsg,
          variant: "destructive",
        })
      }
    } catch (error) {
      // Manejar errores de red y otros errores inesperados
      let errorMsg = "Error de conexión. Verifica tu conexión a internet e intenta nuevamente."
      
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMsg = "No se pudo conectar con el servidor. Verifica tu conexión a internet."
        } else if (error.message.includes('timeout')) {
          errorMsg = "La solicitud tardó demasiado tiempo. Por favor intenta nuevamente."
        } else if (error.message.includes('NetworkError')) {
          errorMsg = "Error de red. Verifica tu conexión a internet."
        } else {
          errorMsg = error.message
        }
      }
      
      toast({
        title: "Error de conexión",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    // Si había un pago registrado, llamar onSuccess antes de cerrar
    if (pagoRegistrado) {
      onSuccess()
    }
    
    // Limpiar estado
    setStep('form')
    setMonto("")
    setObservaciones("")
    setPagoRegistrado(null)
    onClose()
  }

  // Función de WhatsApp comentada temporalmente - la activaremos después
  /*const handleCompartirWhatsApp = () => {
    // ... código de WhatsApp
  }*/

  const handleDescargarBoleta = async () => {
    if (!boletaRef.current || !pagoRegistrado) return
    
    try {
      // Importar html2canvas dinámicamente
      const html2canvas = (await import('html2canvas')).default
      
      const canvas = await html2canvas(boletaRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        width: 400,
        height: 600
      })
      
      const link = document.createElement('a')
      link.download = `boleta-${pagoRegistrado.numeroBoleta}.png`
      link.href = canvas.toDataURL()
      link.click()
    } catch (error) {
      console.error('Error al descargar boleta:', error)
      toast({
        title: "Error",
        description: "No se pudo descargar la boleta",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={step === 'boleta' ? "sm:max-w-2xl max-h-[90vh] overflow-y-auto" : "sm:max-w-md"}>
        {step === 'form' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span>Pago Rápido</span>
              </DialogTitle>
              <DialogDescription>
                Registrar pago para el préstamo
              </DialogDescription>
            </DialogHeader>

            {/* Info del cliente */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-3 mb-3">
                <User className="h-8 w-8 text-gray-400" />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {prestamo.cliente.nombre} {prestamo.cliente.apellido}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Documento: {prestamo.cliente.documento}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Cuota sugerida:</span>
                  <p className="font-semibold">{formatCurrency(prestamo.valorCuota)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Saldo pendiente:</span>
                  <p className="font-semibold text-red-600">
                    {formatCurrency(prestamo.saldoPendiente)}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="monto">Monto del pago *</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="monto"
                    type="text"
                    value={monto}
                    onChange={(e) => handleMontoChange(e.target.value)}
                    placeholder="0"
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
                
                {/* Botones de monto rápido */}
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={setPagoCuota}
                    disabled={loading}
                  >
                    <Calculator className="h-3 w-3 mr-1" />
                    Cuota
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={setPagoCompleto}
                    disabled={loading}
                  >
                    Pago Total
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Observaciones opcionales..."
                  className="mt-1"
                  disabled={loading}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="btn-primary"
                  disabled={loading || !monto}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-1 h-4 w-4" />
                      Registrar Pago
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        )}

        {step === 'boleta' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-green-600">
                <Receipt className="h-5 w-5" />
                <span>✅ Pago Registrado - Boleta de Pago</span>
              </DialogTitle>
              <DialogDescription>
                {pagoRegistrado ? 'Revisa los detalles del pago y cierra cuando termines' : 'Preparando boleta...'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {pagoRegistrado ? (
                <>
                  <BoletaPago ref={boletaRef} data={pagoRegistrado} />
                  
                  {/* Mensaje de éxito */}
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200 text-center">
                    <div className="text-green-600 mb-2">
                      <Receipt className="h-8 w-8 mx-auto mb-2" />
                      <h3 className="font-semibold text-green-800">¡Boleta Generada Exitosamente!</h3>
                      <p className="text-sm text-green-600">El pago ha sido registrado correctamente</p>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex space-x-2">
                    {/* Botón de compartir desplegable */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="flex-1">
                          <Share2 className="mr-2 h-4 w-4" />
                          Compartir
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuItem 
                          onClick={() => console.log('WhatsApp seleccionado - Por implementar')}
                          className="flex items-center space-x-2 py-3"
                        >
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <MessageCircle className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">WhatsApp</span>
                            <span className="text-xs text-gray-500">Enviar por WhatsApp</span>
                          </div>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem 
                          onClick={handleDescargarBoleta}
                          className="flex items-center space-x-2 py-3"
                        >
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <Share2 className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">Descargar PNG</span>
                            <span className="text-xs text-gray-500">Guardar como imagen</span>
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      onClick={handleClose}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      size="lg"
                    >
                      ✅ Cerrar y Finalizar
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">Generando boleta...</p>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
