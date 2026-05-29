// app/api/user/created-at/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

type UserRow = RowDataPacket & {
  createdAt: string;
};

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  try {
    const [rows] = await pool.execute<UserRow[]>(
      "SELECT createdAt FROM `User` WHERE id = ?",
      [session.user.id]
    );
    
    const user = rows[0];
    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ createdAt: user.createdAt });
  } catch (error) {
    console.error("Error fetching user created date:", error);
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}