
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Solo administradores pueden cerrar el día
    if (session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json(
        { error: "Solo los administradores pueden cerrar el día" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { fecha, totalCobrado, totalPrestado, totalGastos, saldoEfectivo, observaciones } = body

    const fechaCierre = new Date(fecha)
    fechaCierre.setHours(0, 0, 0, 0)

    // Verificar que no exista ya un cierre para esta fecha
    const cierreExistente = await prisma.cierreDia.findUnique({
      where: { fecha: fechaCierre }
    })

    if (cierreExistente) {
      return NextResponse.json(
        { error: "Ya existe un cierre para esta fecha" },
        { status: 400 }
      )
    }

    // Crear el cierre del día
    const cierre = await prisma.cierreDia.create({
      data: {
        fecha: fechaCierre,
        userId: session.user.id,
        totalCobrado: parseFloat(totalCobrado),
        totalPrestado: parseFloat(totalPrestado),
        totalGastos: parseFloat(totalGastos),
        saldoEfectivo: parseFloat(saldoEfectivo),
        observaciones: observaciones?.trim()
      },
      include: {
        usuario: {
          select: {
            firstName: true,
            lastName: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      message: "Día cerrado exitosamente",
      cierre: {
        id: cierre.id,
        fecha: cierre.fecha,
        totalCobrado: parseFloat(cierre.totalCobrado.toString()),
        totalPrestado: parseFloat(cierre.totalPrestado.toString()),
        totalGastos: parseFloat(cierre.totalGastos.toString()),
        saldoEfectivo: parseFloat(cierre.saldoEfectivo.toString()),
        observaciones: cierre.observaciones,
        usuario: {
          nombre: cierre.usuario.firstName && cierre.usuario.lastName 
            ? `${cierre.usuario.firstName} ${cierre.usuario.lastName}`
            : cierre.usuario.name || "Usuario"
        }
      }
    })
  } catch (error) {
    console.error("Error al cerrar día:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limite = parseInt(searchParams.get("limite") || "30")

    const cierres = await prisma.cierreDia.findMany({
      include: {
        usuario: {
          select: {
            firstName: true,
            lastName: true,
            name: true
          }
        }
      },
      orderBy: {
        fecha: "desc"
      },
      take: limite
    })

    const cierresFormateados = cierres.map(cierre => ({
      id: cierre.id,
      fecha: cierre.fecha,
      totalCobrado: parseFloat(cierre.totalCobrado.toString()),
      totalPrestado: parseFloat(cierre.totalPrestado.toString()),
      totalGastos: parseFloat(cierre.totalGastos.toString()),
      saldoEfectivo: parseFloat(cierre.saldoEfectivo.toString()),
      observaciones: cierre.observaciones,
      createdAt: cierre.createdAt,
      usuario: {
        nombre: cierre.usuario.firstName && cierre.usuario.lastName 
          ? `${cierre.usuario.firstName} ${cierre.usuario.lastName}`
          : cierre.usuario.name || "Usuario"
      }
    }))

    return NextResponse.json(cierresFormateados)
  } catch (error) {
    console.error("Error al obtener cierres:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
