import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";

export async function GET() {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT id, name, stock, imageUrl FROM `Product` WHERE stock <= 5 AND isActive = 1 ORDER BY stock ASC LIMIT 5"
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching low stock:", error);
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}