
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import NuevoPrestamoClient from "@/components/nuevo-prestamo-client"

export default async function NuevoPrestamoPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/login")
  }

  return <NuevoPrestamoClient session={session} />
}
