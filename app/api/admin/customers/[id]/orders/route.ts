import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { RowDataPacket, FieldPacket } from "mysql2";

type OrderRow = RowDataPacket & {
  id: string;
  orderNumber: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  pickupDate: string;
  createdAt: string;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [rows]: [OrderRow[], FieldPacket[]] = await pool.execute<OrderRow[]>(
      `SELECT id, orderNumber, totalAmount, orderStatus, paymentStatus, pickupDate, createdAt
       FROM \`Order\`
       WHERE userId = ?
       ORDER BY createdAt DESC
       LIMIT 20`,
      [id]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    return NextResponse.json({ error: "Gagal mengambil riwayat pesanan" }, { status: 500 });
  }
}