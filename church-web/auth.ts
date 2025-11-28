import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { prisma } from "./lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }

      // Handle session update trigger
      if (trigger === "update" && session) {
        console.log("JWT update trigger:", session)
        if (session.user?.name) token.name = session.user.name

        // Fetch updated user data from database
        try {
          const updatedUser = await prisma.user.findUnique({
            where: { email: token.email as string },
            select: { id: true, name: true, role: true },
          })

          if (updatedUser) {
            token.id = updatedUser.id
            token.name = updatedUser.name
            token.role = updatedUser.role
          }
        } catch (error) {
          console.error("Error fetching updated user data:", error)
        }
      }

      return token
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as "ADMIN" | "PASTOR" | "STAFF" | "MEMBER" | "CUSTOMER"
        session.user.name = token.name as string
        session.user.email = token.email as string
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  events: {
    async signOut(message) {
      console.log("User signed out:", message)
    },
  },
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
  secret: process.env.AUTH_SECRET,
})