import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import type { NextAuthOptions } from "next-auth";

type UserRow = RowDataPacket & {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  isActive: number;
  deletedAt: Date | null;
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("=== AUTHORIZE CALLED ===");
        console.log("Email:", credentials?.email);
        console.log("Password:", credentials?.password);
        
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing email or password");
          throw new Error("Email dan password wajib diisi");
        }

        try {
          // Cek user di database
          const [rows] = await pool.execute<UserRow[]>(
            "SELECT * FROM `User` WHERE email = ? AND isActive = 1 AND deletedAt IS NULL",
            [credentials.email]
          );

          console.log("Query result rows:", rows.length);
          
          const user = rows[0];

          if (!user) {
            console.log("User not found for email:", credentials.email);
            throw new Error("Email tidak terdaftar");
          }

          console.log("User found:", user.email, "Role:", user.role);
          console.log("Stored password hash:", user.password);

          const isValid = await bcrypt.compare(credentials.password, user.password);
          console.log("Password valid:", isValid);

          if (!isValid) {
            console.log("Invalid password for user:", credentials.email);
            throw new Error("Password salah");
          }

          console.log("Login successful for:", credentials.email);
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error("Authorize error:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
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