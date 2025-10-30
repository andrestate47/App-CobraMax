
"use client"

import { useState, useEffect, useRef } from "react"
import { Session } from "next-auth"
import { useRouter } from "next/navigation"
import { ArrowLeft, User, Lock, Camera, X, Upload, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface PerfilClientProps {
  session: Session
}

interface UserProfile {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  name: string | null
  role: string
  phone: string | null
  profilePhoto: string | null
  timeLimit: number | null
  supervisorId: string | null
  createdAt: string
  lastLogin: string | null
}

export default function PerfilClient({ session }: PerfilClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estados para datos del perfil
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Estados para formulario de información personal
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)

  // Estados para formulario de contraseña
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  // Estados para foto de perfil
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // Cargar datos del perfil
  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
        
        // Pre-llenar formulario
        setFirstName(data.user.firstName || "")
        setLastName(data.user.lastName || "")
        setEmail(data.user.email || "")
        setPhone(data.user.phone || "")
      } else {
        toast({
          title: "Error",
          description: "No se pudo cargar el perfil",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error)
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast({
        title: "Error",
        description: "Nombre, apellido y email son obligatorios",
        variant: "destructive",
      })
      return
    }

    setSavingProfile(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
        toast({
          title: "Éxito",
          description: "Perfil actualizado correctamente",
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Error al actualizar perfil",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error al guardar perfil:', error)
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast({
        title: "Error",
        description: "Todos los campos de contraseña son obligatorios",
        variant: "destructive",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "La nueva contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      })
      return
    }

    setSavingPassword(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          currentPassword,
          newPassword,
        }),
      })

      if (response.ok) {
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        toast({
          title: "Éxito",
          description: "Contraseña actualizada correctamente",
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Error al cambiar contraseña",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error al cambiar contraseña:', error)
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    } finally {
      setSavingPassword(false)
    }
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos de imagen",
        variant: "destructive",
      })
      return
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen no puede ser mayor a 5MB",
        variant: "destructive",
      })
      return
    }

    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('photo', file)

      const response = await fetch('/api/user/profile/photo', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(prev => prev ? { ...prev, profilePhoto: data.profilePhoto } : null)
        toast({
          title: "Éxito",
          description: "Foto de perfil actualizada",
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Error al subir foto",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error al subir foto:', error)
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleRemovePhoto = async () => {
    setUploadingPhoto(true)
    try {
      const response = await fetch('/api/user/profile/photo', {
        method: 'DELETE',
      })

      if (response.ok) {
        setProfile(prev => prev ? { ...prev, profilePhoto: null } : null)
        toast({
          title: "Éxito",
          description: "Foto de perfil eliminada",
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Error al eliminar foto",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error al eliminar foto:', error)
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    } finally {
      setUploadingPhoto(false)
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'ADMINISTRADOR': return 'Administrador'
      case 'SUPERVISOR': return 'Supervisor'
      case 'COBRADOR': return 'Cobrador'
      default: return role
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMINISTRADOR': 
        return <Badge className="bg-red-100 text-red-800">Administrador</Badge>
      case 'SUPERVISOR': 
        return <Badge className="bg-blue-100 text-blue-800">Supervisor</Badge>
      case 'COBRADOR': 
        return <Badge className="bg-green-100 text-green-800">Cobrador</Badge>
      default: 
        return <Badge variant="outline">{role}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container-mobile">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <h1 className="text-lg font-semibold text-gray-900">Mi Perfil</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container-mobile py-8">
        <div className="max-w-4xl mx-auto">
          {/* Información General del Usuario */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={profile?.profilePhoto ? `/api/files/profile/${encodeURIComponent(profile.profilePhoto)}` : undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {profile?.firstName?.[0] || profile?.name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 rounded-full p-0"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      title="Cambiar foto"
                    >
                      <Camera className="h-3 w-3" />
                    </Button>
                    {profile?.profilePhoto && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 rounded-full p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={handleRemovePhoto}
                        disabled={uploadingPhoto}
                        title="Eliminar foto"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">{profile?.firstName} {profile?.lastName}</h2>
                  <p className="text-gray-600">{profile?.email}</p>
                  <div className="mt-2">
                    {getRoleBadge(profile?.role || '')}
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>Miembro desde</p>
                  <p>{new Date(profile?.createdAt || '').toLocaleDateString('es-CO')}</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Formularios */}
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="personal" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Información Personal</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center space-x-2">
                <Lock className="h-4 w-4" />
                <span>Seguridad</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle>Información Personal</CardTitle>
                  <CardDescription>
                    Actualiza tu información personal y de contacto
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="firstName">Nombre *</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Tu nombre"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Apellidos *</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Tus apellidos"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Número de teléfono"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Rol</Label>
                      <div className="mt-1">
                        {getRoleBadge(profile?.role || '')}
                      </div>
                    </div>
                    {profile?.timeLimit && (
                      <div>
                        <Label>Límite Diario</Label>
                        <p className="mt-1 text-sm text-gray-600">
                          {Math.floor(profile.timeLimit / 60)}h {profile.timeLimit % 60}m por día
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="w-full md:w-auto"
                    >
                      {savingProfile ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Cambiar Contraseña</CardTitle>
                  <CardDescription>
                    Actualiza tu contraseña para mantener tu cuenta segura
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="currentPassword">Contraseña Actual *</Label>
                    <div className="relative mt-1">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Contraseña actual"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="newPassword">Nueva Contraseña *</Label>
                    <div className="relative mt-1">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nueva contraseña (mínimo 6 caracteres)"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña *</Label>
                    <div className="relative mt-1">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirma tu nueva contraseña"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={handleChangePassword}
                      disabled={savingPassword}
                      className="w-full md:w-auto"
                    >
                      {savingPassword ? "Cambiando..." : "Cambiar Contraseña"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Input para subir foto (oculto) */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handlePhotoUpload}
      />
    </div>
  )
}
