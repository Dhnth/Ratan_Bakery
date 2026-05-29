// app/api/user/complete-profile/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

type UserRow = RowDataPacket & {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isProfileComplete: number;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, phone } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "Nama dan nomor WhatsApp wajib diisi" }, { status: 400 });
    }

    // Update user
    await pool.execute(
      "UPDATE `User` SET name = ?, phone = ?, isProfileComplete = 1 WHERE id = ?",
      [name, phone, session.user.id]
    );

    // Ambil data user yang sudah diupdate
    const [rows] = await pool.execute<UserRow[]>(
      "SELECT id, name, email, phone, role, isProfileComplete FROM `User` WHERE id = ?",
      [session.user.id]
    );
    
    const updatedUser = rows[0];
    
    if (!updatedUser) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        isProfileComplete: updatedUser.isProfileComplete === 1
      }
    });
  } catch (error) {
    console.error("Error completing profile:", error);
    return NextResponse.json({ error: "Gagal menyimpan data" }, { status: 500 });
  }
}