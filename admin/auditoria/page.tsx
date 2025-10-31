
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Loader2, Search, FileText, Trash2, Calendar, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

interface Usuario {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  name: string | null
  role: string
}

interface RegistroAuditoria {
  id: string
  usuarioId: string
  accion: string
  entidad: string
  entidadId: string
  detalles: any
  ipAddress: string | null
  userAgent: string | null
  fecha: string
  usuario?: Usuario
}

const entidadesOptions = [
  { value: 'all', label: 'Todas las entidades' },
  { value: 'CLIENTE', label: 'Clientes' },
  { value: 'PRESTAMO', label: 'Préstamos' },
  { value: 'PAGO', label: 'Pagos' },
  { value: 'GASTO', label: 'Gastos' },
  { value: 'TRANSFERENCIA', label: 'Transferencias' },
  { value: 'USUARIO', label: 'Usuarios' },
  { value: 'SUSU', label: 'Susu' },
]

export default function AuditoriaPage() {
  const router = useRouter()
  const [registros, setRegistros] = useState<RegistroAuditoria[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEntidad, setFiltroEntidad] = useState('all')
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')
  const [selectedRegistro, setSelectedRegistro] = useState<RegistroAuditoria | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  })

  const cargarRegistros = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', pagination.limit.toString())

      if (filtroEntidad && filtroEntidad !== 'all') params.append('entidad', filtroEntidad)
      if (filtroDesde) params.append('desde', filtroDesde)
      if (filtroHasta) params.append('hasta', filtroHasta)

      const response = await fetch(`/api/admin/auditoria?${params.toString()}`)
      if (!response.ok) throw new Error('Error al cargar registros')

      const data = await response.json()
      setRegistros(data.registros)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar el historial de auditoría')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarRegistros()
  }, [])

  const handleFiltrar = () => {
    cargarRegistros(1)
  }

  const handleLimpiarFiltros = () => {
    setFiltroEntidad('all')
    setFiltroDesde('')
    setFiltroHasta('')
    cargarRegistros(1)
  }

  const verDetalles = (registro: RegistroAuditoria) => {
    setSelectedRegistro(registro)
    setShowDetails(true)
  }

  const getNombreUsuario = (usuario?: Usuario) => {
    if (!usuario) return 'Usuario desconocido'
    return usuario.name || `${usuario.firstName || ''} ${usuario.lastName || ''}`.trim() || usuario.email
  }

  const getBadgeColor = (entidad: string) => {
    const colors: Record<string, string> = {
      CLIENTE: 'bg-blue-500',
      PRESTAMO: 'bg-green-500',
      PAGO: 'bg-purple-500',
      GASTO: 'bg-red-500',
      TRANSFERENCIA: 'bg-yellow-500',
      USUARIO: 'bg-orange-500',
      SUSU: 'bg-pink-500',
    }
    return colors[entidad] || 'bg-gray-500'
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
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
            <h1 className="text-3xl font-bold">Historial de Auditoría</h1>
            <p className="text-muted-foreground mt-1">
              Registro de eliminaciones realizadas por usuarios no administradores
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Tipo de Entidad</Label>
              <Select value={filtroEntidad} onValueChange={setFiltroEntidad}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  {entidadesOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Desde</Label>
              <Input
                type="date"
                value={filtroDesde}
                onChange={(e) => setFiltroDesde(e.target.value)}
              />
            </div>

            <div>
              <Label>Hasta</Label>
              <Input
                type="date"
                value={filtroHasta}
                onChange={(e) => setFiltroHasta(e.target.value)}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={handleFiltrar} className="flex-1">
                <Search className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
              <Button variant="outline" onClick={handleLimpiarFiltros}>
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de registros */}
      <Card>
        <CardHeader>
          <CardTitle>Registros de Eliminación</CardTitle>
          <CardDescription>
            Total de registros: {pagination.total}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : registros.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trash2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron registros de eliminación</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Fecha</th>
                      <th className="text-left p-2">Usuario</th>
                      <th className="text-left p-2">Entidad</th>
                      <th className="text-left p-2">Detalles</th>
                      <th className="text-left p-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registros.map((registro) => (
                      <tr key={registro.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {format(new Date(registro.fecha), "dd 'de' MMMM, yyyy", { locale: es })}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(registro.fecha), 'HH:mm:ss')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div>
                            <div className="font-medium">{getNombreUsuario(registro.usuario)}</div>
                            <div className="text-sm text-muted-foreground">{registro.usuario?.email}</div>
                            <Badge variant="outline" className="mt-1">
                              {registro.usuario?.role}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge className={getBadgeColor(registro.entidad)}>
                            {registro.entidad}
                          </Badge>
                        </td>
                        <td className="p-2 max-w-xs">
                          <div className="text-sm text-muted-foreground truncate">
                            {registro.detalles && typeof registro.detalles === 'object'
                              ? Object.keys(registro.detalles).slice(0, 3).map(key => `${key}: ${registro.detalles[key]}`).join(', ')
                              : 'Sin detalles'}
                          </div>
                        </td>
                        <td className="p-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => verDetalles(registro)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Ver más
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => cargarRegistros(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    Anterior
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      Página {pagination.page} de {pagination.totalPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => cargarRegistros(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para ver detalles */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Eliminación</DialogTitle>
            <DialogDescription>
              Información completa del registro de auditoría
            </DialogDescription>
          </DialogHeader>

          {selectedRegistro && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha y Hora</Label>
                  <p className="text-sm">
                    {format(new Date(selectedRegistro.fecha), "dd 'de' MMMM, yyyy 'a las' HH:mm:ss", { locale: es })}
                  </p>
                </div>

                <div>
                  <Label>Usuario</Label>
                  <p className="text-sm">{getNombreUsuario(selectedRegistro.usuario)}</p>
                  <p className="text-xs text-muted-foreground">{selectedRegistro.usuario?.email}</p>
                </div>

                <div>
                  <Label>Tipo de Entidad</Label>
                  <p className="text-sm">
                    <Badge className={getBadgeColor(selectedRegistro.entidad)}>
                      {selectedRegistro.entidad}
                    </Badge>
                  </p>
                </div>

                <div>
                  <Label>ID de la Entidad</Label>
                  <p className="text-sm font-mono">{selectedRegistro.entidadId}</p>
                </div>

                {selectedRegistro.ipAddress && (
                  <div>
                    <Label>Dirección IP</Label>
                    <p className="text-sm font-mono">{selectedRegistro.ipAddress}</p>
                  </div>
                )}
              </div>

              {selectedRegistro.userAgent && (
                <div>
                  <Label>User Agent</Label>
                  <p className="text-xs text-muted-foreground break-all">{selectedRegistro.userAgent}</p>
                </div>
              )}

              {selectedRegistro.detalles && (
                <div>
                  <Label>Detalles de lo Eliminado</Label>
                  <div className="bg-muted p-4 rounded-md mt-2">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(selectedRegistro.detalles, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
