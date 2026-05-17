import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { RowDataPacket, FieldPacket } from "mysql2";
import bcrypt from "bcryptjs";

type CustomerRow = RowDataPacket & {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
};

// GET all customers
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "all";

  try {
    let query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.address,
        u.isActive,
        u.createdAt,
        COUNT(o.id) as totalOrders,
        COALESCE(SUM(o.totalAmount), 0) as totalSpent,
        MAX(o.createdAt) as lastOrderDate
      FROM \`User\` u
      LEFT JOIN \`Order\` o ON u.id = o.userId
      WHERE u.role = 'CUSTOMER'
    `;
    const params: string[] = [];

    if (search) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status === "active") {
      query += ` AND u.isActive = 1`;
    } else if (status === "inactive") {
      query += ` AND u.isActive = 0`;
    }

    query += ` GROUP BY u.id ORDER BY u.createdAt DESC`;

    const [rows]: [CustomerRow[], FieldPacket[]] = await pool.execute<CustomerRow[]>(query, params);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "Gagal mengambil data pelanggan" }, { status: 500 });
  }
}

// PUT update customer status
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, isActive, name, phone, address } = body;

    if (!id) {
      return NextResponse.json({ error: "ID pelanggan wajib diisi" }, { status: 400 });
    }

    let query = "UPDATE `User` SET updatedAt = NOW()";
    const params: (string | number | boolean)[] = [];

    if (typeof isActive === "boolean") {
      query += ", isActive = ?";
      params.push(isActive ? 1 : 0);
    }

    if (name) {
      query += ", name = ?";
      params.push(name);
    }

    if (phone) {
      query += ", phone = ?";
      params.push(phone);
    }

    if (address !== undefined) {
      query += ", address = ?";
      params.push(address || null);
    }

    query += " WHERE id = ? AND role = 'CUSTOMER'";
    params.push(id);

    await pool.execute(query, params);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json({ error: "Gagal update pelanggan" }, { status: 500 });
  }
}

// DELETE customer (soft delete)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID pelanggan wajib diisi" }, { status: 400 });
    }

    await pool.execute(
      "UPDATE `User` SET isActive = 0, deletedAt = NOW(), updatedAt = NOW() WHERE id = ? AND role = 'CUSTOMER'",
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json({ error: "Gagal hapus pelanggan" }, { status: 500 });
  }
}