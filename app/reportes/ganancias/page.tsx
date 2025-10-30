

import { Metadata } from "next"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import ReporteGananciasClient from "@/components/reporte-ganancias-client"

export const metadata: Metadata = {
  title: "Reporte de Ganancias - B.&.D.S.C",
  description: "Análisis detallado de ganancias, pérdidas y métricas financieras",
}

export default async function ReporteGananciasPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  return <ReporteGananciasClient session={session} />
}

