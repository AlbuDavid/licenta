import type { NextAuthOptions, User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

// Extend NextAuth types to include role and id on token and session
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: "USER" | "ADMIN";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "USER" | "ADMIN";
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
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
      async authorize(credentials): Promise<NextAuthUser | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email și parola sunt obligatorii.");
        }

        // Rate limit: 10 login attempts per email per 15 minutes
        const rl = rateLimit(`login:${credentials.email}`, { maxRequests: 10, windowMs: 15 * 60 * 1000 });
        if (!rl.allowed) {
          throw new Error("Prea multe încercări de conectare. Reîncearcă mai târziu.");
        }

        try {
          const user = await db.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user || !user.password) {
            throw new Error("Email sau parolă incorectă.");
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!passwordMatch) {
            throw new Error("Email sau parolă incorectă.");
          }

          if (!user.emailVerified) {
            throw new Error(
              "Adresa de email nu a fost verificată. Verifică-ți inbox-ul."
            );
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          };
        } catch (error) {
          // Re-throw known errors; log unknown ones
          if (error instanceof Error) {
            throw error;
          }
          console.error("[authorize]", error);
          throw new Error("A apărut o eroare la autentificare.");
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      // Credentials flow is handled by the authorize function above
      if (account?.provider === "credentials") {
        return true;
      }

      // Google OAuth: find-or-create user and link account
      if (account?.provider === "google" && user.email) {
        try {
          let dbUser = await db.user.findUnique({
            where: { email: user.email },
          });

          if (!dbUser) {
            // First-time Google sign-in — create user (auto-verified)
            dbUser = await db.user.create({
              data: {
                email: user.email,
                name: user.name ?? null,
                image: user.image ?? null,
                emailVerified: new Date(),
              },
            });
          } else if (!dbUser.emailVerified) {
            // Existing user who hasn't verified email — Google verifies it
            await db.user.update({
              where: { id: dbUser.id },
              data: { emailVerified: new Date() },
            });
          }

          // Link Google account if not already linked
          const existingAccount = await db.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
          });

          if (!existingAccount) {
            await db.account.create({
              data: {
                userId: dbUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token as string | undefined,
                refresh_token: account.refresh_token as string | undefined,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token as string | undefined,
              },
            });
          }

          // Ensure the jwt callback receives the DB user ID
          user.id = dbUser.id;

          return true;
        } catch (error) {
          console.error("[Google signIn]", error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        try {
          // Look up by ID (works for credentials and linked OAuth)
          let dbUser = await db.user.findUnique({
            where: { id: user.id },
            select: { id: true, role: true },
          });

          // Fallback: find by email if ID doesn't match a DB record
          if (!dbUser && user.email) {
            dbUser = await db.user.findUnique({
              where: { email: user.email },
              select: { id: true, role: true },
            });
          }

          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
          }
        } catch (error) {
          console.error("[jwt callback]", error);
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
};
