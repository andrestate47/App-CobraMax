

import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/permissions"
import { prisma } from "@/lib/db"
import bcryptjs from "bcryptjs"
import { uploadFile } from "@/lib/s3"

export const dynamic = "force-dynamic"

// GET - Obtener todos los usuarios (solo administradores)
export async function GET(request: NextRequest) {
  try {
    await requireRole('ADMINISTRADOR')

    const usuarios = await prisma.user.findMany({
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
        _count: {
          select: {
            prestamos: true,
            pagos: true,
            gastos: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Formatear datos para frontend
    const usuariosFormateados = usuarios.map(usuario => ({
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
      stats: {
        prestamos: usuario._count.prestamos,
        pagos: usuario._count.pagos,
        gastos: usuario._count.gastos
      }
    }))

    return NextResponse.json(usuariosFormateados)
  } catch (error: any) {
    console.error("Error getting users:", error)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: error.message?.includes('autorizado') ? 401 : 500 }
    )
  }
}

// POST - Crear nuevo usuario (solo administradores)
export async function POST(request: NextRequest) {
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
      isActive = true,
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
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son obligatorios" },
        { status: 400 }
      )
    }

    if (!['ADMINISTRADOR', 'SUPERVISOR', 'COBRADOR'].includes(role)) {
      return NextResponse.json(
        { error: "Rol inválido" },
        { status: 400 }
      )
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe un usuario con este email" },
        { status: 400 }
      )
    }

    // Subir archivo del documento si existe
    let documentoUrl = null
    if (documentoFile && documentoFile.size > 0) {
      const buffer = Buffer.from(await documentoFile.arrayBuffer())
      const fileName = `usuarios/documentos/${Date.now()}-${documentoFile.name}`
      documentoUrl = await uploadFile(buffer, fileName)
    }

    // Encriptar contraseña
    const hashedPassword = await bcryptjs.hash(password, 12)

    // Crear usuario con valores correctamente procesados
    const nuevoUsuario = await prisma.user.create({
      data: {
        email: email.trim(),
        password: hashedPassword,
        firstName: firstName?.trim() || null,
        lastName: lastName?.trim() || null,
        name: name?.trim() || `${firstName?.trim() || ''} ${lastName?.trim() || ''}`.trim() || null,
        role,
        isActive: typeof isActive === 'boolean' ? isActive : true,
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
      },
      include: {
        supervisor: true
      }
    })

    // Asignar permisos si se proporcionaron
    if (permissions.length > 0) {
      await prisma.userPermission.createMany({
        data: permissions.map((permission: string) => ({
          userId: nuevoUsuario.id,
          permission
        })),
        skipDuplicates: true
      })
    }

    // Obtener usuario con permisos
    const usuarioCompleto = await prisma.user.findUnique({
      where: { id: nuevoUsuario.id },
      include: {
        permissions: true,
        supervisor: true
      }
    })

    return NextResponse.json({
      id: usuarioCompleto!.id,
      email: usuarioCompleto!.email,
      firstName: usuarioCompleto!.firstName,
      lastName: usuarioCompleto!.lastName,
      name: usuarioCompleto!.name,
      role: usuarioCompleto!.role,
      isActive: usuarioCompleto!.isActive,
      timeLimit: usuarioCompleto!.timeLimit,
      supervisor: usuarioCompleto!.supervisor,
      permissions: usuarioCompleto!.permissions.map(p => p.permission)
    })

  } catch (error: any) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: error.message?.includes('autorizado') ? 401 : 500 }
    )
  }
}

