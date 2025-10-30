

"use client"

import { useState, useRef } from "react"
import { 
  Camera, 
  Upload, 
  X, 
  Loader2,
  DollarSign,
  Building,
  CreditCard,
  FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface TransferenciaModalProps {
  isOpen: boolean
  onClose: () => void
  prestamoId: string
  clienteNombre: string
  onTransferenciaSaved: () => void
}

export default function TransferenciaModal({
  isOpen,
  onClose,
  prestamoId,
  clienteNombre,
  onTransferenciaSaved
}: TransferenciaModalProps) {
  const [monto, setMonto] = useState("")
  const [banco, setBanco] = useState("")
  const [referencia, setReferencia] = useState("")
  const [observaciones, setObservaciones] = useState("")
  const [fotoComprobante, setFotoComprobante] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [capturandoFoto, setCapturandoFoto] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { toast } = useToast()

  const iniciarCamara = async () => {
    try {
      setCapturandoFoto(true)
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Cámara trasera preferida
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
      }
    } catch (error) {
      console.error("Error al acceder a la cámara:", error)
      toast({
        title: "Error",
        description: "No se pudo acceder a la cámara. Verifica los permisos.",
        variant: "destructive",
      })
    }
  }

  const detenerCamara = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setCapturandoFoto(false)
  }

  const capturarFoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        const dataURL = canvas.toDataURL('image/jpeg', 0.8)
        setFotoComprobante(dataURL)
        detenerCamara()
        
        toast({
          title: "Foto capturada",
          description: "La imagen del comprobante se ha capturado exitosamente",
        })
      }
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Por favor selecciona una imagen válida",
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setFotoComprobante(e.target?.result as string)
        toast({
          title: "Imagen cargada",
          description: "La imagen del comprobante se ha cargado exitosamente",
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!monto || !fotoComprobante) {
      toast({
        title: "Error",
        description: "El monto y la foto del comprobante son obligatorios",
        variant: "destructive",
      })
      return
    }

    const montoNum = parseFloat(monto)
    if (montoNum <= 0) {
      toast({
        title: "Error",
        description: "El monto debe ser mayor a cero",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/transferencias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prestamoId,
          monto: montoNum,
          banco: banco.trim() || null,
          referencia: referencia.trim() || null,
          observaciones: observaciones.trim() || null,
          fotoComprobante
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Transferencia registrada",
          description: `Se ha registrado la transferencia por ${formatCurrency(montoNum)}`,
        })
        onTransferenciaSaved()
        handleClose()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "No se pudo registrar la transferencia",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Error de conexión al registrar la transferencia",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    detenerCamara()
    setMonto("")
    setBanco("")
    setReferencia("")
    setObservaciones("")
    setFotoComprobante(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onClose()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-blue-600">
            <CreditCard className="h-5 w-5" />
            <span>Registrar Transferencia Bancaria</span>
          </DialogTitle>
          <DialogDescription>
            Cliente: <strong>{clienteNombre}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Monto */}
          <div>
            <Label htmlFor="monto">Monto de la transferencia *</Label>
            <div className="relative mt-1">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="monto"
                type="number"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="pl-10"
                placeholder="0.00"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Banco */}
          <div>
            <Label htmlFor="banco">Banco</Label>
            <div className="relative mt-1">
              <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="banco"
                type="text"
                value={banco}
                onChange={(e) => setBanco(e.target.value)}
                className="pl-10"
                placeholder="Ej: Bancolombia, Nequi, Daviplata..."
                disabled={loading}
              />
            </div>
          </div>

          {/* Referencia */}
          <div>
            <Label htmlFor="referencia">Número de referencia</Label>
            <div className="relative mt-1">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="referencia"
                type="text"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                className="pl-10"
                placeholder="Ej: 123456789"
                disabled={loading}
              />
            </div>
          </div>

          {/* Foto del comprobante */}
          <div>
            <Label>Comprobante de transferencia *</Label>
            <div className="mt-2 space-y-2">
              {!fotoComprobante ? (
                <div className="space-y-2">
                  {!capturandoFoto ? (
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={iniciarCamara}
                        disabled={loading}
                        className="w-full"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Tomar foto con cámara
                      </Button>
                      
                      <div className="relative">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={loading}
                          className="w-full"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Subir desde galería
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <video
                        ref={videoRef}
                        className="w-full rounded-lg border"
                        autoPlay
                        playsInline
                        muted
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={capturarFoto}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Capturar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={detenerCamara}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <img
                      src={fotoComprobante}
                      alt="Comprobante de transferencia"
                      className="w-full max-h-64 object-contain rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFotoComprobante(null)}
                      className="absolute top-2 right-2 h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Observaciones adicionales sobre la transferencia..."
              className="mt-1"
              disabled={loading}
            />
          </div>

          {/* Botones */}
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
              disabled={loading || !monto || !fotoComprobante}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Registrar Transferencia
                </>
              )}
            </Button>
          </div>
        </form>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </DialogContent>
    </Dialog>
  )
}

