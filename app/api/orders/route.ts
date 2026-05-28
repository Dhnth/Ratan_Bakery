import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

type OrderRow = RowDataPacket & {
  id: string;
  orderNumber: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  deliveryMethod: string;
  pickupDate: string;
  createdAt: string;
};

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }
  
  try {
    const [rows] = await pool.execute<OrderRow[]>(
      `SELECT id, orderNumber, totalAmount, orderStatus, paymentStatus, deliveryMethod, pickupDate, createdAt
       FROM \`Order\`
       WHERE userId = ?
       ORDER BY createdAt DESC`,
      [session.user.id]
    );
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Gagal mengambil riwayat pesanan" }, { status: 500 });
  }
}