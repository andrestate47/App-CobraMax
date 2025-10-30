

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Eye, EyeOff, Info, Upload, X, FileText } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
// MapLocationPicker eliminado - ahora se usa un simple link de Google Maps

interface Usuario {
  id: string
  email: string
  firstName?: string
  lastName?: string
  name?: string
  role: 'ADMINISTRADOR' | 'SUPERVISOR' | 'COBRADOR'
  isActive: boolean
  timeLimit?: number
  phone?: string
  phoneReferencial?: string
  address?: string
  pais?: string
  ciudad?: string
  ubicacion?: string
  mapLink?: string
  referenciaFamiliar?: string
  referenciaTrabajo?: string
  documentoIdentificacion?: string
  supervisor?: {
    id: string
    name: string
    email: string
  }
  permissions: string[]
}

interface Supervisor {
  id: string
  name: string
  email: string
  role: string
  supervisados: number
}

interface FormularioUsuarioProps {
  usuario?: Usuario
  onSuccess: () => void
}

const PERMISOS_BASICOS = [
  { key: 'VER_DASHBOARD', label: 'Ver Dashboard', description: 'Acceder al panel principal' },
  { key: 'VER_LISTADO_GENERAL', label: 'Ver Listado General', description: 'Ver lista de clientes' },
  { key: 'VER_DETALLES_PRESTAMO', label: 'Ver Detalles de Préstamos', description: 'Ver información detallada' },
  { key: 'REGISTRAR_COBROS', label: 'Registrar Cobros', description: 'Registrar pagos de clientes' },
  { key: 'MAPA_CLIENTES', label: 'Mapa de Clientes', description: 'Ver ubicaciones en mapa' },
  { key: 'REGISTRAR_GASTOS', label: 'Registrar Gastos', description: 'Registrar gastos operativos' }
]

const PERMISOS_GESTION = [
  { key: 'CREAR_CLIENTES', label: 'Crear Clientes', description: 'Crear nuevos clientes' },
  { key: 'EDITAR_CLIENTES', label: 'Editar Clientes', description: 'Modificar información de clientes' },
  { key: 'CREAR_PRESTAMOS', label: 'Crear Préstamos', description: 'Crear nuevos préstamos' },
  { key: 'EDITAR_PRESTAMOS', label: 'Editar Préstamos', description: 'Modificar préstamos existentes' },
  { key: 'ELIMINAR_PRESTAMOS', label: 'Eliminar Préstamos', description: 'Eliminar préstamos del sistema' },
  { key: 'REGISTRAR_TRANSFERENCIAS', label: 'Registrar Transferencias', description: 'Registrar transferencias bancarias' }
]

const PERMISOS_AVANZADOS = [
  { key: 'VER_REPORTES', label: 'Ver Reportes', description: 'Acceder a reportes y estadísticas' },
  { key: 'VER_AUDITORIA', label: 'Ver Auditoría', description: 'Ver logs de actividad' },
  { key: 'REALIZAR_CIERRE_DIA', label: 'Cierre de Día', description: 'Realizar cierre diario' },
  { key: 'VER_CIERRES_HISTORICOS', label: 'Ver Histórico de Cierres', description: 'Ver cierres anteriores' },
  { key: 'SINCRONIZAR_DATOS', label: 'Sincronizar Datos', description: 'Sincronización de información' }
]

const PERMISOS_ADMIN = [
  { key: 'GESTIONAR_USUARIOS', label: 'Gestionar Usuarios', description: 'Crear y editar usuarios' },
  { key: 'GESTIONAR_PERMISOS', label: 'Gestionar Permisos', description: 'Asignar permisos a usuarios' },
  { key: 'CONFIGURAR_SISTEMA', label: 'Configurar Sistema', description: 'Configuraciones globales' }
]

