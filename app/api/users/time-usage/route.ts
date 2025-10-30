

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { checkTimeLimit, recordTimeUsage } from "@/lib/permissions"

export const dynamic = "force-dynamic"

// GET - Obtener el uso de tiempo actual del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const timeCheck = await checkTimeLimit(session.user.id)

    return NextResponse.json(timeCheck)
  } catch (error) {
    console.error("Error checking time usage:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// POST - Registrar actividad del usuario
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const minutes = body.minutes || 1

    await recordTimeUsage(session.user.id, minutes)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error recording time usage:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

