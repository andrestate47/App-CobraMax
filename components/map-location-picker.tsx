
"use client"

import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { MapPin, Search, Navigation, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

// Importar CSS de Leaflet
import "leaflet/dist/leaflet.css"

interface MapLocationPickerProps {
  initialLatitud?: number
  initialLongitud?: number
  initialAddress?: string
  onLocationChange: (location: {
    latitud: number
    longitud: number
    address: string
  }) => void
}

// Componente del mapa que se carga dinámicamente
const MapComponent = dynamic(
  () => import("@/components/map-component").then(mod => ({ default: mod.default })),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }
)

export default function MapLocationPicker({
  initialLatitud,
  initialLongitud,
  initialAddress,
  onLocationChange
}: MapLocationPickerProps) {
  const [latitud, setLatitud] = useState<number>(initialLatitud || -16.5)
  const [longitud, setLongitud] = useState<number>(initialLongitud || -68.15)
  const [address, setAddress] = useState(initialAddress || "")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const { toast } = useToast()

  // Geocodificación inversa (coordenadas a dirección)
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'CobranzaApp/1.0'
          }
        }
      )
      const data = await response.json()
      
      if (data && data.display_name) {
        return data.display_name
      }
      return ""
    } catch (error) {
      console.error("Error en geocodificación inversa:", error)
      return ""
    }
  }

  // Geocodificación (dirección a coordenadas)
  const geocodeAddress = async (query: string) => {
    if (!query.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        {
          headers: {
            'User-Agent': 'CobranzaApp/1.0'
          }
        }
      )
      const data = await response.json()
      
      if (data && data.length > 0) {
        const result = data[0]
        const newLat = parseFloat(result.lat)
        const newLng = parseFloat(result.lon)
        
        setLatitud(newLat)
        setLongitud(newLng)
        setAddress(result.display_name)
        
        onLocationChange({
          latitud: newLat,
          longitud: newLng,
          address: result.display_name
        })
        
        toast({
          title: "Ubicación encontrada",
          description: "Se ha actualizado la ubicación en el mapa"
        })
      } else {
        toast({
          title: "No se encontró la ubicación",
          description: "Intenta con otra búsqueda",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error en geocodificación:", error)
      toast({
        title: "Error",
        description: "No se pudo buscar la ubicación",
        variant: "destructive"
      })
    } finally {
      setIsSearching(false)
    }
  }

  // Obtener ubicación actual del navegador
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocalización no disponible",
        description: "Tu navegador no soporta geolocalización",
        variant: "destructive"
      })
      return
    }

    setIsGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const newLat = position.coords.latitude
        const newLng = position.coords.longitude
        
        setLatitud(newLat)
        setLongitud(newLng)
        
        // Obtener dirección de las coordenadas
        const addr = await reverseGeocode(newLat, newLng)
        setAddress(addr)
        
        onLocationChange({
          latitud: newLat,
          longitud: newLng,
          address: addr
        })
        
        setIsGettingLocation(false)
        
        toast({
          title: "Ubicación detectada",
          description: "Se ha actualizado tu ubicación actual"
        })
      },
      (error) => {
        setIsGettingLocation(false)
        toast({
          title: "Error de geolocalización",
          description: "No se pudo obtener tu ubicación actual",
          variant: "destructive"
        })
        console.error("Error getting location:", error)
      }
    )
  }

  // Manejar cambio de ubicación desde el mapa
  const handleMapClick = async (lat: number, lng: number) => {
    setLatitud(lat)
    setLongitud(lng)
    
    // Obtener dirección de las coordenadas
    const addr = await reverseGeocode(lat, lng)
    setAddress(addr)
    
    onLocationChange({
      latitud: lat,
      longitud: lng,
      address: addr
    })
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-2">
        <Label className="text-base font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Seleccionar Ubicación en el Mapa
        </Label>
        <p className="text-sm text-gray-600">
          Haz clic en el mapa para seleccionar la ubicación, busca una dirección o usa tu ubicación actual
        </p>
      </div>

      {/* Buscador y botón de ubicación actual */}
      <div className="flex gap-2">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Buscar dirección (ej: La Paz, Bolivia)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                geocodeAddress(searchQuery)
              }
            }}
          />
          <Button
            type="button"
            onClick={() => geocodeAddress(searchQuery)}
            disabled={isSearching || !searchQuery.trim()}
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          title="Usar mi ubicación actual"
        >
          {isGettingLocation ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Mapa */}
      <div className="relative w-full h-[400px] rounded-lg overflow-hidden border-2 border-gray-200">
        <MapComponent
          latitud={latitud}
          longitud={longitud}
          onMapClick={handleMapClick}
        />
      </div>

      {/* Información de coordenadas */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <Label className="text-xs text-gray-600">Latitud</Label>
          <p className="font-mono font-semibold">{latitud.toFixed(6)}</p>
        </div>
        <div>
          <Label className="text-xs text-gray-600">Longitud</Label>
          <p className="font-mono font-semibold">{longitud.toFixed(6)}</p>
        </div>
      </div>

      {/* Dirección encontrada */}
      {address && (
        <div>
          <Label className="text-xs text-gray-600">Dirección detectada</Label>
          <p className="text-sm mt-1 p-2 bg-gray-50 rounded border">{address}</p>
        </div>
      )}
    </Card>
  )
}
