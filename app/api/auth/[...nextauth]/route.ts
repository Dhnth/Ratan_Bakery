// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import type { NextAuthOptions } from "next-auth";

type UserRow = RowDataPacket & {
  id: string;
  email: string;
  password: string | null;
  name: string;
  phone: string;
  role: string;
  isActive: number;
  isProfileComplete: number;
  deletedAt: Date | null;
};

export const authOptions: NextAuthOptions = {
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
          throw new Error("Email dan password wajib diisi");
        }

        try {
          const [rows] = await pool.execute<UserRow[]>(
            "SELECT * FROM `User` WHERE email = ? AND isActive = 1 AND deletedAt IS NULL",
            [credentials.email],
          );

          const user = rows[0];

          if (!user) {
            throw new Error("Email tidak terdaftar");
          }

          if (!user.password) {
            throw new Error(
              "Akun ini menggunakan Google Login. Silakan login dengan Google.",
            );
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password,
          );
          if (!isValid) {
            throw new Error("Password salah");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            role: user.role,
            isProfileComplete: user.isProfileComplete === 1,
          };
        } catch (error) {
          console.error("Authorize error:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const email = user.email;
          if (!email) {
            return false;
          }

          const [rows] = await pool.execute<UserRow[]>(
            "SELECT id, isProfileComplete, name, phone FROM `User` WHERE email = ?",
            [email],
          );

          const existingUser = rows[0];

          if (existingUser) {
            user.id = existingUser.id;
            user.isProfileComplete = existingUser.isProfileComplete === 1;
            user.name = existingUser.name || user.name;
            user.phone = existingUser.phone || "";
          } else {
            const userId = crypto.randomUUID();
            const userName = user.name || "";
            await pool.execute(
              `INSERT INTO \`User\` (id, email, name, phone, role, isActive, isProfileComplete, createdAt, updatedAt) 
               VALUES (?, ?, ?, '', 'CUSTOMER', 1, 0, NOW(), NOW())`,
              [userId, email, userName],
            );

            user.id = userId;
            user.isProfileComplete = false;
          }
        } catch (error) {
          console.error("Google signIn error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      // Saat login pertama
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isProfileComplete = user.isProfileComplete;
        token.name = user.name;
        token.phone = user.phone;
      }

      // Saat update() dipanggil - ambil data langsung dari database
      if (trigger === "update" && token.id) {
        try {
          const [rows] = await pool.execute<UserRow[]>(
            "SELECT name, phone, isProfileComplete FROM `User` WHERE id = ?",
            [token.id]
          );
          
          if (rows[0]) {
            token.isProfileComplete = rows[0].isProfileComplete === 1;
            token.name = rows[0].name;
            token.phone = rows[0].phone;
          }
        } catch (error) {
          console.error("Error refreshing token:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.isProfileComplete = token.isProfileComplete as boolean;
        session.user.name = (token.name as string) || session.user.name;
        session.user.phone = token.phone as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };