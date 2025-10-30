
"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Camera, X, RotateCcw, Download, Check, User, CreditCard, Upload, Image } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface CameraModalProps {
  isOpen: boolean
  onClose: () => void
  clienteId: string
  clienteNombre: string
  onPhotoSaved?: () => void
}

type PhotoType = 'cliente' | 'dni' | null
type PhotoMode = 'select' | 'camera' | 'upload'

export default function CameraModal({ 
  isOpen, 
  onClose, 
  clienteId, 
  clienteNombre, 
  onPhotoSaved 
}: CameraModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [photoType, setPhotoType] = useState<PhotoType>(null)
  const [photoMode, setPhotoMode] = useState<PhotoMode>('select')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const startCamera = useCallback(async () => {
    if (!isOpen || photoMode !== 'camera') return
    
    setIsLoading(true)
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user' // Preferir cámara frontal
        } 
      })
      
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      toast({
        title: "Error de cámara",
        description: "No se pudo acceder a la cámara. Verifica los permisos.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [isOpen, photoMode, toast])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [stream])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (context) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0)
      
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8)
      setCapturedImage(imageDataUrl)
    }
  }, [])

  const retakePhoto = useCallback(() => {
    setCapturedImage(null)
  }, [])

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Archivo inválido",
          description: "Por favor selecciona un archivo de imagen",
          variant: "destructive",
        })
        return
      }

      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "El archivo no puede superar 10MB",
          variant: "destructive",
        })
        return
      }

      setSelectedFile(file)
      
      // Crear preview de la imagen
      const reader = new FileReader()
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [toast])

  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const savePhoto = useCallback(async () => {
    if (!capturedImage || !photoType) return

    setIsSaving(true)
    try {
      let blob: Blob
      let fileName: string

      if (photoMode === 'upload' && selectedFile) {
        // Usar el archivo seleccionado directamente
        blob = selectedFile
        fileName = `${photoType}-${clienteId}-${Date.now()}.${selectedFile.name.split('.').pop()}`
      } else {
        // Convertir base64 a blob (imagen capturada)
        const response = await fetch(capturedImage)
        blob = await response.blob()
        fileName = `${photoType}-${clienteId}-${Date.now()}.jpg`
      }
      
      // Crear FormData
      const formData = new FormData()
      formData.append('photo', blob, fileName)
      formData.append('clienteId', clienteId)
      formData.append('photoType', photoType)

      // Enviar al servidor
      const saveResponse = await fetch('/api/clientes/photos', {
        method: 'POST',
        body: formData,
      })

      if (saveResponse.ok) {
        const data = await saveResponse.json()
        toast({
          title: "Foto guardada",
          description: `La foto del ${photoType === 'cliente' ? 'cliente' : 'DNI'} se ha guardado exitosamente.`,
        })
        
        // Notificar al componente padre
        onPhotoSaved?.()
        
        // Resetear estados
        resetAllStates()
        
        // Cerrar modal
        handleClose()
      } else {
        const errorData = await saveResponse.json()
        toast({
          title: "Error",
          description: errorData.error || "No se pudo guardar la foto",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error saving photo:', error)
      toast({
        title: "Error",
        description: "Error al guardar la foto",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, [capturedImage, photoType, photoMode, selectedFile, clienteId, toast, onPhotoSaved])

  const resetAllStates = useCallback(() => {
    setCapturedImage(null)
    setPhotoType(null)
    setPhotoMode('select')
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleClose = useCallback(() => {
    stopCamera()
    resetAllStates()
    onClose()
  }, [stopCamera, resetAllStates, onClose])

  const downloadPhoto = useCallback(() => {
    if (capturedImage) {
      const link = document.createElement('a')
      link.download = `${photoType}-${clienteNombre}-${new Date().toISOString().split('T')[0]}.jpg`
      link.href = capturedImage
      link.click()
    }
  }, [capturedImage, photoType, clienteNombre])

  // Efectos
  useEffect(() => {
    if (isOpen && photoMode === 'camera') {
      startCamera()
    } else {
      stopCamera()
    }
    
    return () => stopCamera()
  }, [isOpen, photoMode, startCamera, stopCamera])

  // Limpiar al cerrar
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center space-x-2">
            {photoMode === 'camera' ? (
              <Camera className="h-5 w-5" />
            ) : photoMode === 'upload' ? (
              <Upload className="h-5 w-5" />
            ) : (
              <Image className="h-5 w-5" />
            )}
            <span>
              {photoMode === 'camera' ? 'Capturar Foto' : 
               photoMode === 'upload' ? 'Subir Imagen' : 
               'Agregar Foto'} - {clienteNombre}
            </span>
          </DialogTitle>
          <DialogDescription>
            {photoMode === 'select' ? 
              'Selecciona el tipo de foto y cómo deseas agregarla' :
              photoMode === 'camera' ?
              'Captura la imagen usando la cámara de tu dispositivo' :
              'Selecciona una imagen desde tu dispositivo'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 pt-0">
          {/* Paso 1: Selector de tipo de foto */}
          {photoMode === 'select' && !photoType && (
            <div className="space-y-4 mb-6">
              <h3 className="text-sm font-medium">¿Qué foto deseas agregar?</h3>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setPhotoType('cliente')}
                  className="flex-1 h-16 flex-col space-y-1"
                >
                  <User className="h-6 w-6" />
                  <span>Foto del Cliente</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPhotoType('dni')}
                  className="flex-1 h-16 flex-col space-y-1"
                >
                  <CreditCard className="h-6 w-6" />
                  <span>Foto del DNI</span>
                </Button>
              </div>
            </div>
          )}

          {/* Paso 2: Selector de método cuando se ha elegido el tipo */}
          {photoMode === 'select' && photoType && !capturedImage && (
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="flex items-center space-x-1">
                  {photoType === 'cliente' ? (
                    <User className="h-3 w-3" />
                  ) : (
                    <CreditCard className="h-3 w-3" />
                  )}
                  <span>
                    {photoType === 'cliente' ? 'Foto del Cliente' : 'Foto del DNI'}
                  </span>
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPhotoType(null)
                    resetAllStates()
                  }}
                >
                  Cambiar tipo
                </Button>
              </div>

              <h3 className="text-sm font-medium">¿Cómo deseas agregar la foto?</h3>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setPhotoMode('camera')}
                  className="flex-1 h-20 flex-col space-y-2"
                >
                  <Camera className="h-8 w-8" />
                  <div className="text-center">
                    <div className="font-medium">Tomar Foto</div>
                    <div className="text-xs text-gray-500">Usar la cámara</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPhotoMode('upload')}
                  className="flex-1 h-20 flex-col space-y-2"
                >
                  <Upload className="h-8 w-8" />
                  <div className="text-center">
                    <div className="font-medium">Subir Archivo</div>
                    <div className="text-xs text-gray-500">Desde dispositivo</div>
                  </div>
                </Button>
              </div>
            </div>
          )}

          {/* Mostrar tipo y modo seleccionados cuando estamos en camera o upload */}
          {photoType && photoMode !== 'select' && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="flex items-center space-x-1">
                  {photoType === 'cliente' ? (
                    <User className="h-3 w-3" />
                  ) : (
                    <CreditCard className="h-3 w-3" />
                  )}
                  <span>
                    {photoType === 'cliente' ? 'Foto del Cliente' : 'Foto del DNI'}
                  </span>
                </Badge>
                <Badge className="flex items-center space-x-1">
                  {photoMode === 'camera' ? (
                    <Camera className="h-3 w-3" />
                  ) : (
                    <Upload className="h-3 w-3" />
                  )}
                  <span>
                    {photoMode === 'camera' ? 'Cámara' : 'Subir Archivo'}
                  </span>
                </Badge>
              </div>
              
              {!capturedImage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPhotoMode('select')
                    resetAllStates()
                  }}
                >
                  Cambiar método
                </Button>
              )}
            </div>
          )}

          {/* Input oculto para selección de archivos */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Área de subida de archivo */}
          {photoMode === 'upload' && !capturedImage && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
              <div className="text-center">
                <Image className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Subir imagen desde dispositivo
                </h3>
                <p className="text-gray-500 mb-4">
                  Selecciona una imagen desde tu galería o archivos
                </p>
                <Button
                  onClick={triggerFileSelect}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Seleccionar Archivo
                </Button>
                <p className="text-xs text-gray-400 mt-2">
                  Formatos: JPG, PNG, GIF • Máximo: 10MB
                </p>
              </div>
            </div>
          )}

          {/* Área de cámara/foto */}
          {(photoMode === 'camera' || capturedImage) && (
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p>Iniciando cámara...</p>
                  </div>
                </div>
              )}
              
              {/* Video en vivo */}
              {!capturedImage && photoMode === 'camera' && (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}

              {/* Imagen capturada o subida */}
              {capturedImage && (
                <img
                  src={capturedImage}
                  alt={photoMode === 'camera' ? 'Foto capturada' : 'Imagen seleccionada'}
                  className="w-full h-full object-cover"
                />
              )}

              {/* Canvas oculto para captura */}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {/* Controles */}
          {photoType && photoMode !== 'select' && (
            <div className="flex justify-center space-x-3 mt-6">
              {!capturedImage ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPhotoMode('select')
                      resetAllStates()
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  
                  {photoMode === 'camera' && (
                    <Button
                      onClick={capturePhoto}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Capturar
                    </Button>
                  )}
                  
                  {photoMode === 'upload' && (
                    <Button
                      onClick={triggerFileSelect}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Seleccionar Archivo
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCapturedImage(null)
                      setSelectedFile(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {photoMode === 'camera' ? 'Tomar otra' : 'Elegir otra'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={downloadPhoto}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar
                  </Button>
                  
                  <Button
                    onClick={savePhoto}
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Guardar
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
