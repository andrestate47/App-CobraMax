
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import InformesDiaClient from "@/components/informes-dia-client"

export default async function InformesDiaPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/login")
  }

  return <InformesDiaClient session={session} />
}
