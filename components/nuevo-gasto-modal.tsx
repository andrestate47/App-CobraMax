
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
import { Receipt, DollarSign, Loader2, Upload, X, Image as ImageIcon } from "lucide-react"
import Image from "next/image"

interface NuevoGastoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function NuevoGastoModal({
  isOpen,
  onClose,
  onSuccess
}: NuevoGastoModalProps) {
  const [concepto, setConcepto] = useState("")
  const [monto, setMonto] = useState("")
  const [observaciones, setObservaciones] = useState("")
  const [foto, setFoto] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleMontoChange = (value: string) => {
    // Solo permitir números y punto decimal
    const numericValue = value.replace(/[^0-9.]/g, '')
    setMonto(numericValue)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"]
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Tipo de archivo no permitido. Solo se aceptan imágenes (JPG, PNG, WEBP) o PDF",
        variant: "destructive",
      })
      return
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: "El archivo es demasiado grande. Tamaño máximo: 5MB",
        variant: "destructive",
      })
      return
    }

    setFoto(file)
    
    // Crear preview solo para imágenes
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreviewUrl(null)
    }
  }

  const handleRemoveFile = () => {
    setFoto(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const montoNumerico = parseFloat(monto)
    if (!concepto.trim()) {
      toast({
        title: "Error",
        description: "El concepto es obligatorio",
        variant: "destructive",
      })
      return
    }

    if (!montoNumerico || montoNumerico <= 0) {
      toast({
        title: "Error",
        description: "El monto debe ser mayor a 0",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      let response

      if (foto) {
        // Si hay foto, enviar como FormData
        const formData = new FormData()
        formData.append("concepto", concepto.trim())
        formData.append("monto", montoNumerico.toString())
        if (observaciones.trim()) {
          formData.append("observaciones", observaciones.trim())
        }
        formData.append("foto", foto)

        response = await fetch('/api/gastos', {
          method: 'POST',
          body: formData,
        })
      } else {
        // Si no hay foto, enviar como JSON
        response = await fetch('/api/gastos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            concepto: concepto.trim(),
            monto: montoNumerico,
            observaciones: observaciones.trim() || undefined
          }),
        })
      }

      if (response.ok) {
        onSuccess()
        handleClose()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "No se pudo registrar el gasto",
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

  const handleClose = () => {
    setConcepto("")
    setMonto("")
    setObservaciones("")
    setFoto(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Receipt className="h-5 w-5 text-red-600" />
            <span>Nuevo Gasto</span>
          </DialogTitle>
          <DialogDescription>
            Registra un nuevo gasto en el sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="concepto">Concepto del gasto *</Label>
            <Input
              id="concepto"
              type="text"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              placeholder="Ej: Combustible, Almuerzo, Papelería..."
              className="mt-1"
              required
              disabled={loading}
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="monto">Monto *</Label>
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
          </div>

          <div>
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Detalles adicionales del gasto..."
              className="mt-1"
              disabled={loading}
              maxLength={255}
            />
          </div>

          <div>
            <Label htmlFor="foto">Foto de la boleta o factura</Label>
            <div className="mt-1">
              {!foto ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary cursor-pointer transition-colors"
                >
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-1">
                    Haz clic para subir una foto
                  </p>
                  <p className="text-xs text-gray-500">
                    JPG, PNG, WEBP o PDF (máx. 5MB)
                  </p>
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg p-4">
                  {previewUrl ? (
                    <div className="relative">
                      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden mb-2">
                        <Image
                          src={previewUrl}
                          alt="Preview"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-600">
                          <ImageIcon className="h-4 w-4 mr-2" />
                          <span className="truncate max-w-[200px]">{foto.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveFile}
                          disabled={loading}
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        <Receipt className="h-4 w-4 mr-2" />
                        <span className="truncate max-w-[200px]">{foto.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveFile}
                        disabled={loading}
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                id="foto"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                onChange={handleFileChange}
                className="hidden"
                disabled={loading}
              />
            </div>
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
              disabled={loading || !concepto.trim() || !monto}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Registrar Gasto"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
