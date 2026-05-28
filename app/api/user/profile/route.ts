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
  address: string | null;
};

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  try {
    const [rows] = await pool.execute<UserRow[]>(
      "SELECT id, name, email, phone, address FROM `User` WHERE id = ?",
      [session.user.id]
    );
    
    const user = rows[0];
    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    // Format nomor telepon jika perlu
    let phone = user.phone;
    if (phone && !phone.startsWith("+62") && !phone.startsWith("0")) {
      phone = `0${phone}`;
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: phone || "",
      address: user.address || "",
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: "Gagal mengambil profil" }, { status: 500 });
  }
}