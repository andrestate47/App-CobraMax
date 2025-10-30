
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import InformeClientesClient from "@/components/informe-clientes-client"

export default async function InformeClientesPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/login")
  }

  return <InformeClientesClient session={session} />
}
