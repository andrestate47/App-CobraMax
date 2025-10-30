

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Info, Shield, User, Crown, CheckCircle, XCircle, Settings } from "lucide-react"

interface Usuario {
  id: string
  email: string
  firstName?: string
  lastName?: string
  name?: string
  role: 'ADMINISTRADOR' | 'SUPERVISOR' | 'COBRADOR'
  isActive: boolean
  timeLimit?: number
  permissions: string[]
}

interface PermisosUsuarioProps {
  usuario: Usuario
  onSuccess: () => void
}

// Definición de permisos organizados por categorías
const CATEGORIAS_PERMISOS = [
  {
    nombre: 'Operaciones Básicas',
    descripcion: 'Permisos fundamentales para el uso diario del sistema',
    permisos: [
      { key: 'VER_DASHBOARD', label: 'Ver Dashboard', descripcion: 'Acceder al panel principal del sistema' },
      { key: 'VER_LISTADO_GENERAL', label: 'Ver Listado General', descripcion: 'Ver lista completa de clientes' },
      { key: 'VER_DETALLES_PRESTAMO', label: 'Ver Detalles de Préstamos', descripcion: 'Ver información detallada de préstamos' },
      { key: 'REGISTRAR_COBROS', label: 'Registrar Cobros', descripcion: 'Registrar pagos y cobros de clientes' },
      { key: 'MAPA_CLIENTES', label: 'Mapa de Clientes', descripcion: 'Ver ubicaciones de clientes en el mapa' },
      { key: 'REGISTRAR_GASTOS', label: 'Registrar Gastos', descripcion: 'Registrar gastos operativos diarios' }
    ]
  },
  {
    nombre: 'Gestión de Clientes',
    descripcion: 'Permisos para administrar información de clientes',
    permisos: [
      { key: 'CREAR_CLIENTES', label: 'Crear Clientes', descripcion: 'Crear nuevos registros de clientes' },
      { key: 'EDITAR_CLIENTES', label: 'Editar Clientes', descripcion: 'Modificar información de clientes existentes' }
    ]
  },
  {
    nombre: 'Gestión de Préstamos',
    descripcion: 'Permisos para administrar préstamos y operaciones relacionadas',
    permisos: [
      { key: 'CREAR_PRESTAMOS', label: 'Crear Préstamos', descripcion: 'Crear nuevos préstamos para clientes' },
      { key: 'EDITAR_PRESTAMOS', label: 'Editar Préstamos', descripcion: 'Modificar préstamos existentes' },
      { key: 'ELIMINAR_PRESTAMOS', label: 'Eliminar Préstamos', descripcion: 'Eliminar préstamos del sistema' }
    ]
  },
  {
    nombre: 'Transferencias y Pagos',
    descripcion: 'Permisos para manejar transferencias bancarias',
    permisos: [
      { key: 'REGISTRAR_TRANSFERENCIAS', label: 'Registrar Transferencias', descripcion: 'Registrar transferencias bancarias' },
      { key: 'VER_TRANSFERENCIAS', label: 'Ver Transferencias', descripcion: 'Ver histórico de transferencias' }
    ]
  },
  {
    nombre: 'Reportes y Análisis',
    descripcion: 'Permisos para acceder a reportes y estadísticas',
    permisos: [
      { key: 'VER_REPORTES', label: 'Ver Reportes', descripcion: 'Acceder a reportes y estadísticas del sistema' },
      { key: 'VER_AUDITORIA', label: 'Ver Auditoría', descripcion: 'Ver logs de actividad y auditoría' }
    ]
  },
  {
    nombre: 'Operaciones de Cierre',
    descripcion: 'Permisos para realizar cierres de día y operaciones relacionadas',
    permisos: [
      { key: 'REALIZAR_CIERRE_DIA', label: 'Realizar Cierre de Día', descripcion: 'Ejecutar proceso de cierre diario' },
      { key: 'VER_CIERRES_HISTORICOS', label: 'Ver Histórico de Cierres', descripcion: 'Ver cierres de días anteriores' }
    ]
  },
  {
    nombre: 'Sistema y Configuración',
    descripcion: 'Permisos administrativos y de configuración',
    permisos: [
      { key: 'SINCRONIZAR_DATOS', label: 'Sincronizar Datos', descripcion: 'Sincronizar información del sistema' },
      { key: 'REGISTRAR_INGRESOS', label: 'Registrar Ingresos', descripcion: 'Registrar ingresos en el sistema' }
    ]
  },
  {
    nombre: 'Administración Avanzada',
    descripcion: 'Permisos de alto nivel para administradores',
    permisos: [
      { key: 'GESTIONAR_USUARIOS', label: 'Gestionar Usuarios', descripcion: 'Crear, editar y eliminar usuarios' },
      { key: 'GESTIONAR_PERMISOS', label: 'Gestionar Permisos', descripcion: 'Asignar y modificar permisos de usuarios' },
      { key: 'CONFIGURAR_SISTEMA', label: 'Configurar Sistema', descripcion: 'Acceder a configuraciones globales del sistema' }
    ]
  }
]

