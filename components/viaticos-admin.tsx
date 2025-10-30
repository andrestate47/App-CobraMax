
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, Plus, DollarSign, Users, History } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "react-hot-toast"

interface Cobrador {
  id: string
  nombre: string
  numeroRuta: string | null
  saldoActual: number
}

interface Movimiento {
  id: string
  cobradorId: string
  cobrador: string
  tipo: string
  monto: number
  saldoAnterior: number
  saldoNuevo: number
  fecha: string
  observaciones: string | null
  asignadoPor: string | null
}

export function ViaticosAdmin() {
  const [loading, setLoading] = useState(true)
  const [cobradores, setCobradores] = useState<Cobrador[]>([])
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [selectedCobrador, setSelectedCobrador] = useState("")
  const [tipo, setTipo] = useState("ENTREGA")
  const [monto, setMonto] = useState("")
  const [observaciones, setObservaciones] = useState("")

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/caja-chica/todos")
      const data = await response.json()

      if (data.success) {
        setCobradores(data.cobradores)
        setMovimientos(data.movimientosRecientes)
      }
    } catch (error) {
      console.error("Error al cargar viáticos:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedCobrador || !monto) {
      toast.error("Por favor completa todos los campos requeridos")
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch("/api/caja-chica", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cobradorId: selectedCobrador,
          tipo,
          monto: parseFloat(monto),
          observaciones,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Movimiento registrado exitosamente")
        setDialogOpen(false)
        resetForm()
        fetchData()
      } else {
        toast.error(data.error || "Error al registrar movimiento")
      }
    } catch (error) {
      console.error("Error al registrar movimiento:", error)
      toast.error("Error al registrar movimiento")
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedCobrador("")
    setTipo("ENTREGA")
    setMonto("")
    setObservaciones("")
  }

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      ENTREGA: "Entrega",
      DEVOLUCION: "Devolución",
      AJUSTE: "Ajuste",
      GASTO: "Gasto",
    }
    return labels[tipo] || tipo
  }

  const getTipoBadge = (tipo: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ENTREGA: "default",
      DEVOLUCION: "secondary",
      AJUSTE: "outline",
      GASTO: "destructive",
    }
    return variants[tipo] || "default"
  }

  const totalViaticos = cobradores.reduce((sum, c) => sum + c.saldoActual, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Viáticos
            </CardTitle>
            <CardDescription>
              Gestión de efectivo para cobradores
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Nuevo Movimiento
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Movimiento</DialogTitle>
                  <DialogDescription>
                    Asigna o registra movimientos de caja chica
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="cobrador">Cobrador</Label>
                    <Select value={selectedCobrador} onValueChange={setSelectedCobrador}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cobrador" />
                      </SelectTrigger>
                      <SelectContent>
                        {cobradores.map((cobrador) => (
                          <SelectItem key={cobrador.id} value={cobrador.id}>
                            {cobrador.nombre} {cobrador.numeroRuta ? `(Ruta ${cobrador.numeroRuta})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="tipo">Tipo de Movimiento</Label>
                    <Select value={tipo} onValueChange={setTipo}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ENTREGA">Entrega</SelectItem>
                        <SelectItem value="DEVOLUCION">Devolución</SelectItem>
                        <SelectItem value="AJUSTE">Ajuste</SelectItem>
                        <SelectItem value="GASTO">Gasto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="monto">Monto</Label>
                    <Input
                      id="monto"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <Textarea
                      id="observaciones"
                      placeholder="Notas adicionales..."
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Guardando..." : "Guardar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Resumen de Cobradores */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4 mb-4">
            <p className="text-sm font-medium opacity-90 mb-1">Total Viáticos Activos</p>
            <p className="text-3xl font-bold">
              ${totalViaticos.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm opacity-75 mt-1">{cobradores.length} cobradores</p>
          </div>

          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Saldos por Cobrador
          </h3>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {cobradores.map((cobrador) => (
                <div
                  key={cobrador.id}
                  className="border rounded-lg p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{cobrador.nombre}</p>
                    {cobrador.numeroRuta && (
                      <p className="text-sm text-gray-500">Ruta {cobrador.numeroRuta}</p>
                    )}
                  </div>
                  <span className={`font-semibold ${
                    cobrador.saldoActual > 0 ? "text-green-600" : "text-gray-400"
                  }`}>
                    ${cobrador.saldoActual.toLocaleString("es-DO")}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Movimientos Recientes */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <History className="h-4 w-4" />
            Movimientos Recientes
          </h3>
          <ScrollArea className="h-[300px] pr-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p>Cargando movimientos...</p>
              </div>
            ) : movimientos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No hay movimientos registrados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {movimientos.map((mov) => (
                  <div
                    key={mov.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{mov.cobrador}</p>
                        <Badge variant={getTipoBadge(mov.tipo)} className="mt-1">
                          {getTipoLabel(mov.tipo)}
                        </Badge>
                      </div>
                      <span className={`text-lg font-semibold ${
                        mov.tipo === "ENTREGA" ? "text-green-600" : "text-red-600"
                      }`}>
                        {mov.tipo === "ENTREGA" ? "+" : "-"}${mov.monto.toLocaleString("es-DO")}
                      </span>
                    </div>
                    <div className="text-sm space-y-1">
                      <p className="text-gray-600">
                        Saldo: ${mov.saldoAnterior.toLocaleString("es-DO")} → ${mov.saldoNuevo.toLocaleString("es-DO")}
                      </p>
                      <p className="text-gray-500">
                        {format(new Date(mov.fecha), "PPp", { locale: es })}
                      </p>
                      {mov.asignadoPor && (
                        <p className="text-gray-500">
                          Por: {mov.asignadoPor}
                        </p>
                      )}
                      {mov.observaciones && (
                        <p className="text-gray-600 mt-2 italic">
                          {mov.observaciones}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}
