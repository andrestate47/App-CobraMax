
import LoginForm from "@/components/login-form"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Iniciar Sesión - B.&.D.S.C",
  description: "Inicia sesión en el sistema de cobranza",
}

export default function LoginPage() {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  )
}
