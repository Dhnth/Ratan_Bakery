import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function POST(req: Request) {
  try {
    const { name, email, phone, password } = await req.json();

    // Validasi
    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    // Cek email sudah terdaftar
    const [existing] = await pool.execute<RowDataPacket[]>(
      "SELECT id FROM `User` WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat user baru
    const userId = crypto.randomUUID();
    await pool.execute(
      `INSERT INTO \`User\` (id, email, password, name, phone, role, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, 'CUSTOMER', 1, NOW(), NOW())`,
      [userId, email, hashedPassword, name, phone]
    );

    return NextResponse.json(
      { message: "Registrasi berhasil", userId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}