// Permisos recomendados por rol
const PERMISOS_POR_ROL = {
  COBRADOR: [
    'VER_DASHBOARD', 'VER_LISTADO_GENERAL', 'VER_DETALLES_PRESTAMO', 
    'REGISTRAR_COBROS', 'MAPA_CLIENTES', 'REGISTRAR_GASTOS', 
    'CREAR_CLIENTES', 'EDITAR_CLIENTES', 'VER_REPORTES'
  ],
  SUPERVISOR: [
    'VER_DASHBOARD', 'VER_LISTADO_GENERAL', 'VER_DETALLES_PRESTAMO', 
    'REGISTRAR_COBROS', 'MAPA_CLIENTES', 'REGISTRAR_GASTOS', 
    'CREAR_CLIENTES', 'EDITAR_CLIENTES', 'CREAR_PRESTAMOS', 
    'EDITAR_PRESTAMOS', 'ELIMINAR_PRESTAMOS', 'REGISTRAR_TRANSFERENCIAS', 
    'VER_TRANSFERENCIAS', 'VER_REPORTES', 'VER_AUDITORIA', 
    'REALIZAR_CIERRE_DIA', 'VER_CIERRES_HISTORICOS', 'SINCRONIZAR_DATOS', 
    'REGISTRAR_INGRESOS'
  ],
  ADMINISTRADOR: [] // Los administradores tienen acceso total por defecto
}

export default function PermisosUsuario({ usuario, onSuccess }: PermisosUsuarioProps) {
  const [permisos, setPermisos] = useState<string[]>(usuario.permissions || [])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handlePermisoChange = (permiso: string, checked: boolean) => {
    setPermisos(prev => 
      checked 
        ? [...prev, permiso]
        : prev.filter(p => p !== permiso)
    )
  }

  const aplicarPermisosRecomendados = () => {
    const permisosRecomendados = PERMISOS_POR_ROL[usuario.role] || []
    setPermisos(permisosRecomendados)
    
    toast({
      title: "Permisos aplicados",
      description: `Se aplicaron ${permisosRecomendados.length} permisos recomendados para el rol ${usuario.role}`,
    })
  }

  const limpiarTodosLosPermisos = () => {
    setPermisos([])
    toast({
      title: "Permisos limpiados",
      description: "Se eliminaron todos los permisos del usuario",
    })
  }

  const handleGuardar = async () => {
    setLoading(true)
    
    try {
      const response = await fetch(`/api/admin/usuarios/${usuario.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...usuario,
          permissions: permisos
        })
      })

      if (response.ok) {
        toast({
          title: "Permisos actualizados",
          description: `Los permisos de ${usuario.name || usuario.email} se actualizaron exitosamente`,
        })
        onSuccess()
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar permisos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMINISTRADOR': return <Crown className="h-4 w-4" />
      case 'SUPERVISOR': return <Shield className="h-4 w-4" />
      case 'COBRADOR': return <User className="h-4 w-4" />
      default: return <User className="h-4 w-4" />
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMINISTRADOR': return <Badge variant="destructive">Administrador</Badge>
      case 'SUPERVISOR': return <Badge variant="secondary">Supervisor</Badge>
      case 'COBRADOR': return <Badge variant="outline">Cobrador</Badge>
      default: return <Badge variant="outline">{role}</Badge>
    }
  }

  const totalPermisosDisponibles = CATEGORIAS_PERMISOS.reduce((acc, cat) => acc + cat.permisos.length, 0)
  const permisosAsignados = permisos.length
  const porcentajePermisos = Math.round((permisosAsignados / totalPermisosDisponibles) * 100)

  return (
    <div className="space-y-6">
      {/* Header del usuario */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                usuario.isActive ? 'bg-primary text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {getRoleIcon(usuario.role)}
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {usuario.name || `${usuario.firstName} ${usuario.lastName}`}
                </h3>
                <p className="text-gray-600">{usuario.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  {getRoleBadge(usuario.role)}
                  {!usuario.isActive && (
                    <Badge variant="outline" className="text-red-600 border-red-600">
                      Inactivo
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {permisosAsignados}/{totalPermisosDisponibles}
              </div>
              <div className="text-sm text-gray-600">
                {porcentajePermisos}% de permisos asignados
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Acciones Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usuario.role === 'ADMINISTRADOR' ? (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-5 w-5 text-blue-600" />
                <span className="text-blue-800 font-medium">
                  Los administradores tienen acceso total al sistema
                </span>
              </div>
              <p className="text-blue-600 text-sm">
                No necesitan permisos específicos ya que pueden acceder a todas las funcionalidades automáticamente.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={aplicarPermisosRecomendados}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Aplicar Permisos Recomendados
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={limpiarTodosLosPermisos}
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <XCircle className="h-4 w-4" />
                Limpiar Todos
              </Button>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Info className="h-4 w-4" />
                <span>
                  Recomendado para {usuario.role}: {PERMISOS_POR_ROL[usuario.role]?.length || 0} permisos
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid de permisos por categorías */}
      {usuario.role !== 'ADMINISTRADOR' && (
        <div className="grid gap-6">
          {CATEGORIAS_PERMISOS.map(categoria => (
            <Card key={categoria.nombre}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{categoria.nombre}</CardTitle>
                    <p className="text-sm text-gray-600">{categoria.descripcion}</p>
                  </div>
                  <Badge variant="outline">
                    {categoria.permisos.filter(p => permisos.includes(p.key)).length}/{categoria.permisos.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {categoria.permisos.map(permiso => (
                    <div key={permiso.key} className="flex items-start space-x-3">
                      <Checkbox
                        id={permiso.key}
                        checked={permisos.includes(permiso.key)}
                        onCheckedChange={(checked) => handlePermisoChange(permiso.key, checked as boolean)}
                      />
                      <div className="grid gap-1.5 leading-none flex-1">
                        <label
                          htmlFor={permiso.key}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {permiso.label}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {permiso.descripcion}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        
        {usuario.role !== 'ADMINISTRADOR' && (
          <Button onClick={handleGuardar} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                Guardar Permisos
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

