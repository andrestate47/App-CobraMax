
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'react-hot-toast'
import { Plus, X, Users, DollarSign, Calendar, ArrowUp, ArrowDown } from 'lucide-react'

interface Usuario {
  id: string
  name: string | null
  firstName: string | null
  lastName: string | null
  email: string
  role: string
}

interface ParticipanteSeleccionado {
  userId: string
  orden: number
  usuario: Usuario
}

interface CrearSusuModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CrearSusuModal({ open, onOpenChange }: CrearSusuModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [buscarUsuario, setBuscarUsuario] = useState('')
  const [participantes, setParticipantes] = useState<ParticipanteSeleccionado[]>([])
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    montoTotal: '',
    frecuencia: 'SEMANAL',
    fechaInicio: new Date().toISOString().split('T')[0],
    observaciones: ''
  })

  // Cargar usuarios disponibles
  useEffect(() => {
    if (open) {
      cargarUsuarios()
    }
  }, [open, buscarUsuario])

  const cargarUsuarios = async () => {
    try {
      const params = new URLSearchParams()
      if (buscarUsuario) {
        params.append('q', buscarUsuario)
      }
      
      const response = await fetch(`/api/susu/usuarios?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUsuarios(data)
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error)
    }
  }

  const agregarParticipante = (usuario: Usuario) => {
    if (participantes.find(p => p.userId === usuario.id)) {
      toast.error('Este usuario ya está en la lista')
      return
    }

    const nuevoParticipante: ParticipanteSeleccionado = {
      userId: usuario.id,
      orden: participantes.length + 1,
      usuario
    }

    setParticipantes([...participantes, nuevoParticipante])
    setBuscarUsuario('')
  }

  const removerParticipante = (userId: string) => {
    const nuevosParticipantes = participantes
      .filter(p => p.userId !== userId)
      .map((p, index) => ({ ...p, orden: index + 1 }))
    
    setParticipantes(nuevosParticipantes)
  }

  const moverParticipante = (userId: string, direccion: 'arriba' | 'abajo') => {
    const index = participantes.findIndex(p => p.userId === userId)
    if (
      (direccion === 'arriba' && index === 0) ||
      (direccion === 'abajo' && index === participantes.length - 1)
    ) {
      return
    }

    const nuevosParticipantes = [...participantes]
    const targetIndex = direccion === 'arriba' ? index - 1 : index + 1
    
    ;[nuevosParticipantes[index], nuevosParticipantes[targetIndex]] = 
    [nuevosParticipantes[targetIndex], nuevosParticipantes[index]]

    // Actualizar orden
    nuevosParticipantes.forEach((p, i) => {
      p.orden = i + 1
    })

    setParticipantes(nuevosParticipantes)
  }

  const calcularMontoPorParticipante = () => {
    if (!formData.montoTotal || participantes.length === 0) return 0
    return parseFloat(formData.montoTotal) / participantes.length
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (participantes.length < 2) {
      toast.error('Debe haber al menos 2 participantes')
      return
    }

    if (!formData.nombre || !formData.montoTotal || !formData.fechaInicio) {
      toast.error('Complete todos los campos requeridos')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/susu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          montoTotal: parseFloat(formData.montoTotal),
          frecuencia: formData.frecuencia,
          fechaInicio: new Date(formData.fechaInicio).toISOString(),
          participantes: participantes.map(p => ({
            userId: p.userId,
            orden: p.orden
          })),
          observaciones: formData.observaciones
        })
      })

      if (response.ok) {
        const susu = await response.json()
        toast.success('SUSU creado exitosamente')
        onOpenChange(false)
        router.push(`/susu/${susu.id}`)
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al crear el SUSU')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al crear el SUSU')
    } finally {
      setLoading(false)
    }
  }

  const getNombreCompleto = (usuario: Usuario) => {
    if (usuario.name) return usuario.name
    if (usuario.firstName && usuario.lastName) {
      return `${usuario.firstName} ${usuario.lastName}`
    }
    return usuario.email
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Crear Nuevo SUSU</DialogTitle>
          <DialogDescription>
            Configure el SUSU y agregue participantes en el orden que desee
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del SUSU *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: SUSU Enero 2025"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="montoTotal">Monto Total *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="montoTotal"
                  type="number"
                  step="0.01"
                  value={formData.montoTotal}
                  onChange={(e) => setFormData({ ...formData, montoTotal: e.target.value })}
                  placeholder="1000.00"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frecuencia">Frecuencia *</Label>
              <Select
                value={formData.frecuencia}
                onValueChange={(value) => setFormData({ ...formData, frecuencia: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEMANAL">Semanal</SelectItem>
                  <SelectItem value="QUINCENAL">Quincenal</SelectItem>
                  <SelectItem value="MENSUAL">Mensual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fechaInicio">Fecha de Inicio *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fechaInicio"
                  type="date"
                  value={formData.fechaInicio}
                  onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción opcional del SUSU"
                rows={2}
              />
            </div>
          </div>

          {/* Resumen */}
          {participantes.length > 0 && formData.montoTotal && (
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-muted-foreground">Participantes</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {participantes.length}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Monto Total</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    S/ {parseFloat(formData.montoTotal).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Monto por Periodo</div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    S/ {calcularMontoPorParticipante().toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Participantes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg">Participantes ({participantes.length})</Label>
            </div>

            {/* Buscar y agregar usuario */}
            <div className="space-y-2">
              <Label htmlFor="buscarUsuario">Buscar Usuario</Label>
              <div className="flex gap-2">
                <Input
                  id="buscarUsuario"
                  value={buscarUsuario}
                  onChange={(e) => setBuscarUsuario(e.target.value)}
                  placeholder="Buscar por nombre o email..."
                />
              </div>
              
              {buscarUsuario && usuarios.length > 0 && (
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {usuarios
                    .filter(u => !participantes.find(p => p.userId === u.id))
                    .map(usuario => (
                      <button
                        key={usuario.id}
                        type="button"
                        onClick={() => agregarParticipante(usuario)}
                        className="w-full px-4 py-2 text-left hover:bg-muted flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium">{getNombreCompleto(usuario)}</div>
                          <div className="text-sm text-muted-foreground">{usuario.email}</div>
                        </div>
                        <Plus className="h-4 w-4" />
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Lista de participantes */}
            {participantes.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  No hay participantes aún. Busque y agregue usuarios.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {participantes.map((participante, index) => (
                  <div
                    key={participante.userId}
                    className="flex items-center justify-between p-3 border rounded-lg bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center font-bold">
                        {participante.orden}
                      </div>
                      <div>
                        <div className="font-medium">
                          {getNombreCompleto(participante.usuario)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {participante.usuario.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moverParticipante(participante.userId, 'arriba')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moverParticipante(participante.userId, 'abajo')}
                        disabled={index === participantes.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removerParticipante(participante.userId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Notas adicionales sobre el SUSU"
              rows={2}
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || participantes.length < 2}>
              {loading ? 'Creando...' : 'Crear SUSU'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
