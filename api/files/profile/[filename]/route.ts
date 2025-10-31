
import { NextRequest, NextResponse } from 'next/server'
import { downloadFile } from '@/lib/s3'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    // Decodificar el filename que viene como parámetro
    const key = decodeURIComponent(params.filename)

    // Generar URL firmada
    const signedUrl = await downloadFile(key)

    // Redirigir a la URL firmada
    return NextResponse.redirect(signedUrl)

  } catch (error) {
    console.error('Error al obtener imagen de perfil:', error)
    return NextResponse.json(
      { error: 'Imagen no encontrada' },
      { status: 404 }
    )
  }
}
