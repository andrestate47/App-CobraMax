

"use client"

import { useState } from "react"
import { X, Download, ZoomIn, ZoomOut, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface ImageViewerModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  title: string
  subtitle?: string
}

export default function ImageViewerModal({ 
  isOpen, 
  onClose, 
  imageUrl, 
  title, 
  subtitle 
}: ImageViewerModalProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const { toast } = useToast()

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5))
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${title.replace(/\s+/g, '_')}_${Date.now()}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "Imagen descargada",
        description: "La imagen se ha descargado exitosamente",
      })
    } catch (error) {
      console.error('Error downloading image:', error)
      toast({
        title: "Error",
        description: "No se pudo descargar la imagen",
        variant: "destructive",
      })
    }
  }

  const resetTransforms = () => {
    setZoom(1)
    setRotation(0)
  }

  const handleClose = () => {
    resetTransforms()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-black/95">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-black/50 p-4 flex items-center justify-between">
          <div className="text-white">
            <h3 className="font-semibold text-lg">{title}</h3>
            {subtitle && <p className="text-gray-300 text-sm">{subtitle}</p>}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Controles de zoom y rotación */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              className="text-white hover:bg-white/20"
              disabled={zoom <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <span className="text-white text-sm min-w-[4rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              className="text-white hover:bg-white/20"
              disabled={zoom >= 3}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRotate}
              className="text-white hover:bg-white/20"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="text-white hover:bg-white/20"
            >
              <Download className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Área de imagen */}
        <div className="relative w-full h-[80vh] flex items-center justify-center overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="max-w-full max-h-full object-contain transition-transform duration-200 cursor-move"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center'
            }}
            onError={(e) => {
              console.error('Error loading image:', e)
              toast({
                title: "Error",
                description: "No se pudo cargar la imagen",
                variant: "destructive",
              })
            }}
            onDoubleClick={() => {
              if (zoom === 1) {
                setZoom(2)
              } else {
                resetTransforms()
              }
            }}
          />
        </div>

        {/* Footer con instrucciones */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/50 p-2 text-center">
          <p className="text-gray-300 text-xs">
            💡 Haz doble clic para hacer zoom • Usa los controles para ajustar la vista
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

