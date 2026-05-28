import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { RowDataPacket, FieldPacket } from "mysql2";

type OrderRow = RowDataPacket & {
  id: string;
  orderNumber: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  deliveryMethod: string;
  pickupDate: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string | null;
  createdAt: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  // 1. Ambil parameter sort dari query URL
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "DESC";

  try {
    let query = `
      SELECT o.id, o.orderNumber, o.totalAmount, o.orderStatus, o.paymentStatus,
             o.deliveryMethod, o.pickupDate, o.deliveryAddress, o.createdAt,
             u.name as customerName, u.phone as customerPhone
      FROM \`Order\` o
      JOIN \`User\` u ON o.userId = u.id
      WHERE 1=1
    `;
    const params: string[] = [];

    if (search) {
      query += ` AND (o.orderNumber LIKE ? OR u.name LIKE ? OR u.phone LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status && status !== "all") {
      query += ` AND o.orderStatus = ?`;
      params.push(status);
    }

    // 2. Validasi Kolom dan Arah Sort (Penting untuk mencegah SQL Injection!)
    const allowedColumns: Record<string, string> = {
      createdAt: "o.createdAt",
      totalAmount: "o.totalAmount",
      pickupDate: "o.pickupDate",
    };

    // Tentukan kolom SQL berdasarkan parameter sortBy, fallback ke o.createdAt jika tidak valid
    const orderColumn = allowedColumns[sortBy] || "o.createdAt";

    // Pastikan order direction hanya ASC atau DESC (case-insensitive)
    const orderDirection = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    // 3. Masukkan ke dalam Query secara dinamis
    query += ` ORDER BY ${orderColumn} ${orderDirection} LIMIT 50`;

    const [rows]: [OrderRow[], FieldPacket[]] = await pool.execute<OrderRow[]>(
      query,
      params,
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data pesanan" },
      { status: 500 },
    );
  }
}

// PUT update order status
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, orderStatus, paymentStatus } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID pesanan wajib diisi" },
        { status: 400 },
      );
    }

    let query = "UPDATE `Order` SET updatedAt = NOW()";
    const params: (string | number)[] = [];

    if (orderStatus) {
      query += ", orderStatus = ?";
      params.push(orderStatus);
    }
    if (paymentStatus) {
      query += ", paymentStatus = ?";
      params.push(paymentStatus);
      if (paymentStatus === "PAID") {
        query += ", confirmedAt = NOW()";
      }
    }

    query += " WHERE id = ?";
    params.push(id);

    await pool.execute(query, params);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Gagal update pesanan" },
      { status: 500 },
    );
  }
}
