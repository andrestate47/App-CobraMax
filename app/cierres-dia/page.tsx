
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import CierresDiaClient from "@/components/cierres-dia-client"

export default async function CierresDiaPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/login")
  }

  return <CierresDiaClient session={session} />
}
