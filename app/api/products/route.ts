import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  try {
    let query = "";
    const values: string[] = [];

    if (type === "daily") {
      query = `
        SELECT * FROM Product 
        WHERE isActive = 1 
        AND name IN ('Roti Coklat', 'Roti Kopi', 'Pizza Mini', 'Pisang Coklat', 'Keju Kepang')
        ORDER BY createdAt ASC
      `;
    } else if (type === "special") {
      query = `
        SELECT * FROM Product 
        WHERE isActive = 1 
        AND name IN ('Berry Cheese', 'Roti John', 'Roti Tawar')
        ORDER BY price ASC
      `;
    } else {
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