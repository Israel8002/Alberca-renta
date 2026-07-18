import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

/**
 * Scopes needed so the app can create/update/delete events on the
 * administrator's Google Calendar.
 */
export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar",
].join(" ");

const allowDevLogin = process.env.ALLOW_DEV_LOGIN === "true";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                scope: GOOGLE_SCOPES,
                access_type: "offline",
                prompt: "consent",
              },
            },
          }),
        ]
      : []),
    // Local/offline login so the app can be used and tested without Google
    // credentials. Disabled unless ALLOW_DEV_LOGIN=true.
    ...(allowDevLogin
      ? [
          Credentials({
            name: "Acceso local",
            credentials: {
              email: { label: "Email", type: "email" },
            },
            async authorize(credentials) {
              const email =
                (credentials?.email as string) || "admin@local.dev";
              const user = await prisma.user.upsert({
                where: { email },
                update: {},
                create: { email, name: "Administrador", role: "ADMIN" },
              });
              return { id: user.id, name: user.name, email: user.email };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
