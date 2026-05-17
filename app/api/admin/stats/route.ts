import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";

export async function GET() {
  try {
    // Total orders
    const [totalOrdersRows] = await pool.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM `Order`"
    );
    const totalOrders = totalOrdersRows[0].count;

    // Total revenue (dari order yang sudah ACCEPTED atau PAID)
    const [revenueRows] = await pool.execute<RowDataPacket[]>(
      "SELECT SUM(totalAmount) as total FROM `Order` WHERE orderStatus IN ('ACCEPTED', 'PROCESSING', 'READY_FOR_PICKUP', 'READY_FOR_DELIVERY', 'COMPLETED')"
    );
    const revenue = revenueRows[0].total || 0;

    // Active products
    const [activeProductsRows] = await pool.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM `Product` WHERE isActive = 1"
    );
    const activeProducts = activeProductsRows[0].count;

    // Pending payments (WAITING_CONFIRMATION)
    const [pendingPaymentsRows] = await pool.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM `Order` WHERE paymentStatus = 'WAITING_CONFIRMATION'"
    );
    const pendingPayments = pendingPaymentsRows[0].count;

    return NextResponse.json({
      totalOrders,
      revenue,
      activeProducts,
      pendingPayments,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}