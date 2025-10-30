

"use client"

import { useState, useEffect } from "react"
import { usePermissions } from "@/hooks/use-permissions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Shield,
  Clock,
  Users,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Crown,
  User,
  Settings
} from "lucide-react"
import FormularioUsuario from "@/components/formulario-usuario"
import PermisosUsuario from "@/components/permisos-usuario"

interface Usuario {
  id: string
  email: string
  firstName?: string
  lastName?: string
  name?: string
  role: 'ADMINISTRADOR' | 'SUPERVISOR' | 'COBRADOR'
  isActive: boolean
  timeLimit?: number
  lastLogin?: string
  createdAt: string
  supervisor?: {
    id: string
    name: string
    email: string
  }
  supervisados?: Array<{
    id: string
    name: string
    email: string
  }>
  permissions: string[]
  stats?: {
    prestamos: number
    pagos: number
    gastos: number
  }
}

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const { isAdmin, isAuthenticated } = usePermissions()
  const { toast } = useToast()

  // Redirigir si no es administrador
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="text-center p-8 bg-red-50 rounded-lg">
        <Shield className="mx-auto h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-red-800">Acceso Denegado</h3>
        <p className="text-red-600">Solo los administradores pueden acceder a este panel</p>
      </div>
    )
  }

  const fetchUsuarios = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/usuarios')
      if (response.ok) {
        const data = await response.json()
        setUsuarios(data)
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Error al cargar usuarios",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: "Error",
        description: "Error de conexión al cargar usuarios",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsuarios()
  }, [])

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const usuario = usuarios.find(u => u.id === userId)
      if (!usuario) return

      const response = await fetch(`/api/admin/usuarios/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...usuario,
          isActive: !isActive
        })
      })

      if (response.ok) {
        toast({
          title: isActive ? "Usuario desactivado" : "Usuario activado",
          description: `${usuario.name || usuario.email} ${isActive ? 'desactivado' : 'activado'} exitosamente`,
        })
        fetchUsuarios()
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al cambiar estado del usuario",
        variant: "destructive"
      })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/usuarios/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Usuario eliminado",
          description: "El usuario ha sido eliminado exitosamente",
        })
        fetchUsuarios()
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar usuario",
        variant: "destructive"
      })
    }
  }

  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch = !searchTerm || 
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${usuario.firstName} ${usuario.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = selectedRole === "all" || usuario.role === selectedRole
    const matchesStatus = selectedStatus === "all" || 
      (selectedStatus === "active" && usuario.isActive) ||
      (selectedStatus === "inactive" && !usuario.isActive)

    return matchesSearch && matchesRole && matchesStatus
  })

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usuarios.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usuarios.filter(u => u.role === 'ADMINISTRADOR').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Supervisores</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usuarios.filter(u => u.role === 'SUPERVISOR').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cobradores</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usuarios.filter(u => u.role === 'COBRADOR').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Todos los roles</option>
                <option value="ADMINISTRADOR">Administradores</option>
                <option value="SUPERVISOR">Supervisores</option>
                <option value="COBRADOR">Cobradores</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>

            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[95vh] p-0 overflow-hidden">
                <div className="p-6 overflow-y-auto max-h-[95vh]">
                  <DialogHeader className="mb-4">
                    <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                  </DialogHeader>
                  <FormularioUsuario
                    onSuccess={() => {
                      setShowCreateModal(false)
                      fetchUsuarios()
                    }}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Lista de usuarios */}
      <div className="grid gap-4">
        {filteredUsuarios.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron usuarios</h3>
              <p className="text-gray-600">
                {searchTerm ? "Intenta con otros términos de búsqueda" : "Crea tu primer usuario para comenzar"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredUsuarios.map(usuario => (
            <Card key={usuario.id} className={`transition-all duration-200 ${
              !usuario.isActive ? 'opacity-60 bg-gray-50' : 'hover:shadow-md'
            }`}>
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      usuario.isActive ? 'bg-primary text-white' : 'bg-gray-300 text-gray-600'
                    }`}>
                      {getRoleIcon(usuario.role)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">
                          {usuario.name || `${usuario.firstName} ${usuario.lastName}`}
                        </h3>
                        {getRoleBadge(usuario.role)}
                        {!usuario.isActive && (
                          <Badge variant="outline" className="text-red-600 border-red-600">
                            Inactivo
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-gray-600 mb-2">{usuario.email}</p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        {usuario.supervisor && (
                          <span className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            Supervisor: {usuario.supervisor.name}
                          </span>
                        )}
                        
                        {usuario.timeLimit && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {Math.floor(usuario.timeLimit / 60)}h {usuario.timeLimit % 60}m/día
                          </span>
                        )}
                        
                        {usuario.supervisados && usuario.supervisados.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {usuario.supervisados.length} supervisado{usuario.supervisados.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        
                        <span className="flex items-center gap-1">
                          <Settings className="h-3 w-3" />
                          {usuario.permissions.length} permiso{usuario.permissions.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      {usuario.stats && (
                        <div className="flex gap-4 text-xs text-gray-400 mt-2">
                          <span>{usuario.stats.prestamos} préstamos</span>
                          <span>{usuario.stats.pagos} pagos</span>
                          <span>{usuario.stats.gastos} gastos</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleUserStatus(usuario.id, usuario.isActive)}
                    >
                      {usuario.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {usuario.isActive ? 'Desactivar' : 'Activar'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(usuario)
                        setShowPermissionsModal(true)
                      }}
                    >
                      <Shield className="h-4 w-4 mr-1" />
                      Permisos
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(usuario)
                        setShowEditModal(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(usuario.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de edición */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-4xl max-h-[95vh] p-0 overflow-hidden">
          <div className="p-6 overflow-y-auto max-h-[95vh]">
            <DialogHeader className="mb-4">
              <DialogTitle>Editar Usuario</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <FormularioUsuario
                usuario={selectedUser}
                onSuccess={() => {
                  setShowEditModal(false)
                  setSelectedUser(null)
                  fetchUsuarios()
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de permisos */}
      <Dialog open={showPermissionsModal} onOpenChange={setShowPermissionsModal}>
        <DialogContent className="max-w-4xl max-h-[95vh] p-0 overflow-hidden">
          <div className="p-6 overflow-y-auto max-h-[95vh]">
            <DialogHeader className="mb-4">
              <DialogTitle>Gestionar Permisos</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <PermisosUsuario
                usuario={selectedUser}
                onSuccess={() => {
                  setShowPermissionsModal(false)
                  setSelectedUser(null)
                  fetchUsuarios()
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

