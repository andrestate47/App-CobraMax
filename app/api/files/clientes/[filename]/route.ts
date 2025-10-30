
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { readFile } from 'fs/promises'
import path from 'path'

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const filename = params.filename
    
    if (!filename) {
      return NextResponse.json({ error: "Nombre de archivo requerido" }, { status: 400 })
    }

    // Construir ruta del archivo
    const filePath = path.join(process.cwd(), 'uploads', 'clientes', filename)
    
    try {
      // Leer el archivo
      const fileBuffer = await readFile(filePath)
      
      // Determinar el tipo MIME basado en la extensión
      const extension = filename.split('.').pop()?.toLowerCase()
      let contentType = 'application/octet-stream'
      
      switch (extension) {
        case 'jpg':
        case 'jpeg':
          contentType = 'image/jpeg'
          break
        case 'png':
          contentType = 'image/png'
          break
        case 'gif':
          contentType = 'image/gif'
          break
        case 'webp':
          contentType = 'image/webp'
          break
      }
      
      // Retornar el archivo con los headers correctos
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
      
    } catch (fileError) {
      console.error('Error reading file:', fileError)
      return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 })
    }

  } catch (error) {
    console.error("Error al servir archivo:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
