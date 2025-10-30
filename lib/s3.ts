
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getBucketConfig, createS3Client } from './aws-config'

export const uploadFile = async (buffer: Buffer, fileName: string) => {
  const { bucketName, folderPrefix } = getBucketConfig()
  const s3Client = createS3Client()
  
  const key = `${folderPrefix}uploads/${Date.now()}-${fileName}`
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: getContentType(fileName)
  })
  
  await s3Client.send(command)
  return key // Retornar la clave S3 completa
}

export const downloadFile = async (key: string) => {
  const { bucketName } = getBucketConfig()
  const s3Client = createS3Client()
  
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key
  })
  
  // Generar URL firmada válida por 1 hora
  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
  return signedUrl
}

export const deleteFile = async (key: string) => {
  const { bucketName } = getBucketConfig()
  const s3Client = createS3Client()
  
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key
  })
  
  await s3Client.send(command)
}

export const renameFile = async (oldKey: string, newKey: string) => {
  // AWS S3 no tiene operación de renombrar directamente
  // Necesitaríamos copiar y luego eliminar
  throw new Error('Rename operation not implemented')
}

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
    case 'pdf':
      return 'application/pdf'
    case 'doc':
      return 'application/msword'
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    default:
      return 'application/octet-stream'
  }
}
