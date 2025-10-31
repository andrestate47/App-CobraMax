
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Solo administradores y supervisores pueden ver configuraciones
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!currentUser || (currentUser.role !== 'ADMINISTRADOR' && currentUser.role !== 'SUPERVISOR')) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const configuraciones = await prisma.configuracionSueldo.findMany({
      include: {
        usuario: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(configuraciones)
  } catch (error) {
    console.error("Error al obtener configuraciones de sueldo:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Solo administradores y supervisores pueden crear configuraciones
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!currentUser || (currentUser.role !== 'ADMINISTRADOR' && currentUser.role !== 'SUPERVISOR')) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const data = await request.json()
    const { 
      userId, 
      salarioBase, 
      comisionPorCobro, 
      limitePorcentajeAvance, 
      montoMinimoAvance 
    } = data

    // Validaciones
    if (!userId) {
      return NextResponse.json({ error: "ID de usuario requerido" }, { status: 400 })
    }

    if (!salarioBase || salarioBase < 0) {
      return NextResponse.json({ error: "Salario base debe ser mayor a 0" }, { status: 400 })
    }

    if (comisionPorCobro < 0 || comisionPorCobro > 100) {
      return NextResponse.json({ error: "Comisión debe estar entre 0 y 100%" }, { status: 400 })
    }

    if (limitePorcentajeAvance < 0 || limitePorcentajeAvance > 100) {
      return NextResponse.json({ error: "Límite de avance debe estar entre 0 y 100%" }, { status: 400 })
    }

    // Verificar que el usuario existe
    const usuario = await prisma.user.findUnique({ where: { id: userId } })
    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Crear o actualizar configuración
    const configuracion = await prisma.configuracionSueldo.upsert({
      where: { userId },
      update: {
        salarioBase: parseFloat(salarioBase),
        comisionPorCobro: parseFloat(comisionPorCobro),
        limitePorcentajeAvance: parseInt(limitePorcentajeAvance),
        montoMinimoAvance: parseFloat(montoMinimoAvance || "0"),
        activo: true,
        updatedAt: new Date()
      },
      create: {
        userId,
        salarioBase: parseFloat(salarioBase),
        comisionPorCobro: parseFloat(comisionPorCobro),
        limitePorcentajeAvance: parseInt(limitePorcentajeAvance),
        montoMinimoAvance: parseFloat(montoMinimoAvance || "0"),
        activo: true
      },
      include: {
        usuario: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json(configuracion, { status: 201 })
  } catch (error) {
    console.error("Error al crear configuración de sueldo:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
