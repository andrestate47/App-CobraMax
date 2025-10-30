
import { headers } from 'next/headers'
import crypto from 'crypto'

export interface DeviceInfo {
  deviceId: string
  userAgent: string
  ipAddress: string
  deviceName: string
}

export async function getDeviceInfo(): Promise<DeviceInfo> {
  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || 'Unknown'
  const forwardedFor = headersList.get('x-forwarded-for')
  const realIp = headersList.get('x-real-ip')
  const ipAddress = forwardedFor?.split(',')[0] || realIp || 'Unknown'

  // Generar un ID único del dispositivo basado en user-agent e IP
  const deviceId = generateDeviceId(userAgent, ipAddress)
  
  // Generar un nombre descriptivo del dispositivo
  const deviceName = generateDeviceName(userAgent)

  return {
    deviceId,
    userAgent,
    ipAddress,
    deviceName
  }
}

function generateDeviceId(userAgent: string, ipAddress: string): string {
  const hash = crypto
    .createHash('sha256')
    .update(userAgent + ipAddress)
    .digest('hex')
  
  return hash.substring(0, 32)
}

function generateDeviceName(userAgent: string): string {
  const ua = userAgent.toLowerCase()
  
  // Detectar sistema operativo
  let os = 'Desconocido'
  if (ua.includes('windows')) os = 'Windows'
  else if (ua.includes('mac os')) os = 'Mac OS'
  else if (ua.includes('android')) os = 'Android'
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS'
  else if (ua.includes('linux')) os = 'Linux'

  // Detectar navegador
  let browser = 'Desconocido'
  if (ua.includes('edg')) browser = 'Edge'
  else if (ua.includes('chrome')) browser = 'Chrome'
  else if (ua.includes('firefox')) browser = 'Firefox'
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari'
  else if (ua.includes('opera')) browser = 'Opera'

  // Detectar tipo de dispositivo
  let deviceType = 'Computadora'
  if (ua.includes('mobile')) deviceType = 'Móvil'
  else if (ua.includes('tablet')) deviceType = 'Tablet'

  return `${deviceType} ${os} - ${browser}`
}

export function isAdmin(userRole: string): boolean {
  return userRole === 'ADMINISTRADOR'
}
