
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcryptjs from "bcryptjs"
import { prisma } from "./db"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          },
          include: {
            permissions: true,
            supervisor: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true
              }
            }
          }
        })

        if (!user) {
          return null
        }

        // Verificar si el usuario está activo
        if (!user.isActive) {
          throw new Error('Usuario desactivado. Contacte al administrador.')
        }

        const isPasswordValid = await bcryptjs.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        // Actualizar último login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() }
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name || undefined,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          role: user.role,
          isActive: user.isActive,
          timeLimit: user.timeLimit || undefined,
          permissions: user.permissions.map(p => p.permission),
          supervisor: user.supervisor ? {
            id: user.supervisor.id,
            name: user.supervisor.name || undefined,
            firstName: user.supervisor.firstName || undefined,
            lastName: user.supervisor.lastName || undefined
          } : undefined
        }
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = (user as any).role
        token.firstName = (user as any).firstName
        token.lastName = (user as any).lastName
        token.isActive = (user as any).isActive
        token.timeLimit = (user as any).timeLimit
        token.permissions = (user as any).permissions
        token.supervisor = (user as any).supervisor
      }
      return token
    },
    session: async ({ session, token }) => {
      if (token) {
        session.user.id = token.sub || ""
        session.user.role = (token.role as any) || "COBRADOR"
        session.user.firstName = (token.firstName as string) || undefined
        session.user.lastName = (token.lastName as string) || undefined
        session.user.isActive = (token.isActive as boolean) || true
        session.user.timeLimit = (token.timeLimit as number) || undefined
        session.user.permissions = (token.permissions as string[]) || []
        session.user.supervisor = (token.supervisor as any) || undefined
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
}
