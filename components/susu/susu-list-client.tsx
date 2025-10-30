
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CrearSusuModal from './crear-susu-modal'
import { Plus, Users, Calendar, DollarSign, Clock, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Susu {
  id: string
  nombre: string
  descripcion: string | null
  montoTotal: number
  frecuencia: string
  fechaInicio: string
  fechaFin: string | null
  estado: string
  creador: {
    id: string
    name: string | null
    firstName: string | null
    lastName: string | null
  }
  participantes: any[]
  pagos: any[]
}

export default function SusuListClient() {
  const { data: session } = useSession() || {}
  const router = useRouter()
  const [susus, setSusus] = useState<Susu[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')

  useEffect(() => {
    cargarSusus()
  }, [])

  const cargarSusus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/susu')
      if (response.ok) {
        const data = await response.json()
        setSusus(data)
      }
    } catch (error) {
      console.error('Error al cargar SUSUs:', error)
    } finally {
      setLoading(false)
    }
  }

  const puedeCrearSusu = () => {
    return session?.user?.role === 'ADMINISTRADOR' || session?.user?.role === 'SUPERVISOR'
  }

  const getEstadoBadge = (estado: string) => {
    const configs = {
      ACTIVO: { variant: 'default' as const, label: 'Activo', icon: Clock },
      COMPLETADO: { variant: 'default' as const, label: 'Completado', icon: CheckCircle2 },
      CANCELADO: { variant: 'destructive' as const, label: 'Cancelado', icon: XCircle }
    }

    const config = configs[estado as keyof typeof configs] || configs.ACTIVO
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getFrecuenciaLabel = (frecuencia: string) => {
    const labels = {
      SEMANAL: 'Semanal',
      QUINCENAL: 'Quincenal',
      MENSUAL: 'Mensual'
    }
    return labels[frecuencia as keyof typeof labels] || frecuencia
  }

  const getNombreCreador = (creador: any) => {
    if (creador.name) return creador.name
    if (creador.firstName && creador.lastName) {
      return `${creador.firstName} ${creador.lastName}`
    }
    return 'Desconocido'
  }

  const calcularProgreso = (susu: Susu) => {
    const totalParticipantes = susu.participantes.length
    if (totalParticipantes === 0) return 0

    // Contar cuántos participantes ya recibieron
    const participantesRecibieron = susu.participantes.filter(p => p.yaRecibio).length
    return Math.round((participantesRecibieron / totalParticipantes) * 100)
  }

  const filtrarSusus = (susus: Susu[]) => {
    if (filtroEstado === 'todos') return susus
    return susus.filter(s => s.estado === filtroEstado)
  }

  const sususFiltrados = filtrarSusus(susus)
  const sususActivos = susus.filter(s => s.estado === 'ACTIVO')
  const sususCompletados = susus.filter(s => s.estado === 'COMPLETADO')
  const misSusus = susus.filter(s => 
    s.participantes.some(p => p.userId === session?.user?.id) ||
    s.creador.id === session?.user?.id
  )

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando SUSUs...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
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
            <h1 className="text-3xl font-bold">SUSU - Sistema de Ahorro Rotativo</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona tus grupos de ahorro colaborativo
            </p>
          </div>
        </div>
        {puedeCrearSusu() && (
          <Button onClick={() => setModalOpen(true)} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Crear SUSU
          </Button>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total SUSUs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{susus.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{sususActivos.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{sususCompletados.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mis Participaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{misSusus.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de filtros */}
      <Tabs defaultValue="todos" className="w-full" onValueChange={setFiltroEstado}>
        <TabsList>
          <TabsTrigger value="todos">Todos ({susus.length})</TabsTrigger>
          <TabsTrigger value="ACTIVO">Activos ({sususActivos.length})</TabsTrigger>
          <TabsTrigger value="COMPLETADO">Completados ({sususCompletados.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="space-y-4">
          {sususFiltrados.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay SUSUs aún</h3>
                  <p className="text-muted-foreground mb-4">
                    {puedeCrearSusu() 
                      ? 'Crea tu primer SUSU para empezar'
                      : 'Espera a que un administrador cree un SUSU'}
                  </p>
                  {puedeCrearSusu() && (
                    <Button onClick={() => setModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Primer SUSU
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sususFiltrados.map(susu => (
                <Card 
                  key={susu.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => router.push(`/susu/${susu.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{susu.nombre}</CardTitle>
                        <CardDescription className="mt-1">
                          {susu.descripcion || 'Sin descripción'}
                        </CardDescription>
                      </div>
                      {getEstadoBadge(susu.estado)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Monto */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <DollarSign className="h-4 w-4 mr-1" />
                        Monto Total
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        S/ {typeof susu.montoTotal === 'number' 
                          ? susu.montoTotal.toFixed(2) 
                          : Number(susu.montoTotal).toFixed(2)}
                      </div>
                    </div>

                    {/* Participantes */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="h-4 w-4 mr-1" />
                        Participantes
                      </div>
                      <div className="font-semibold">
                        {susu.participantes.length}
                      </div>
                    </div>

                    {/* Frecuencia */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        Frecuencia
                      </div>
                      <div className="font-semibold">
                        {getFrecuenciaLabel(susu.frecuencia)}
                      </div>
                    </div>

                    {/* Progreso */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progreso</span>
                        <span className="font-semibold">{calcularProgreso(susu)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${calcularProgreso(susu)}%` }}
                        />
                      </div>
                    </div>

                    {/* Creador y fecha */}
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      <div>Creado por {getNombreCreador(susu.creador)}</div>
                      <div>
                        Inicio: {format(new Date(susu.fechaInicio), 'dd MMM yyyy', { locale: es })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ACTIVO">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sususFiltrados.map(susu => (
              <Card 
                key={susu.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/susu/${susu.id}`)}
              >
                {/* Same content as above */}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="COMPLETADO">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sususFiltrados.map(susu => (
              <Card 
                key={susu.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/susu/${susu.id}`)}
              >
                {/* Same content as above */}
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Crear SUSU */}
      <CrearSusuModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  )
}
