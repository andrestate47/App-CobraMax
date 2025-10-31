
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcryptjs from 'bcryptjs'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        role: true,
        phone: true,
        profilePhoto: true,
        timeLimit: true,
        supervisorId: true,
        createdAt: true,
        lastLogin: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error al obtener perfil:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      phone,
      currentPassword,
      newPassword,
      profilePhoto
    } = body

    // Validar campos obligatorios
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Nombre, apellido y email son obligatorios' },
        { status: 400 }
      )
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Verificar que el email no esté en uso por otro usuario
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: {
          id: session.user.id
        }
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email ya está en uso por otro usuario' },
        { status: 400 }
      )
    }

    // Preparar datos para actualizar
    const updateData: any = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: `${firstName.trim()} ${lastName.trim()}`,
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      profilePhoto: profilePhoto || null
    }

    // Si se proporciona nueva contraseña, validarla
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Contraseña actual es requerida para cambiar la contraseña' },
          { status: 400 }
        )
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'La nueva contraseña debe tener al menos 6 caracteres' },
          { status: 400 }
        )
      }

      // Obtener usuario actual para verificar contraseña
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { password: true }
      })

      if (!currentUser) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        )
      }

      // Verificar contraseña actual
      const isValidPassword = await bcryptjs.compare(currentPassword, currentUser.password)
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Contraseña actual incorrecta' },
          { status: 400 }
        )
      }

      // Hash de la nueva contraseña
      const hashedPassword = await bcryptjs.hash(newPassword, 12)
      updateData.password = hashedPassword
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        role: true,
        phone: true,
        profilePhoto: true,
        timeLimit: true,
        supervisorId: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      message: 'Perfil actualizado exitosamente',
      user: updatedUser
    })

  } catch (error) {
    console.error('Error al actualizar perfil:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
