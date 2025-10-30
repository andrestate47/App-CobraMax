

import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/permissions"
import { prisma } from "@/lib/db"
import bcryptjs from "bcryptjs"
import { uploadFile, deleteFile } from "@/lib/s3"

export const dynamic = "force-dynamic"

// GET - Obtener usuario específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole('ADMINISTRADOR')

    const usuario = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        permissions: true,
        supervisor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            email: true
          }
        },
        supervisados: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            email: true
          }
        },
        timeUsage: {
          orderBy: {
            date: 'desc'
          },
          take: 30 // Últimos 30 días
        }
      }
    })

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: usuario.id,
      email: usuario.email,
      firstName: usuario.firstName,
      lastName: usuario.lastName,
      name: usuario.name,
      role: usuario.role,
      isActive: usuario.isActive,
      timeLimit: usuario.timeLimit,
      lastLogin: usuario.lastLogin,
      createdAt: usuario.createdAt,
      supervisor: usuario.supervisor,
      supervisados: usuario.supervisados,
      permissions: usuario.permissions.map(p => p.permission),
      timeUsage: usuario.timeUsage
    })

  } catch (error: any) {
    console.error("Error getting user:", error)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: error.message?.includes('autorizado') ? 401 : 500 }
    )
  }
}

// PUT - Actualizar usuario
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole('ADMINISTRADOR')

    const contentType = request.headers.get('content-type') || ''
    let body: any
    let documentoFile: File | null = null

    // Manejar FormData o JSON
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      body = Object.fromEntries(formData.entries())
      
      // Extraer archivo si existe
      documentoFile = formData.get('documentoFile') as File | null
      
      // Parsear permisos si viene como string
      if (typeof body.permissions === 'string') {
        try {
          body.permissions = JSON.parse(body.permissions)
        } catch {
          body.permissions = []
        }
      }
      
      // Convertir valores booleanos y numéricos de strings
      if (body.isActive !== undefined) {
        body.isActive = body.isActive === 'true' || body.isActive === true
      }
      if (body.timeLimit) {
        const parsed = parseInt(body.timeLimit)
        body.timeLimit = isNaN(parsed) || body.timeLimit === '' ? null : parsed
      }
    } else {
      body = await request.json()
    }

    const {
      email,
      password,
      firstName,
      lastName,
      name,
      role,
      isActive,
      timeLimit,
      supervisorId,
      phone,
      phoneReferencial,
      address,
      pais,
      ciudad,
      ubicacion,
      mapLink,
      referenciaFamiliar,
      referenciaTrabajo,
      permissions = []
    } = body

    // Validaciones
    if (!email) {
      return NextResponse.json(
        { error: "Email es obligatorio" },
        { status: 400 }
      )
    }

    if (role && !['ADMINISTRADOR', 'SUPERVISOR', 'COBRADOR'].includes(role)) {
      return NextResponse.json(
        { error: "Rol inválido" },
        { status: 400 }
      )
    }

    // Verificar si el usuario existe
    const usuarioExistente = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!usuarioExistente) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    // Verificar si el email ya existe (excepto el usuario actual)
    if (email !== usuarioExistente.email) {
      const emailExistente = await prisma.user.findUnique({
        where: { email }
      })

      if (emailExistente) {
        return NextResponse.json(
          { error: "Ya existe un usuario con este email" },
          { status: 400 }
        )
      }
    }

    // Subir archivo del documento si existe
    let documentoUrl = usuarioExistente.documentoIdentificacion
    if (documentoFile && documentoFile.size > 0) {
      // Eliminar archivo anterior si existe
      if (usuarioExistente.documentoIdentificacion) {
        try {
          await deleteFile(usuarioExistente.documentoIdentificacion)
        } catch (error) {
          console.error("Error deleting old document:", error)
        }
      }
      
      const buffer = Buffer.from(await documentoFile.arrayBuffer())
      const fileName = `usuarios/documentos/${Date.now()}-${documentoFile.name}`
      documentoUrl = await uploadFile(buffer, fileName)
    }

    // Preparar datos de actualización con valores correctamente procesados
    const updateData: any = {
      email: email?.trim() || usuarioExistente.email,
      firstName: firstName?.trim() || null,
      lastName: lastName?.trim() || null,
      name: name?.trim() || `${firstName?.trim() || ''} ${lastName?.trim() || ''}`.trim() || null,
      role: role || usuarioExistente.role,
      isActive: isActive !== undefined ? (typeof isActive === 'boolean' ? isActive : isActive === 'true') : usuarioExistente.isActive,
      timeLimit: timeLimit && !isNaN(Number(timeLimit)) ? Number(timeLimit) : null,
      supervisorId: supervisorId?.trim() || null,
      phone: phone?.trim() || null,
      phoneReferencial: phoneReferencial?.trim() || null,
      address: address?.trim() || null,
      pais: pais?.trim() || null,
      ciudad: ciudad?.trim() || null,
      ubicacion: ubicacion?.trim() || null,
      mapLink: mapLink?.trim() || null,
      referenciaFamiliar: referenciaFamiliar?.trim() || null,
      referenciaTrabajo: referenciaTrabajo?.trim() || null,
      documentoIdentificacion: documentoUrl
    }

    // Si se proporciona contraseña, encriptarla
    if (password) {
      updateData.password = await bcryptjs.hash(password, 12)
    }

    // Actualizar usuario
    await prisma.user.update({
      where: { id: params.id },
      data: updateData
    })

    // Actualizar permisos
    // Primero eliminar permisos existentes
    await prisma.userPermission.deleteMany({
      where: { userId: params.id }
    })

    // Luego agregar nuevos permisos
    if (permissions.length > 0) {
      await prisma.userPermission.createMany({
        data: permissions.map((permission: string) => ({
          userId: params.id,
          permission
        })),
        skipDuplicates: true
      })
    }

    // Obtener usuario actualizado
    const usuarioActualizado = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        permissions: true,
        supervisor: true
      }
    })

    return NextResponse.json({
      id: usuarioActualizado!.id,
      email: usuarioActualizado!.email,
      firstName: usuarioActualizado!.firstName,
      lastName: usuarioActualizado!.lastName,
      name: usuarioActualizado!.name,
      role: usuarioActualizado!.role,
      isActive: usuarioActualizado!.isActive,
      timeLimit: usuarioActualizado!.timeLimit,
      supervisor: usuarioActualizado!.supervisor,
      permissions: usuarioActualizado!.permissions.map(p => p.permission)
    })

  } catch (error: any) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: error.message?.includes('autorizado') ? 401 : 500 }
    )
  }
}

// DELETE - Eliminar usuario
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole('ADMINISTRADOR')

    const usuario = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            prestamos: true,
            pagos: true,
            gastos: true
          }
        }
      }
    })

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    // Verificar si el usuario tiene registros asociados
    const tieneRegistros = usuario._count.prestamos > 0 || 
                          usuario._count.pagos > 0 || 
                          usuario._count.gastos > 0

    if (tieneRegistros) {
      return NextResponse.json(
        { error: "No se puede eliminar el usuario porque tiene registros asociados (préstamos, pagos, gastos)" },
        { status: 400 }
      )
    }

    // Eliminar usuario (los permisos se eliminan automáticamente por CASCADE)
    await prisma.user.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: error.message?.includes('autorizado') ? 401 : 500 }
    )
  }
}

