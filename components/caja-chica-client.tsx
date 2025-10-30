
"use client"

import { Session } from "next-auth"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  Download,
  Plus,
  RefreshCw,
  Calendar,
  User,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface CajaChicaClientProps {
  session: Session
}

interface MovimientoCajaChica {
  id: string
  tipo: string
  monto: number
  descripcion: string
  fecha: string
  estado: string
  cobradorId: string
  cobrador: {
    nombre: string
    apellido: string
  }
  asignadoPorId: string | null
  asignadoPor?: {
    nombre: string
    apellido: string
  }
}

interface BalanceData {
  balance: number
  totalEntregado: number
  totalGastado: number
  totalDevuelto: number
}

export default function CajaChicaClient({ session }: CajaChicaClientProps) {
  const { toast } = useToast()
  const router = useRouter()
  const user = session?.user
  const isCobrador = user?.role === 'COBRADOR'
  const titulo = isCobrador ? "Caja Chica" : "Viáticos"

  // Estados
  const [movimientos, setMovimientos] = useState<MovimientoCajaChica[]>([])
  const [balance, setBalance] = useState<BalanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [cobradores, setCobradores] = useState<any[]>([])
  
  // Filtros
  const [filtroFechaInicio, setFiltroFechaInicio] = useState("")
  const [filtroFechaFin, setFiltroFechaFin] = useState("")
  const [filtroCobrador, setFiltroCobrador] = useState("all")
  const [filtroTipo, setFiltroTipo] = useState("all")
  const [filtroEstado, setFiltroEstado] = useState("all")

  // Modal asignar efectivo
  const [openAsignarDialog, setOpenAsignarDialog] = useState(false)
  const [asignarData, setAsignarData] = useState({
    cobradorId: "",
    monto: "",
    descripcion: ""
  })

  useEffect(() => {
    cargarDatos()
    if (!isCobrador) {
      cargarCobradores()
    }
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const endpoint = isCobrador ? "/api/caja-chica" : "/api/caja-chica/todos"
      const response = await fetch(endpoint)
      
      if (!response.ok) throw new Error("Error al cargar datos")
      
      const data = await response.json()
      
      if (isCobrador) {
        setBalance(data.balance)
        setMovimientos(data.movimientos)
      } else {
        setMovimientos(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const cargarCobradores = async () => {
    try {
      const response = await fetch("/api/usuarios?role=COBRADOR")
      if (!response.ok) throw new Error("Error al cargar cobradores")
      const data = await response.json()
      setCobradores(data)
    } catch (error) {
      console.error("Error cargando cobradores:", error)
    }
  }

  const handleAsignarEfectivo = async () => {
    if (!asignarData.cobradorId || !asignarData.monto) {
      toast({
        title: "Error",
        description: "Complete todos los campos requeridos",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch("/api/caja-chica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "ENTREGADO",
          monto: parseFloat(asignarData.monto),
          descripcion: asignarData.descripcion,
          cobradorId: asignarData.cobradorId
        })
      })

      if (!response.ok) throw new Error("Error al asignar efectivo")

      toast({
        title: "Éxito",
        description: "Efectivo asignado correctamente"
      })

      setOpenAsignarDialog(false)
      setAsignarData({ cobradorId: "", monto: "", descripcion: "" })
      cargarDatos()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo asignar el efectivo",
        variant: "destructive"
      })
    }
  }

  const handleAprobarRechazar = async (movimientoId: string, accion: 'APROBADO' | 'RECHAZADO') => {
    try {
      const response = await fetch(`/api/caja-chica/${movimientoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: accion })
      })

      if (!response.ok) throw new Error("Error al actualizar estado")

      toast({
        title: "Éxito",
        description: `Movimiento ${accion.toLowerCase()} correctamente`
      })

      cargarDatos()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive"
      })
    }
  }

  const movimientosFiltrados = movimientos.filter(mov => {
    if (filtroFechaInicio && new Date(mov.fecha) < new Date(filtroFechaInicio)) return false
    if (filtroFechaFin && new Date(mov.fecha) > new Date(filtroFechaFin)) return false
    if (filtroCobrador !== "all" && mov.cobradorId !== filtroCobrador) return false
    if (filtroTipo !== "all" && mov.tipo !== filtroTipo) return false
    if (filtroEstado !== "all" && mov.estado !== filtroEstado) return false
    return true
  })

  const calcularTotales = () => {
    if (isCobrador && balance) {
      return balance
    }

    const totales = movimientosFiltrados.reduce((acc, mov) => {
      switch (mov.tipo) {
        case "ENTREGADO":
          acc.totalEntregado += mov.monto
          break
        case "GASTADO":
          acc.totalGastado += mov.monto
          break
        case "DEVUELTO":
          acc.totalDevuelto += mov.monto
          break
      }
      return acc
    }, { totalEntregado: 0, totalGastado: 0, totalDevuelto: 0, balance: 0 })

    totales.balance = totales.totalEntregado - totales.totalGastado - totales.totalDevuelto

    return totales
  }

  const totales = calcularTotales()

  const exportarReporte = () => {
    const csv = [
      ["Fecha", "Cobrador", "Tipo", "Monto", "Descripción", "Estado", "Asignado/Aprobado Por"],
      ...movimientosFiltrados.map(mov => [
        format(new Date(mov.fecha), "dd/MM/yyyy HH:mm", { locale: es }),
        `${mov.cobrador.nombre} ${mov.cobrador.apellido}`,
        mov.tipo,
        mov.monto.toFixed(2),
        mov.descripcion || "",
        mov.estado,
        mov.asignadoPor ? `${mov.asignadoPor.nombre} ${mov.asignadoPor.apellido}` : ""
      ])
    ].map(row => row.join(",")).join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reporte-${titulo.toLowerCase().replace(" ", "-")}-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{titulo}</h1>
            <p className="text-muted-foreground">
              {isCobrador 
                ? "Gestión de tu efectivo diario" 
                : "Gestión de viáticos del equipo"}
            </p>
          </div>
        </div>
        {!isCobrador && (
          <Dialog open={openAsignarDialog} onOpenChange={setOpenAsignarDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Asignar Efectivo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Asignar Efectivo a Cobrador</DialogTitle>
                <DialogDescription>
                  Registra la entrega de efectivo para viáticos
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Cobrador</Label>
                  <Select 
                    value={asignarData.cobradorId} 
                    onValueChange={(value) => setAsignarData({...asignarData, cobradorId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione cobrador" />
                    </SelectTrigger>
                    <SelectContent>
                      {cobradores.map(cobrador => (
                        <SelectItem key={cobrador.id} value={cobrador.id}>
                          {cobrador.nombre} {cobrador.apellido}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Monto (Bs.)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={asignarData.monto}
                    onChange={(e) => setAsignarData({...asignarData, monto: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Descripción</Label>
                  <Textarea
                    value={asignarData.descripcion}
                    onChange={(e) => setAsignarData({...asignarData, descripcion: e.target.value})}
                    placeholder="Motivo de la asignación..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenAsignarDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAsignarEfectivo}>
                  Asignar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Resumen de Balance */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance Actual</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Bs. {totales.balance.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entregado</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Bs. {totales.totalEntregado.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gastado</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              Bs. {totales.totalGastado.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devuelto</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              Bs. {totales.totalDevuelto.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros (solo para supervisores/admin) */}
      {!isCobrador && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div>
                <Label>Fecha Inicio</Label>
                <Input
                  type="date"
                  value={filtroFechaInicio}
                  onChange={(e) => setFiltroFechaInicio(e.target.value)}
                />
              </div>
              <div>
                <Label>Fecha Fin</Label>
                <Input
                  type="date"
                  value={filtroFechaFin}
                  onChange={(e) => setFiltroFechaFin(e.target.value)}
                />
              </div>
              <div>
                <Label>Cobrador</Label>
                <Select value={filtroCobrador} onValueChange={setFiltroCobrador}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {cobradores.map(cobrador => (
                      <SelectItem key={cobrador.id} value={cobrador.id}>
                        {cobrador.nombre} {cobrador.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ENTREGADO">Entregado</SelectItem>
                    <SelectItem value="GASTADO">Gastado</SelectItem>
                    <SelectItem value="DEVUELTO">Devuelto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                    <SelectItem value="APROBADO">Aprobado</SelectItem>
                    <SelectItem value="RECHAZADO">Rechazado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button 
                variant="outline"
                onClick={() => {
                  setFiltroFechaInicio("")
                  setFiltroFechaFin("")
                  setFiltroCobrador("all")
                  setFiltroTipo("all")
                  setFiltroEstado("all")
                }}
              >
                Limpiar Filtros
              </Button>
              <Button variant="outline" onClick={exportarReporte}>
                <Download className="mr-2 h-4 w-4" />
                Exportar Reporte
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla de Movimientos */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Movimientos</CardTitle>
          <CardDescription>
            {movimientosFiltrados.length} movimiento(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Fecha</th>
                  {!isCobrador && <th className="text-left p-2">Cobrador</th>}
                  <th className="text-left p-2">Tipo</th>
                  <th className="text-right p-2">Monto</th>
                  <th className="text-left p-2">Descripción</th>
                  <th className="text-center p-2">Estado</th>
                  {!isCobrador && <th className="text-left p-2">Asignado/Aprobado Por</th>}
                  {!isCobrador && <th className="text-center p-2">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {movimientosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={isCobrador ? 5 : 8} className="text-center p-8 text-muted-foreground">
                      No hay movimientos para mostrar
                    </td>
                  </tr>
                ) : (
                  movimientosFiltrados.map((mov) => (
                    <tr key={mov.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(mov.fecha), "dd/MM/yyyy HH:mm", { locale: es })}
                        </div>
                      </td>
                      {!isCobrador && (
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {mov.cobrador.nombre} {mov.cobrador.apellido}
                          </div>
                        </td>
                      )}
                      <td className="p-2">
                        <Badge variant={
                          mov.tipo === "ENTREGADO" ? "default" :
                          mov.tipo === "GASTADO" ? "destructive" : "secondary"
                        }>
                          {mov.tipo}
                        </Badge>
                      </td>
                      <td className="p-2 text-right font-medium">
                        Bs. {mov.monto.toFixed(2)}
                      </td>
                      <td className="p-2 max-w-xs truncate">
                        {mov.descripcion || "-"}
                      </td>
                      <td className="p-2 text-center">
                        <Badge variant={
                          mov.estado === "APROBADO" ? "default" :
                          mov.estado === "RECHAZADO" ? "destructive" : "outline"
                        }>
                          {mov.estado === "PENDIENTE" && <Clock className="h-3 w-3 mr-1" />}
                          {mov.estado === "APROBADO" && <CheckCircle className="h-3 w-3 mr-1" />}
                          {mov.estado === "RECHAZADO" && <XCircle className="h-3 w-3 mr-1" />}
                          {mov.estado}
                        </Badge>
                      </td>
                      {!isCobrador && (
                        <td className="p-2">
                          {mov.asignadoPor ? (
                            `${mov.asignadoPor.nombre} ${mov.asignadoPor.apellido}`
                          ) : "-"}
                        </td>
                      )}
                      {!isCobrador && (
                        <td className="p-2">
                          {mov.estado === "PENDIENTE" && (
                            <div className="flex gap-2 justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAprobarRechazar(mov.id, "APROBADO")}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Aprobar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAprobarRechazar(mov.id, "RECHAZADO")}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Rechazar
                              </Button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
