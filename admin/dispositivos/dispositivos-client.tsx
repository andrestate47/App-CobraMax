
"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Smartphone, 
  Check, 
  X, 
  Ban, 
  Trash2, 
  Clock,
  Shield,
  AlertCircle,
  RefreshCw,
  Monitor,
  ArrowLeft
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Dispositivo {
  id: string
  deviceId: string
  deviceName: string
  userAgent: string
  ipAddress: string
  estado: 'PENDIENTE' | 'AUTORIZADO' | 'RECHAZADO' | 'BLOQUEADO'
  ultimoAcceso: string
  createdAt: string
  usuario: {
    id: string
    email: string
    name: string | null
    firstName: string | null
    lastName: string | null
    role: string
  }
}

export default function DispositivosClient() {
  const router = useRouter()
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([])
  const [loading, setLoading] = useState(true)
  const [accionando, setAccionando] = useState<string | null>(null)
  const [dispositivoSeleccionado, setDispositivoSeleccionado] = useState<Dispositivo | null>(null)
  const [accionDialogo, setAccionDialogo] = useState<'AUTORIZAR' | 'RECHAZAR' | 'BLOQUEAR' | 'ELIMINAR' | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS')
  const { toast } = useToast()

  const cargarDispositivos = async (estado?: string) => {
    try {
      setLoading(true)
      const url = estado && estado !== 'TODOS' 
        ? `/api/dispositivos?estado=${estado}` 
        : '/api/dispositivos'
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setDispositivos(data)
      }
    } catch (error) {
      console.error('Error al cargar dispositivos:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los dispositivos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDispositivos(filtroEstado)
  }, [filtroEstado])

  const gestionarDispositivo = async (dispositivoId: string, accion: 'AUTORIZAR' | 'RECHAZAR' | 'BLOQUEAR') => {
    try {
      setAccionando(dispositivoId)
      const response = await fetch('/api/dispositivos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dispositivoId, accion })
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Éxito",
          description: data.message
        })
        cargarDispositivos(filtroEstado)
      } else {
        throw new Error('Error al gestionar dispositivo')
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "No se pudo gestionar el dispositivo",
        variant: "destructive"
      })
    } finally {
      setAccionando(null)
      setDispositivoSeleccionado(null)
      setAccionDialogo(null)
    }
  }

  const eliminarDispositivo = async (dispositivoId: string) => {
    try {
      setAccionando(dispositivoId)
      const response = await fetch(`/api/dispositivos?id=${dispositivoId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Dispositivo eliminado exitosamente"
        })
        cargarDispositivos(filtroEstado)
      } else {
        throw new Error('Error al eliminar dispositivo')
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el dispositivo",
        variant: "destructive"
      })
    } finally {
      setAccionando(null)
      setDispositivoSeleccionado(null)
      setAccionDialogo(null)
    }
  }

  const confirmarAccion = (dispositivo: Dispositivo, accion: 'AUTORIZAR' | 'RECHAZAR' | 'BLOQUEAR' | 'ELIMINAR') => {
    setDispositivoSeleccionado(dispositivo)
    setAccionDialogo(accion)
  }

  const ejecutarAccion = () => {
    if (!dispositivoSeleccionado || !accionDialogo) return

    if (accionDialogo === 'ELIMINAR') {
      eliminarDispositivo(dispositivoSeleccionado.id)
    } else {
      gestionarDispositivo(dispositivoSeleccionado.id, accionDialogo)
    }
  }

  const getEstadoBadge = (estado: string) => {
    const estilos = {
      PENDIENTE: { variant: 'outline' as const, icon: Clock, className: 'border-yellow-500 text-yellow-700 bg-yellow-50' },
      AUTORIZADO: { variant: 'outline' as const, icon: Check, className: 'border-green-500 text-green-700 bg-green-50' },
      RECHAZADO: { variant: 'outline' as const, icon: X, className: 'border-red-500 text-red-700 bg-red-50' },
      BLOQUEADO: { variant: 'outline' as const, icon: Ban, className: 'border-gray-500 text-gray-700 bg-gray-50' }
    }

    const config = estilos[estado as keyof typeof estilos]
    const Icon = config?.icon || AlertCircle

    return (
      <Badge variant={config?.variant || 'outline'} className={config?.className || ''}>
        <Icon className="h-3 w-3 mr-1" />
        {estado}
      </Badge>
    )
  }

  const getRoleBadge = (role: string) => {
    const estilos = {
      ADMINISTRADOR: 'bg-purple-100 text-purple-700',
      SUPERVISOR: 'bg-blue-100 text-blue-700',
      COBRADOR: 'bg-gray-100 text-gray-700'
    }

    return (
      <Badge variant="outline" className={estilos[role as keyof typeof estilos] || ''}>
        {role}
      </Badge>
    )
  }

  const dispositivosFiltrados = dispositivos

  const contadores = {
    todos: dispositivos.length,
    pendientes: dispositivos.filter(d => d.estado === 'PENDIENTE').length,
    autorizados: dispositivos.filter(d => d.estado === 'AUTORIZADO').length,
    bloqueados: dispositivos.filter(d => d.estado === 'RECHAZADO' || d.estado === 'BLOQUEADO').length
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Botón Volver */}
      <Button
        onClick={() => router.back()}
        variant="ghost"
        size="sm"
        className="mb-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Gestión de Dispositivos</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            Administra los dispositivos autorizados para acceder al sistema
          </p>
        </div>
        <Button
          onClick={() => cargarDispositivos(filtroEstado)}
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contadores.todos}</div>
            <p className="text-xs text-muted-foreground">Dispositivos registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{contadores.pendientes}</div>
            <p className="text-xs text-muted-foreground">Esperando aprobación</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Autorizados</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{contadores.autorizados}</div>
            <p className="text-xs text-muted-foreground">Con acceso activo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bloqueados</CardTitle>
            <Ban className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{contadores.bloqueados}</div>
            <p className="text-xs text-muted-foreground">Sin autorización</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de filtro */}
      <Tabs value={filtroEstado} onValueChange={setFiltroEstado} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="TODOS" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
            Todos ({contadores.todos})
          </TabsTrigger>
          <TabsTrigger value="PENDIENTE" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
            <span className="hidden sm:inline">Pendientes</span>
            <span className="sm:hidden">Pend.</span> ({contadores.pendientes})
          </TabsTrigger>
          <TabsTrigger value="AUTORIZADO" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
            <span className="hidden sm:inline">Autorizados</span>
            <span className="sm:hidden">Autor.</span> ({contadores.autorizados})
          </TabsTrigger>
          <TabsTrigger value="RECHAZADO" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
            <span className="hidden sm:inline">Bloqueados</span>
            <span className="sm:hidden">Bloq.</span> ({contadores.bloqueados})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Lista de dispositivos */}
      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ) : dispositivosFiltrados.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay dispositivos {filtroEstado !== 'TODOS' ? `en estado ${filtroEstado}` : 'registrados'}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {dispositivosFiltrados.map((dispositivo) => (
            <Card key={dispositivo.id}>
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  {/* Información del dispositivo */}
                  <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                    <div className="p-2 sm:p-3 bg-blue-50 rounded-lg flex-shrink-0">
                      <Smartphone className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    </div>
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <CardTitle className="text-base sm:text-lg truncate">{dispositivo.deviceName}</CardTitle>
                        {getEstadoBadge(dispositivo.estado)}
                      </div>
                      <CardDescription className="text-xs sm:text-sm">
                        <div className="space-y-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="font-medium">Usuario:</span>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="truncate">
                                {dispositivo.usuario.firstName && dispositivo.usuario.lastName
                                  ? `${dispositivo.usuario.firstName} ${dispositivo.usuario.lastName}`
                                  : dispositivo.usuario.name || dispositivo.usuario.email}
                              </span>
                              {getRoleBadge(dispositivo.usuario.role)}
                            </div>
                          </div>
                          <div className="truncate">
                            <span className="font-medium">Email:</span> {dispositivo.usuario.email}
                          </div>
                          <div className="truncate">
                            <span className="font-medium">IP:</span> {dispositivo.ipAddress}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Último acceso: {new Date(dispositivo.ultimoAcceso).toLocaleString('es-CO')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Registrado: {new Date(dispositivo.createdAt).toLocaleString('es-CO')}
                          </div>
                        </div>
                      </CardDescription>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex flex-row sm:flex-col gap-2 flex-wrap sm:flex-nowrap">
                    {dispositivo.estado === 'PENDIENTE' && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => confirmarAccion(dispositivo, 'AUTORIZAR')}
                          disabled={accionando === dispositivo.id}
                          className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none text-xs sm:text-sm"
                        >
                          <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          Autorizar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => confirmarAccion(dispositivo, 'RECHAZAR')}
                          disabled={accionando === dispositivo.id}
                          className="border-red-500 text-red-600 hover:bg-red-50 flex-1 sm:flex-none text-xs sm:text-sm"
                        >
                          <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          Rechazar
                        </Button>
                      </>
                    )}

                    {dispositivo.estado === 'AUTORIZADO' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => confirmarAccion(dispositivo, 'BLOQUEAR')}
                        disabled={accionando === dispositivo.id}
                        className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 flex-1 sm:flex-none text-xs sm:text-sm"
                      >
                        <Ban className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Bloquear
                      </Button>
                    )}

                    {(dispositivo.estado === 'RECHAZADO' || dispositivo.estado === 'BLOQUEADO') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => confirmarAccion(dispositivo, 'AUTORIZAR')}
                        disabled={accionando === dispositivo.id}
                        className="border-green-500 text-green-600 hover:bg-green-50 flex-1 sm:flex-none text-xs sm:text-sm"
                      >
                        <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Autorizar
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => confirmarAccion(dispositivo, 'ELIMINAR')}
                      disabled={accionando === dispositivo.id}
                      className="border-gray-300 text-gray-600 hover:bg-gray-50 flex-1 sm:flex-none text-xs sm:text-sm"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Diálogo de confirmación */}
      <AlertDialog open={!!accionDialogo} onOpenChange={() => {
        setAccionDialogo(null)
        setDispositivoSeleccionado(null)
      }}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">
              {accionDialogo === 'AUTORIZAR' && 'Autorizar Dispositivo'}
              {accionDialogo === 'RECHAZAR' && 'Rechazar Dispositivo'}
              {accionDialogo === 'BLOQUEAR' && 'Bloquear Dispositivo'}
              {accionDialogo === 'ELIMINAR' && 'Eliminar Dispositivo'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              {accionDialogo === 'AUTORIZAR' && (
                <>¿Estás seguro de que quieres autorizar este dispositivo? El usuario podrá acceder al sistema desde este dispositivo.</>
              )}
              {accionDialogo === 'RECHAZAR' && (
                <>¿Estás seguro de que quieres rechazar este dispositivo? El usuario no podrá acceder al sistema desde este dispositivo.</>
              )}
              {accionDialogo === 'BLOQUEAR' && (
                <>¿Estás seguro de que quieres bloquear este dispositivo? El usuario perderá el acceso inmediatamente.</>
              )}
              {accionDialogo === 'ELIMINAR' && (
                <>¿Estás seguro de que quieres eliminar este dispositivo? Esta acción no se puede deshacer.</>
              )}
              
              {dispositivoSeleccionado && (
                <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-gray-50 rounded-lg space-y-1 text-xs sm:text-sm">
                  <div className="break-words"><strong>Dispositivo:</strong> {dispositivoSeleccionado.deviceName}</div>
                  <div className="break-all"><strong>Usuario:</strong> {dispositivoSeleccionado.usuario.email}</div>
                  <div className="break-all"><strong>IP:</strong> {dispositivoSeleccionado.ipAddress}</div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto m-0">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={ejecutarAccion}
              className={`w-full sm:w-auto ${
                accionDialogo === 'AUTORIZAR' ? 'bg-green-600 hover:bg-green-700' :
                accionDialogo === 'ELIMINAR' ? 'bg-gray-600 hover:bg-gray-700' :
                'bg-red-600 hover:bg-red-700'
              }`}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
