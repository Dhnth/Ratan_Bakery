import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { RowDataPacket, FieldPacket } from "mysql2";

type ProductRow = RowDataPacket & {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  maxPerOrder: number;
  category: string;
  createdAt: Date;
  updatedAt: Date;
};

// GET semua produk
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";

  try {
    let query = "SELECT * FROM `Product`";
    let params: string[] = [];

    if (search) {
      query += " WHERE name LIKE ? OR description LIKE ?";
      params = [`%${search}%`, `%${search}%`];
    }

    query += " ORDER BY createdAt DESC";

    const [rows]: [ProductRow[], FieldPacket[]] = await pool.execute<ProductRow[]>(query, params);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Gagal mengambil data produk" }, { status: 500 });
  }
}

// POST tambah produk
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, price, stock, imageUrl, maxPerOrder, isActive, category } = body;

    if (!name || !price) {
      return NextResponse.json({ error: "Nama dan harga wajib diisi" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const createdAt = new Date();
    const updatedAt = new Date();

    await pool.execute(
      `INSERT INTO \`Product\` (id, name, description, price, stock, imageUrl, isActive, maxPerOrder, category, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, description || null, price, stock || 0, imageUrl || null, isActive ? 1 : 0, maxPerOrder || 10, category || "daily", createdAt, updatedAt]
    );

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Gagal menambah produk" }, { status: 500 });
  }
}

// PUT update produk
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, price, stock, imageUrl, isActive, maxPerOrder, category } = body;

    if (!id || !name || !price) {
      return NextResponse.json({ error: "ID, nama dan harga wajib diisi" }, { status: 400 });
    }

    const updatedAt = new Date();

    await pool.execute(
      `UPDATE \`Product\` 
       SET name = ?, description = ?, price = ?, stock = ?, imageUrl = ?, isActive = ?, maxPerOrder = ?, category = ?, updatedAt = ?
       WHERE id = ?`,
      [name, description || null, price, stock || 0, imageUrl || null, isActive ? 1 : 0, maxPerOrder || 10, category || "daily", updatedAt, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Gagal update produk" }, { status: 500 });
  }
}

// DELETE hapus produk
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID produk wajib diisi" }, { status: 400 });
    }

    await pool.execute("DELETE FROM `Product` WHERE id = ?", [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Gagal hapus produk" }, { status: 500 });
  }
}