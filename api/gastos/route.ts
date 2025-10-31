import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { uploadFile } from "@/lib/s3"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get("fecha")
    const limite = parseInt(searchParams.get("limite") || "50")

    let whereCondition: any = {}

    if (fecha) {
      const fechaInicio = new Date(fecha)
      fechaInicio.setHours(0, 0, 0, 0)
      const fechaFin = new Date(fecha)
      fechaFin.setHours(23, 59, 59, 999)
      
      whereCondition.fecha = {
        gte: fechaInicio,
        lte: fechaFin
      }
    }

    const gastos = await prisma.gasto.findMany({
      where: whereCondition,
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

    // ✅ Tipado explícito para evitar error TS: 'gasto' implícitamente tiene tipo 'any'
    const gastosFormateados = gastos.map((gasto: any) => ({
      id: gasto.id,
      concepto: gasto.concepto,
      monto: parseFloat(gasto.monto.toString()),
      fecha: gasto.fecha,
      observaciones: gasto.observaciones,
      fotoComprobante: gasto.fotoComprobante,
      usuario: {
        nombre: gasto.usuario.firstName && gasto.usuario.lastName 
          ? `${gasto.usuario.firstName} ${gasto.usuario.lastName}`
          : gasto.usuario.name || "Usuario"
      }
    }))

    return NextResponse.json(gastosFormateados)
  } catch (error) {
    console.error("Error al obtener gastos:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    let concepto: string
    let monto: string | number
    let observaciones: string | undefined
    let fotoComprobante: string | undefined

    const contentType = request.headers.get("content-type")
    
    if (contentType?.includes("multipart/form-data")) {
      const formData = await request.formData()
      concepto = formData.get("concepto") as string
      monto = formData.get("monto") as string
      observaciones = formData.get("observaciones") as string | undefined
      
      const file = formData.get("foto") as File | null
      
      if (file) {
        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"]
        if (!validTypes.includes(file.type)) {
          return NextResponse.json(
            { error: "Tipo de archivo no permitido. Solo se aceptan imágenes (JPG, PNG, WEBP) o PDF" },
            { status: 400 }
          )
        }

        const maxSize = 5 * 1024 * 1024
        if (file.size > maxSize) {
          return NextResponse.json(
            { error: "El archivo es demasiado grande. Tamaño máximo: 5MB" },
            { status: 400 }
          )
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        fotoComprobante = await uploadFile(buffer, file.name)
      }
    } else {
      const body = await request.json()
      concepto = body.concepto
      monto = body.monto
      observaciones = body.observaciones
    }

    if (!concepto || !monto) {
      return NextResponse.json(
        { error: "Concepto y monto son obligatorios" },
        { status: 400 }
      )
    }

    // 🚫 Verificación adicional: los cobradores no pueden registrar gastos después del cierre diario
    if (session.user.role === "COBRADOR") {
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      
      const cierreHoy = await prisma.cierreDia.findUnique({
        where: { fecha: hoy }
      })

      if (cierreHoy) {
        return NextResponse.json(
          { error: "No se pueden registrar gastos después del cierre del día" },
          { status: 403 }
        )
      }
    }

    const gasto = await prisma.gasto.create({
      data: {
        concepto: concepto.trim(),
        monto: parseFloat(monto.toString()),
        observaciones: observaciones?.trim(),
        fotoComprobante: fotoComprobante,
        userId: session.user.id
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
      message: "Gasto registrado exitosamente",
      gasto: {
        id: gasto.id,
        concepto: gasto.concepto,
        monto: parseFloat(gasto.monto.toString()),
        fecha: gasto.fecha,
        observaciones: gasto.observaciones,
        fotoComprobante: gasto.fotoComprobante,
        usuario: {
          nombre: gasto.usuario.firstName && gasto.usuario.lastName 
            ? `${gasto.usuario.firstName} ${gasto.usuario.lastName}`
            : gasto.usuario.name || "Usuario"
        }
      }
    })
  } catch (error) {
    console.error("Error al crear gasto:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