export default function FormularioUsuario({ usuario, onSuccess }: FormularioUsuarioProps) {
  const [formData, setFormData] = useState({
    email: usuario?.email || '',
    password: '',
    confirmPassword: '',
    firstName: usuario?.firstName || '',
    lastName: usuario?.lastName || '',
    role: usuario?.role || 'COBRADOR',
    isActive: usuario?.isActive ?? true,
    timeLimit: usuario?.timeLimit?.toString() || '',
    supervisorId: usuario?.supervisor?.id || '',
    phone: usuario?.phone || '',
    phoneReferencial: usuario?.phoneReferencial || '',
    address: usuario?.address || '',
    pais: usuario?.pais || '',
    ciudad: usuario?.ciudad || '',
    ubicacion: usuario?.ubicacion || '',
    mapLink: usuario?.mapLink || '',
    referenciaFamiliar: usuario?.referenciaFamiliar || '',
    referenciaTrabajo: usuario?.referenciaTrabajo || '',
    permissions: usuario?.permissions || []
  })

  const [supervisores, setSupervisores] = useState<Supervisor[]>([])
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [documentoFile, setDocumentoFile] = useState<File | null>(null)
  const [documentoPreview, setDocumentoPreview] = useState<string | null>(
    usuario?.documentoIdentificacion || null
  )
  const { toast } = useToast()

  const isEditing = !!usuario

  useEffect(() => {
    fetchSupervisores()
  }, [])

  const fetchSupervisores = async () => {
    try {
      const response = await fetch('/api/admin/supervisores')
      if (response.ok) {
        const data = await response.json()
        setSupervisores(data)
      }
    } catch (error) {
      console.error('Error fetching supervisors:', error)
    }
  }

  const handleDocumentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Error",
          description: "Solo se permiten archivos de imagen (JPG, PNG, WEBP) o PDF",
          variant: "destructive"
        })
        return
      }

      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "El archivo debe ser menor a 5MB",
          variant: "destructive"
        })
        return
      }

      setDocumentoFile(file)
      
      // Crear preview si es imagen
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setDocumentoPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setDocumentoPreview('pdf')
      }
    }
  }

  const removeDocumento = () => {
    setDocumentoFile(null)
    setDocumentoPreview(usuario?.documentoIdentificacion || null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validaciones
    if (!formData.email.trim()) {
      toast({
        title: "Error",
        description: "El email es obligatorio",
        variant: "destructive"
      })
      return
    }

    if (!isEditing && !formData.password) {
      toast({
        title: "Error",
        description: "La contraseña es obligatoria",
        variant: "destructive"
      })
      return
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive"
      })
      return
    }

    if (formData.password && formData.password.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      const url = isEditing ? `/api/admin/usuarios/${usuario.id}` : '/api/admin/usuarios'
      const method = isEditing ? 'PUT' : 'POST'

      // Si hay archivo, usar FormData
      if (documentoFile) {
        const formDataToSend = new FormData()
        formDataToSend.append('email', formData.email.trim())
        formDataToSend.append('firstName', formData.firstName.trim())
        formDataToSend.append('lastName', formData.lastName.trim())
        formDataToSend.append('name', `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim())
        formDataToSend.append('role', formData.role)
        formDataToSend.append('isActive', formData.isActive.toString())
        formDataToSend.append('timeLimit', formData.timeLimit || '')
        formDataToSend.append('supervisorId', formData.supervisorId || '')
        formDataToSend.append('phone', formData.phone || '')
        formDataToSend.append('phoneReferencial', formData.phoneReferencial || '')
        formDataToSend.append('address', formData.address || '')
        formDataToSend.append('pais', formData.pais || '')
        formDataToSend.append('ciudad', formData.ciudad || '')
        formDataToSend.append('ubicacion', formData.ubicacion || '')
        formDataToSend.append('mapLink', formData.mapLink || '')
        formDataToSend.append('referenciaFamiliar', formData.referenciaFamiliar || '')
        formDataToSend.append('referenciaTrabajo', formData.referenciaTrabajo || '')
        formDataToSend.append('permissions', JSON.stringify(formData.permissions))
        if (formData.password) {
          formDataToSend.append('password', formData.password)
        }
        formDataToSend.append('documentoFile', documentoFile)

        const response = await fetch(url, {
          method,
          body: formDataToSend
        })

        if (response.ok) {
          toast({
            title: isEditing ? "Usuario actualizado" : "Usuario creado",
            description: `El usuario ${formData.email} ha sido ${isEditing ? 'actualizado' : 'creado'} exitosamente`,
          })
          onSuccess()
        } else {
          const error = await response.json()
          throw new Error(error.error)
        }
      } else {
        // Sin archivo, usar JSON
        const payload = {
          email: formData.email.trim(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          name: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
          role: formData.role,
          isActive: formData.isActive,
          timeLimit: formData.timeLimit ? parseInt(formData.timeLimit) : null,
          supervisorId: formData.supervisorId || null,
          phone: formData.phone || null,
          phoneReferencial: formData.phoneReferencial || null,
          address: formData.address || null,
          pais: formData.pais || null,
          ciudad: formData.ciudad || null,
          ubicacion: formData.ubicacion || null,
          mapLink: formData.mapLink || null,
          referenciaFamiliar: formData.referenciaFamiliar || null,
          referenciaTrabajo: formData.referenciaTrabajo || null,
          permissions: formData.permissions,
          ...(formData.password && { password: formData.password })
        }

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        })

        if (response.ok) {
          toast({
            title: isEditing ? "Usuario actualizado" : "Usuario creado",
            description: `El usuario ${formData.email} ha sido ${isEditing ? 'actualizado' : 'creado'} exitosamente`,
          })
          onSuccess()
        } else {
          const error = await response.json()
          throw new Error(error.error)
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al procesar la solicitud",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permission]
        : prev.permissions.filter(p => p !== permission)
    }))
  }

  const getPermisosRecomendados = (role: string) => {
    switch (role) {
      case 'COBRADOR':
        return PERMISOS_BASICOS.map(p => p.key)
      case 'SUPERVISOR':
        return [...PERMISOS_BASICOS.map(p => p.key), ...PERMISOS_GESTION.map(p => p.key), ...PERMISOS_AVANZADOS.map(p => p.key)]
      case 'ADMINISTRADOR':
        return [] // Los administradores tienen acceso total por defecto
      default:
        return []
    }
  }

  const aplicarPermisosRecomendados = () => {
    const permisos = getPermisosRecomendados(formData.role)
    setFormData(prev => ({
      ...prev,
      permissions: permisos
    }))
  }

  const renderPermissionGroup = (title: string, permissions: typeof PERMISOS_BASICOS) => (
    <div key={title} className="space-y-3">
      <h4 className="font-semibold text-gray-900">{title}</h4>
      <div className="grid grid-cols-1 gap-3">
        {permissions.map(permission => (
          <div key={permission.key} className="flex items-start space-x-3">
            <Checkbox
              id={permission.key}
              checked={formData.permissions.includes(permission.key)}
              onCheckedChange={(checked) => handlePermissionChange(permission.key, checked as boolean)}
              disabled={formData.role === 'ADMINISTRADOR'}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor={permission.key}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {permission.label}
              </label>
              <p className="text-xs text-muted-foreground">
                {permission.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información básica */}
      <Card>
        <CardHeader>
          <CardTitle>Información Básica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombre</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Nombre"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Apellido"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="correo@ejemplo.com"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pais">País</Label>
              <Input
                id="pais"
                value={formData.pais}
                onChange={(e) => setFormData(prev => ({ ...prev, pais: e.target.value }))}
                placeholder="Ej: Bolivia"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ciudad">Ciudad</Label>
              <Input
                id="ciudad"
                value={formData.ciudad}
                onChange={(e) => setFormData(prev => ({ ...prev, ciudad: e.target.value }))}
                placeholder="Ej: La Paz"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ubicacion">Ubicación</Label>
              <Input
                id="ubicacion"
                value={formData.ubicacion}
                onChange={(e) => setFormData(prev => ({ ...prev, ubicacion: e.target.value }))}
                placeholder="Ej: Zona Sur"
              />
            </div>
          </div>

          {/* Link de Google Maps */}
          <div className="space-y-2">
            <Label htmlFor="mapLink">Link de Google Maps (opcional)</Label>
            <Input
              id="mapLink"
              value={formData.mapLink}
              onChange={(e) => setFormData(prev => ({ ...prev, mapLink: e.target.value }))}
              placeholder="https://maps.app.goo.gl/..."
            />
            <p className="text-xs text-muted-foreground">
              Comparte una ubicación desde Google Maps en tu teléfono y pega el link aquí
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1234567890"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneReferencial">Teléfono Referencial</Label>
              <Input
                id="phoneReferencial"
                type="tel"
                value={formData.phoneReferencial}
                onChange={(e) => setFormData(prev => ({ ...prev, phoneReferencial: e.target.value }))}
                placeholder="+1234567890"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Dirección completa"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="referenciaFamiliar">Referencia Familiar</Label>
            <Textarea
              id="referenciaFamiliar"
              value={formData.referenciaFamiliar}
              onChange={(e) => setFormData(prev => ({ ...prev, referenciaFamiliar: e.target.value }))}
              placeholder="Nombre y teléfono del familiar de referencia"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="referenciaTrabajo">Referencia de Trabajo</Label>
            <Textarea
              id="referenciaTrabajo"
              value={formData.referenciaTrabajo}
              onChange={(e) => setFormData(prev => ({ ...prev, referenciaTrabajo: e.target.value }))}
              placeholder="Lugar de trabajo y contacto"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentoIdentificacion">Documento de Identificación</Label>
            <div className="space-y-2">
              {/* Área de subida de archivo */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary transition-colors">
                <input
                  id="documentoIdentificacion"
                  type="file"
                  onChange={handleDocumentoChange}
                  accept="image/*,application/pdf"
                  className="hidden"
                />
                <label
                  htmlFor="documentoIdentificacion"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    Click para subir documento de identificación
                  </span>
                  <span className="text-xs text-gray-400 mt-1">
                    Formatos: JPG, PNG, PDF (Máx. 5MB)
                  </span>
                </label>
              </div>

              {/* Preview del archivo */}
              {documentoPreview && (
                <div className="relative border rounded-lg p-3 bg-gray-50">
                  <button
                    type="button"
                    onClick={removeDocumento}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  
                  {documentoPreview === 'pdf' ? (
                    <div className="flex items-center space-x-2">
                      <FileText className="h-8 w-8 text-red-500" />
                      <div>
                        <p className="text-sm font-medium">Documento PDF</p>
                        <p className="text-xs text-gray-500">
                          {documentoFile?.name || 'Documento guardado'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full aspect-video rounded overflow-hidden">
                      <img
                        src={documentoPreview}
                        alt="Preview del documento"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">
                {isEditing ? "Nueva Contraseña (opcional)" : "Contraseña"}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  required={!isEditing}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="••••••••"
                  required={!isEditing && !!formData.password}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuración de rol y permisos */}
      <Card>
        <CardHeader>
          <CardTitle>Rol y Configuración</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rol del Usuario</Label>
              <Select
                value={formData.role}
                onValueChange={(value: any) => {
                  setFormData(prev => ({ ...prev, role: value }))
                  // Limpiar supervisor si no es cobrador
                  if (value !== 'COBRADOR') {
                    setFormData(prev => ({ ...prev, supervisorId: '' }))
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COBRADOR">Cobrador</SelectItem>
                  <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                  <SelectItem value="ADMINISTRADOR">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.role === 'COBRADOR' && (
              <div className="space-y-2">
                <Label>Supervisor Asignado</Label>
                <Select
                  value={formData.supervisorId || "no-supervisor"}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    supervisorId: value === "no-supervisor" ? "" : value 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar supervisor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-supervisor">Sin supervisor</SelectItem>
                    {supervisores.map(supervisor => (
                      <SelectItem key={supervisor.id} value={supervisor.id}>
                        {supervisor.name} ({supervisor.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeLimit">Límite de Tiempo (minutos/día)</Label>
              <Input
                id="timeLimit"
                type="number"
                min="0"
                max="1440"
                value={formData.timeLimit}
                onChange={(e) => setFormData(prev => ({ ...prev, timeLimit: e.target.value }))}
                placeholder="480 (8 horas)"
              />
              <p className="text-xs text-gray-500">
                Dejar vacío para sin límite. Máximo 1440 minutos (24 horas).
              </p>
            </div>

            <div className="space-y-2">
              <Label>Estado del Usuario</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked as boolean }))}
                />
                <label htmlFor="isActive" className="text-sm">
                  Usuario activo
                </label>
              </div>
              <p className="text-xs text-gray-500">
                Los usuarios inactivos no pueden iniciar sesión.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permisos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Permisos del Usuario</CardTitle>
          {formData.role !== 'ADMINISTRADOR' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={aplicarPermisosRecomendados}
            >
              Aplicar Permisos Recomendados
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {formData.role === 'ADMINISTRADOR' ? (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="text-blue-800 font-medium">
                  Los administradores tienen acceso total al sistema
                </span>
              </div>
              <p className="text-blue-600 text-sm mt-1">
                No necesitan permisos específicos ya que pueden acceder a todas las funcionalidades.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {renderPermissionGroup("Permisos Básicos", PERMISOS_BASICOS)}
              {renderPermissionGroup("Gestión de Datos", PERMISOS_GESTION)}
              {renderPermissionGroup("Permisos Avanzados", PERMISOS_AVANZADOS)}
              {renderPermissionGroup("Permisos Administrativos", PERMISOS_ADMIN)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botones */}
      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? 'Actualizando...' : 'Creando...'}
            </>
          ) : (
            <>
              {isEditing ? 'Actualizar Usuario' : 'Crear Usuario'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

