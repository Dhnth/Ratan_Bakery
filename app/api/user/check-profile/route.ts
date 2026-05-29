// app/api/user/check-profile/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

type UserRow = RowDataPacket & {
  isProfileComplete: number;
};

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [rows] = await pool.execute<UserRow[]>(
      "SELECT isProfileComplete FROM `User` WHERE id = ?",
      [session.user.id]
    );
    
    const user = rows[0];
    const isProfileComplete = user?.isProfileComplete === 1;

    return NextResponse.json({ isProfileComplete });
  } catch (error) {
    console.error("Error checking profile:", error);
    return NextResponse.json({ error: "Gagal cek profil" }, { status: 500 });
  }
}