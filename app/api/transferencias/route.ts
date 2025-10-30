

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

    const body = await request.json()
    const { prestamoId, monto, banco, referencia, observaciones, fotoComprobante } = body

    // Validar campos obligatorios
    if (!prestamoId || !monto || !fotoComprobante) {
      return NextResponse.json(
        { error: "Los campos préstamo, monto y foto del comprobante son obligatorios" },
        { status: 400 }
      )
    }

    // Verificar que el préstamo existe
    const prestamo = await prisma.prestamo.findUnique({
      where: { id: prestamoId }
    })

    if (!prestamo) {
      return NextResponse.json(
        { error: "Préstamo no encontrado" },
        { status: 404 }
      )
    }

    // Validar el monto
    const montoNum = parseFloat(monto.toString())
    if (montoNum <= 0) {
      return NextResponse.json(
        { error: "El monto debe ser mayor a cero" },
        { status: 400 }
      )
    }

    // Crear la transferencia
    const nuevaTransferencia = await prisma.transferencia.create({
      data: {
        prestamoId,
        userId: session.user.id,
        monto: montoNum,
        banco: banco?.trim() || null,
        referencia: referencia?.trim() || null,
        fotoComprobante,
        observaciones: observaciones?.trim() || null,
      },
      include: {
        usuario: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            email: true
          }
        },
        prestamo: {
          select: {
            id: true,
            cliente: {
              select: {
                nombre: true,
                apellido: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      id: nuevaTransferencia.id,
      prestamoId: nuevaTransferencia.prestamoId,
      monto: parseFloat(nuevaTransferencia.monto.toString()),
      banco: nuevaTransferencia.banco,
      referencia: nuevaTransferencia.referencia,
      fotoComprobante: nuevaTransferencia.fotoComprobante,
      observaciones: nuevaTransferencia.observaciones,
      fecha: nuevaTransferencia.fecha,
      usuario: nuevaTransferencia.usuario,
      prestamo: nuevaTransferencia.prestamo
    })

  } catch (error) {
    console.error("Error al crear transferencia:", error)
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
    const prestamoId = searchParams.get('prestamoId')

    if (!prestamoId) {
      return NextResponse.json(
        { error: "ID del préstamo es requerido" },
        { status: 400 }
      )
    }

    const transferencias = await prisma.transferencia.findMany({
      where: {
        prestamoId
      },
      include: {
        usuario: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(transferencias.map(transferencia => ({
      id: transferencia.id,
      prestamoId: transferencia.prestamoId,
      monto: parseFloat(transferencia.monto.toString()),
      banco: transferencia.banco,
      referencia: transferencia.referencia,
      fotoComprobante: transferencia.fotoComprobante,
      observaciones: transferencia.observaciones,
      fecha: transferencia.fecha,
      usuario: transferencia.usuario
    })))

  } catch (error) {
    console.error("Error al obtener transferencias:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

