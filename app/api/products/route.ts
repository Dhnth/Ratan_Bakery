import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  try {
    let query = "";
    const values: string[] = [];

    if (type === "daily") {
      // Ambil semua produk dengan category = 'daily' dan isActive = 1
      query = `
        SELECT * FROM Product 
        WHERE isActive = 1 
        AND category = 'daily'
        ORDER BY createdAt ASC
      `;
    } else if (type === "special") {
      // Ambil semua produk dengan category = 'special' dan isActive = 1
      query = `
        SELECT * FROM Product 
        WHERE isActive = 1 
        AND category = 'special'
        ORDER BY price ASC
      `;
    } else {
      // Ambil semua produk aktif
      query = `
        SELECT * FROM Product 
        WHERE isActive = 1 
        ORDER BY createdAt ASC
      `;
    }

    const [rows] = await pool.execute(query, values);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data produk" },
      { status: 500 }
    );
  }
}