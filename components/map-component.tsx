
"use client"

import { useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet"
import L from "leaflet"

// Configurar icono del marcador
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

L.Marker.prototype.options.icon = defaultIcon

interface MapComponentProps {
  latitud: number
  longitud: number
  onMapClick: (lat: number, lng: number) => void
}

// Componente para manejar clicks en el mapa
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng)
    }
  })
  return null
}

// Componente para centrar el mapa cuando cambian las coordenadas
function MapCenterUpdater({ latitud, longitud }: { latitud: number; longitud: number }) {
  const map = useMap()
  
  useEffect(() => {
    map.setView([latitud, longitud], map.getZoom())
  }, [latitud, longitud, map])
  
  return null
}

export default function MapComponent({ latitud, longitud, onMapClick }: MapComponentProps) {
  return (
    <MapContainer
      center={[latitud, longitud]}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Tiled_web_map_numbering.png/320px-Tiled_web_map_numbering.png"
      />
      <Marker
        position={[latitud, longitud]}
        draggable={true}
        eventHandlers={{
          dragend: (e) => {
            const marker = e.target
            const position = marker.getLatLng()
            onMapClick(position.lat, position.lng)
          }
        }}
      />
      <MapClickHandler onMapClick={onMapClick} />
      <MapCenterUpdater latitud={latitud} longitud={longitud} />
    </MapContainer>
  )
}
