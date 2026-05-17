import pool from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { RowDataPacket } from "mysql2";

type UserRow = RowDataPacket & {
  email: string;
  name: string;
};

export async function POST(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID pelanggan wajib diisi" }, { status: 400 });
    }

    // Generate random password (8 karakter)
    const newPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.execute(
      "UPDATE `User` SET password = ?, updatedAt = NOW() WHERE id = ? AND role = 'CUSTOMER'",
      [hashedPassword, id]
    );

    // Get customer email and name
    const [rows] = await pool.execute<UserRow[]>(
      "SELECT email, name FROM `User` WHERE id = ?",
      [id]
    );
    const customer = rows[0];

    return NextResponse.json({
      success: true,
      newPassword,
      email: customer?.email,
      name: customer?.name,
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json({ error: "Gagal reset password" }, { status: 500 });
  }
}