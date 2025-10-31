
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const formData = await request.formData()
    const photo = formData.get('photo') as File
    const clienteId = formData.get('clienteId') as string
    const photoType = formData.get('photoType') as string

    if (!photo || !clienteId || !photoType) {
      return NextResponse.json(
        { error: "Faltan datos: foto, ID del cliente o tipo de foto" },
        { status: 400 }
      )
    }

    if (!['cliente', 'dni'].includes(photoType)) {
      return NextResponse.json(
        { error: "Tipo de foto inválido. Debe ser 'cliente' o 'dni'" },
        { status: 400 }
      )
    }

    // Verificar que el cliente existe
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId }
    })

    if (!cliente) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      )
    }

    // Crear directorio uploads si no existe
    const uploadsDir = path.join(process.cwd(), 'uploads')
    const clientesDir = path.join(uploadsDir, 'clientes')
    
    try {
      await mkdir(clientesDir, { recursive: true })
    } catch (error) {
      // El directorio ya existe
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const extension = photo.name.split('.').pop() || 'jpg'
    const fileName = `${photoType}-${clienteId}-${timestamp}.${extension}`
    const filePath = path.join(clientesDir, fileName)

    // Guardar archivo
    const bytes = await photo.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // URL de acceso al archivo
    const fileUrl = `/api/files/clientes/${fileName}`

    // Actualizar cliente en la base de datos según el tipo de foto
    const updateData = photoType === 'cliente' 
      ? { foto: fileUrl }
      : { fotoDocumento: fileUrl }

    const updatedCliente = await prisma.cliente.update({
      where: { id: clienteId },
      data: updateData
    })

    return NextResponse.json({
      message: "Foto guardada exitosamente",
      fileUrl,
      photoType,
      cliente: {
        id: updatedCliente.id,
        nombre: updatedCliente.nombre,
        apellido: updatedCliente.apellido,
        foto: updatedCliente.foto,
        fotoDocumento: (updatedCliente as any).fotoDocumento
      }
    })

  } catch (error) {
    console.error("Error al guardar foto:", error)
    return NextResponse.json(
      { 
        error: "Error interno del servidor",
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
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
    const clienteId = searchParams.get("clienteId")

    if (!clienteId) {
      return NextResponse.json(
        { error: "ID del cliente requerido" },
        { status: 400 }
      )
    }

    // Obtener fotos del cliente
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        foto: true,
        fotoDocumento: true
      }
    })

    if (!cliente) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      cliente,
      fotos: {
        cliente: cliente.foto,
        documento: (cliente as any).fotoDocumento
      }
    })

  } catch (error) {
    console.error("Error al obtener fotos:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
