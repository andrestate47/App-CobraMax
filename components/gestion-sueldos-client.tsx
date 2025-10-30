
"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Plus, 
  Settings, 
  DollarSign, 
  Eye,
  UserCheck,
  Calculator,
  Calendar,
  AlertCircle,
  Home,
  ArrowLeft
} from "lucide-react"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
}

interface ConfiguracionSueldo {
  id: string
  userId: string
  salarioBase: string
  comisionPorCobro: string
  limitePorcentajeAvance: number
  montoMinimoAvance: string
  activo: boolean
  usuario: User
  createdAt: string
  updatedAt: string
}

interface PagoSueldo {
  id: string
  cobradorId: string
  pagadorId: string
  tipo: string
  periodo?: string
  montoBase: string
  montoComisiones: string
  montoTotal: string
  montoAvances: string
  montoFinal: string
  estado: string
  observaciones?: string
  fechaPago?: string
  metodoPago?: string
  cobrador: User
  pagador: User
  createdAt: string
  updatedAt: string
}

export default function GestionSueldosClient() {
  const { data: session } = useSession()
  const router = useRouter()
  const [configuraciones, setConfiguraciones] = useState<ConfiguracionSueldo[]>([])
  const [pagos, setPagos] = useState<PagoSueldo[]>([])
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'configuraciones' | 'pagos'>('configuraciones')

  // Estados para modales
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [showPagoModal, setShowPagoModal] = useState(false)
  const [showComisionModal, setShowComisionModal] = useState(false)
  const [selectedConfig, setSelectedConfig] = useState<ConfiguracionSueldo | null>(null)
  const [selectedUser, setSelectedUser] = useState<string>("")

  // Estados para formularios
  const [configForm, setConfigForm] = useState({
    userId: "",
    salarioBase: "",
    comisionPorCobro: "",
    limitePorcentajeAvance: "50",
    montoMinimoAvance: "0"
  })

  const [pagoForm, setPagoForm] = useState({
    cobradorId: "",
    tipo: "SUELDO",
    periodo: "",
    montoBase: "",
    montoComisiones: "",
    montoTotal: "",
    montoAvances: "",
    montoFinal: "",
    observaciones: "",
    metodoPago: "EFECTIVO"
  })

  const [comisionData, setComisionData] = useState<any>(null)
  const [mesComision, setMesComision] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  useEffect(() => {
    if (session?.user) {
      cargarDatos()
    }
  }, [session])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      
      // Cargar configuraciones
      const configRes = await fetch('/api/sueldos/configuracion')
      if (configRes.ok) {
        const configs = await configRes.json()
        setConfiguraciones(configs)
      }

      // Cargar pagos
      const pagosRes = await fetch('/api/sueldos/pagos')
      if (pagosRes.ok) {
        const pagosData = await pagosRes.json()
        setPagos(pagosData)
      }

      // Cargar usuarios (cobradores)
      const usuariosRes = await fetch('/api/usuarios')
      if (usuariosRes.ok) {
        const usuariosData = await usuariosRes.json()
        setUsuarios(usuariosData.filter((u: User) => u.role === 'COBRADOR'))
      }

    } catch (error) {
      console.error('Error al cargar datos:', error)
      toast.error('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConfig = async () => {
    try {
      const url = selectedConfig 
        ? `/api/sueldos/configuracion/${selectedConfig.id}` 
        : '/api/sueldos/configuracion'
      
      const method = selectedConfig ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configForm)
      })

      if (response.ok) {
        toast.success(selectedConfig ? 'Configuración actualizada' : 'Configuración creada')
        setShowConfigModal(false)
        setSelectedConfig(null)
        resetConfigForm()
        cargarDatos()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al guardar configuración')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al guardar configuración')
    }
  }

  const handleSavePago = async () => {
    try {
      const response = await fetch('/api/sueldos/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pagoForm)
      })

      if (response.ok) {
        toast.success('Pago registrado correctamente')
        setShowPagoModal(false)
        resetPagoForm()
        cargarDatos()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al registrar pago')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al registrar pago')
    }
  }

  const handleEstadoPago = async (pagoId: string, nuevoEstado: string) => {
    try {
      const response = await fetch(`/api/sueldos/pagos/${pagoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      })

      if (response.ok) {
        toast.success('Estado actualizado')
        cargarDatos()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al actualizar estado')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar estado')
    }
  }

  const cargarComisiones = async (userId: string, mes: string) => {
    try {
      const response = await fetch(`/api/sueldos/comisiones/${userId}?mes=${mes}`)
      if (response.ok) {
        const data = await response.json()
        setComisionData(data)
      } else {
        toast.error('Error al cargar comisiones')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar comisiones')
    }
  }

  const resetConfigForm = () => {
    setConfigForm({
      userId: "",
      salarioBase: "",
      comisionPorCobro: "",
      limitePorcentajeAvance: "50",
      montoMinimoAvance: "0"
    })
  }

  const resetPagoForm = () => {
    setPagoForm({
      cobradorId: "",
      tipo: "SUELDO",
      periodo: "",
      montoBase: "",
      montoComisiones: "",
      montoTotal: "",
      montoAvances: "",
      montoFinal: "",
      observaciones: "",
      metodoPago: "EFECTIVO"
    })
  }

  const editarConfig = (config: ConfiguracionSueldo) => {
    setSelectedConfig(config)
    setConfigForm({
      userId: config.userId,
      salarioBase: config.salarioBase,
      comisionPorCobro: config.comisionPorCobro,
      limitePorcentajeAvance: config.limitePorcentajeAvance.toString(),
      montoMinimoAvance: config.montoMinimoAvance
    })
    setShowConfigModal(true)
  }

  const abrirModalComisiones = (userId: string) => {
    setSelectedUser(userId)
    setShowComisionModal(true)
    cargarComisiones(userId, mesComision)
  }

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      PENDIENTE: "outline",
      PAGADO: "default",
      CANCELADO: "secondary",
      RECHAZADO: "destructive"
    }
    return <Badge variant={variants[estado] || "outline"}>{estado}</Badge>
  }

  const getTipoBadge = (tipo: string) => {
    const colors: Record<string, string> = {
      SUELDO: "bg-blue-500",
      AVANCE: "bg-yellow-500",
      COMISION_EXTRA: "bg-green-500",
      DESCUENTO: "bg-red-500"
    }
    return (
      <Badge className={`${colors[tipo] || "bg-gray-500"} text-white`}>
        {tipo.replace('_', ' ')}
      </Badge>
    )
  }

  if (loading) {
    return <div className="p-6 text-center">Cargando...</div>
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Botones de navegación */}
      <div className="flex gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          Inicio
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Atrás
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de Sueldos</h1>
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'configuraciones' ? 'default' : 'outline'}
            onClick={() => setActiveTab('configuraciones')}
          >
            <Settings className="w-4 h-4 mr-2" />
            Configuraciones
          </Button>
          <Button
            variant={activeTab === 'pagos' ? 'default' : 'outline'}
            onClick={() => setActiveTab('pagos')}
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Pagos
          </Button>
        </div>
      </div>

      {activeTab === 'configuraciones' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Configuraciones de Sueldo</h2>
            <Button onClick={() => setShowConfigModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Configuración
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cobrador</TableHead>
                    <TableHead>Salario Base</TableHead>
                    <TableHead>Comisión %</TableHead>
                    <TableHead>Límite Avance %</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configuraciones.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {config.usuario.firstName} {config.usuario.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {config.usuario.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>${parseFloat(config.salarioBase).toLocaleString()}</TableCell>
                      <TableCell>{config.comisionPorCobro}%</TableCell>
                      <TableCell>{config.limitePorcentajeAvance}%</TableCell>
                      <TableCell>
                        <Badge variant={config.activo ? "default" : "secondary"}>
                          {config.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => editarConfig(config)}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => abrirModalComisiones(config.userId)}
                          >
                            <Calculator className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'pagos' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Pagos de Sueldo</h2>
            <Button onClick={() => setShowPagoModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Pago
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cobrador</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Monto Final</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Pago</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagos.map((pago) => (
                    <TableRow key={pago.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {pago.cobrador.firstName} {pago.cobrador.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {pago.cobrador.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getTipoBadge(pago.tipo)}</TableCell>
                      <TableCell>{pago.periodo || '-'}</TableCell>
                      <TableCell className="font-medium">
                        ${parseFloat(pago.montoFinal).toLocaleString()}
                      </TableCell>
                      <TableCell>{getEstadoBadge(pago.estado)}</TableCell>
                      <TableCell>
                        {pago.fechaPago ? new Date(pago.fechaPago).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {pago.estado === 'PENDIENTE' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEstadoPago(pago.id, 'PAGADO')}
                            >
                              <UserCheck className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => abrirModalComisiones(pago.cobradorId)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Configuración */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedConfig ? 'Editar Configuración' : 'Nueva Configuración'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="usuario">Cobrador</Label>
              <Select
                value={configForm.userId}
                onValueChange={(value) => setConfigForm(prev => ({ ...prev, userId: value }))}
                disabled={!!selectedConfig}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cobrador" />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id}>
                      {usuario.firstName} {usuario.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="salarioBase">Salario Base ($)</Label>
              <Input
                id="salarioBase"
                type="number"
                step="0.01"
                value={configForm.salarioBase}
                onChange={(e) => setConfigForm(prev => ({ ...prev, salarioBase: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="comision">Comisión por Cobro (%)</Label>
              <Input
                id="comision"
                type="number"
                step="0.01"
                max="100"
                value={configForm.comisionPorCobro}
                onChange={(e) => setConfigForm(prev => ({ ...prev, comisionPorCobro: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="limiteAvance">Límite de Avance (%)</Label>
              <Input
                id="limiteAvance"
                type="number"
                max="100"
                value={configForm.limitePorcentajeAvance}
                onChange={(e) => setConfigForm(prev => ({ ...prev, limitePorcentajeAvance: e.target.value }))}
                placeholder="50"
              />
            </div>

            <div>
              <Label htmlFor="montoMinimo">Monto Mínimo Avance ($)</Label>
              <Input
                id="montoMinimo"
                type="number"
                step="0.01"
                value={configForm.montoMinimoAvance}
                onChange={(e) => setConfigForm(prev => ({ ...prev, montoMinimoAvance: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowConfigModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveConfig}>
                {selectedConfig ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Pago */}
      <Dialog open={showPagoModal} onOpenChange={setShowPagoModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Pago de Sueldo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cobrador">Cobrador</Label>
              <Select
                value={pagoForm.cobradorId}
                onValueChange={(value) => setPagoForm(prev => ({ ...prev, cobradorId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cobrador" />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id}>
                      {usuario.firstName} {usuario.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tipo">Tipo de Pago</Label>
              <Select
                value={pagoForm.tipo}
                onValueChange={(value) => setPagoForm(prev => ({ ...prev, tipo: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUELDO">Sueldo Completo</SelectItem>
                  <SelectItem value="AVANCE">Avance de Sueldo</SelectItem>
                  <SelectItem value="COMISION_EXTRA">Comisión Extra</SelectItem>
                  <SelectItem value="DESCUENTO">Descuento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="periodo">Período (YYYY-MM)</Label>
              <Input
                id="periodo"
                type="month"
                value={pagoForm.periodo}
                onChange={(e) => setPagoForm(prev => ({ ...prev, periodo: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="montoBase">Salario Base ($)</Label>
                <Input
                  id="montoBase"
                  type="number"
                  step="0.01"
                  value={pagoForm.montoBase}
                  onChange={(e) => setPagoForm(prev => ({ ...prev, montoBase: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="montoComisiones">Comisiones ($)</Label>
                <Input
                  id="montoComisiones"
                  type="number"
                  step="0.01"
                  value={pagoForm.montoComisiones}
                  onChange={(e) => setPagoForm(prev => ({ ...prev, montoComisiones: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="montoAvances">Avances Descontados ($)</Label>
                <Input
                  id="montoAvances"
                  type="number"
                  step="0.01"
                  value={pagoForm.montoAvances}
                  onChange={(e) => setPagoForm(prev => ({ ...prev, montoAvances: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="montoFinal">Monto Final ($)</Label>
                <Input
                  id="montoFinal"
                  type="number"
                  step="0.01"
                  value={pagoForm.montoFinal}
                  onChange={(e) => setPagoForm(prev => ({ ...prev, montoFinal: e.target.value }))}
                  placeholder="0.00"
                  className="font-semibold"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="metodoPago">Método de Pago</Label>
              <Select
                value={pagoForm.metodoPago}
                onValueChange={(value) => setPagoForm(prev => ({ ...prev, metodoPago: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                  <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={pagoForm.observaciones}
                onChange={(e) => setPagoForm(prev => ({ ...prev, observaciones: e.target.value }))}
                placeholder="Observaciones adicionales..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowPagoModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSavePago}>
                Registrar Pago
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Comisiones */}
      <Dialog open={showComisionModal} onOpenChange={setShowComisionModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cálculo de Comisiones y Avances</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-4 items-center">
              <div>
                <Label htmlFor="mesComision">Mes</Label>
                <Input
                  id="mesComision"
                  type="month"
                  value={mesComision}
                  onChange={(e) => setMesComision(e.target.value)}
                />
              </div>
              <Button 
                onClick={() => cargarComisiones(selectedUser, mesComision)}
                className="mt-6"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Calcular
              </Button>
            </div>

            {comisionData && (
              <div className="space-y-6">
                {/* Resumen */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Salario Base</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-600">
                        ${comisionData.sueldo.salarioBase.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Comisiones</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-blue-600">
                        ${comisionData.sueldo.comisiones.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {comisionData.cobros.cantidadCobros} cobros
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Sueldo</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        ${comisionData.sueldo.total.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Avance Disponible</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-yellow-600">
                        ${comisionData.avances.disponible.toLocaleString()}
                      </p>
                      {!comisionData.avances.puedeAvanzar && (
                        <div className="flex items-center text-orange-500 text-sm mt-1">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          Monto mínimo: ${comisionData.configuracion.montoMinimoAvance}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Detalle de cobros */}
                {comisionData.detalleCobros.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Detalle de Cobros</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Monto Cobrado</TableHead>
                            <TableHead>Comisión</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {comisionData.detalleCobros.map((cobro: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{new Date(cobro.fecha).toLocaleDateString()}</TableCell>
                              <TableCell>{cobro.cliente}</TableCell>
                              <TableCell>${cobro.monto.toLocaleString()}</TableCell>
                              <TableCell className="text-blue-600 font-medium">
                                ${cobro.comision.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
