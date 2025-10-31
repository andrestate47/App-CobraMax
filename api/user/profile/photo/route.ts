
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getBucketConfig, createS3Client } from '@/lib/aws-config'

// Función para subir archivo a S3
const uploadFile = async (buffer: Buffer, fileName: string) => {
  const { bucketName, folderPrefix } = getBucketConfig()
  const s3Client = createS3Client()
  
  const key = `${folderPrefix}profile-photos/${Date.now()}-${fileName}`
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: getContentType(fileName)
  })
  
  await s3Client.send(command)
  return key // Retornar la clave S3 completa
}

// Función para eliminar archivo de S3
const deleteFile = async (key: string) => {
  const { bucketName } = getBucketConfig()
  const s3Client = createS3Client()
  
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key
  })
  
  await s3Client.send(command)
}

// Función para obtener el tipo de contenido basado en la extensión del archivo
const getContentType = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase()
  
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'gif':
      return 'image/gif'
    case 'webp':
      return 'image/webp'
    default:
      return 'image/jpeg'
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('photo') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ninguna imagen' },
        { status: 400 }
      )
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Solo se permiten archivos de imagen' },
        { status: 400 }
      )
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'La imagen no puede ser mayor a 5MB' },
        { status: 400 }
      )
    }

    // Obtener usuario actual para eliminar foto anterior si existe
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { profilePhoto: true }
    })

    // Convertir archivo a buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Subir nueva foto a S3
    const newPhotoKey = await uploadFile(buffer, file.name)

    // Actualizar usuario con nueva foto
    await prisma.user.update({
      where: { id: session.user.id },
      data: { profilePhoto: newPhotoKey }
    })

    // Eliminar foto anterior si existía
    if (currentUser?.profilePhoto) {
      try {
        await deleteFile(currentUser.profilePhoto)
      } catch (deleteError) {
        console.warn('No se pudo eliminar la foto anterior:', deleteError)
      }
    }

    return NextResponse.json({
      message: 'Foto de perfil actualizada exitosamente',
      profilePhoto: newPhotoKey
    })

  } catch (error) {
    console.error('Error al subir foto de perfil:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener usuario actual
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { profilePhoto: true }
    })

    if (!currentUser?.profilePhoto) {
      return NextResponse.json(
        { error: 'No hay foto de perfil para eliminar' },
        { status: 400 }
      )
    }

    // Eliminar foto de S3
    await deleteFile(currentUser.profilePhoto)

    // Actualizar usuario
    await prisma.user.update({
      where: { id: session.user.id },
      data: { profilePhoto: null }
    })

    return NextResponse.json({
      message: 'Foto de perfil eliminada exitosamente'
    })

  } catch (error) {
    console.error('Error al eliminar foto de perfil:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
