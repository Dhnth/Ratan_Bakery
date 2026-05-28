import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { RowDataPacket, FieldPacket } from "mysql2";

type SalesRow = RowDataPacket & {
  date: string;
  totalOrders: number;
  totalRevenue: number;
};

type TopProductRow = RowDataPacket & {
  productId: string;
  productName: string;
  totalSold: number;
  totalRevenue: number;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "week";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";

  try {
    let dateGroup = "";
    let dateFilter = "";

    // Tentukan range tanggal
    if (startDate && endDate) {
      dateFilter = `AND o.createdAt BETWEEN '${startDate} 00:00:00' AND '${endDate} 23:59:59'`;
      dateGroup = `DATE(o.createdAt)`;
    } else {
      switch (range) {
        case "week":
          dateFilter = `AND o.createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)`;
          dateGroup = `DATE(o.createdAt)`;
          break;
        case "month":
          dateFilter = `AND o.createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)`;
          dateGroup = `DATE(o.createdAt)`;
          break;
        case "year":
          dateFilter = `AND YEAR(o.createdAt) = YEAR(NOW())`;
          dateGroup = `DATE_FORMAT(o.createdAt, '%Y-%m')`;
          break;
        default:
          dateFilter = `AND o.createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)`;
          dateGroup = `DATE(o.createdAt)`;
      }
    }

    // 1. Total Pendapatan (hanya yang sudah lunas dan selesai)
    const [revenueRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COALESCE(SUM(o.totalAmount), 0) as total 
       FROM \`Order\` o
       WHERE o.paymentStatus = 'PAID' ${dateFilter}`
    );
    const totalRevenue = revenueRows[0]?.total || 0;

    // 2. Total Pesanan (semua kecuali ditolak)
    const [orderRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total 
       FROM \`Order\` o
       WHERE o.orderStatus != 'REJECTED' ${dateFilter}`
    );
    const totalOrders = orderRows[0]?.total || 0;

    // 3. Total Pelanggan unik
    const [customerRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT o.userId) as total 
       FROM \`Order\` o
       WHERE o.orderStatus != 'REJECTED' ${dateFilter}`
    );
    const totalCustomers = customerRows[0]?.total || 0;

    // 4. Rata-rata per Pesanan
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // 5. Penjualan per hari/bulan
    const [salesRows] = await pool.execute<SalesRow[]>(
      `SELECT 
         ${dateGroup} as date, 
         COUNT(*) as totalOrders, 
         COALESCE(SUM(o.totalAmount), 0) as totalRevenue
       FROM \`Order\` o
       WHERE o.paymentStatus = 'PAID' ${dateFilter}
       GROUP BY ${dateGroup}
       ORDER BY ${dateGroup} ASC`
    );

    // 6. Produk Terlaris
    const [topProducts] = await pool.execute<TopProductRow[]>(
      `SELECT 
         p.id as productId,
         p.name as productName,
         SUM(oi.quantity) as totalSold,
         SUM(oi.quantity * oi.priceAtTime) as totalRevenue
       FROM \`OrderItem\` oi
       INNER JOIN \`Product\` p ON oi.productId = p.id
       INNER JOIN \`Order\` o ON oi.orderId = o.id
       WHERE o.paymentStatus = 'PAID' ${dateFilter}
       GROUP BY p.id, p.name
       ORDER BY totalSold DESC
       LIMIT 5`
    );

    // 7. Status Pesanan
    const [statusRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
         o.orderStatus, 
         COUNT(*) as count 
       FROM \`Order\` o
       WHERE 1=1 ${dateFilter}
       GROUP BY o.orderStatus`
    );

    const orderStatusCount = {
      WAITING_CONFIRMATION: 0,
      ACCEPTED: 0,
      REJECTED: 0,
      PROCESSING: 0,
      READY_FOR_PICKUP: 0,
      READY_FOR_DELIVERY: 0,
      COMPLETED: 0,
    };

    statusRows.forEach((row) => {
      const status = row.orderStatus as keyof typeof orderStatusCount;
      if (orderStatusCount.hasOwnProperty(status)) {
        orderStatusCount[status] = row.count;
      }
    });

    // 8. Metode Pembayaran
    const [paymentRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
         o.paymentMethod, 
         COUNT(*) as count, 
         COALESCE(SUM(o.totalAmount), 0) as total 
       FROM \`Order\` o
       WHERE o.paymentStatus = 'PAID' ${dateFilter}
       GROUP BY o.paymentMethod`
    );

    console.log("Summary:", { totalRevenue, totalOrders, totalCustomers, avgOrderValue });
    console.log("Sales Data:", salesRows.length);
    console.log("Top Products:", topProducts.length);
    console.log("Status:", statusRows);
    console.log("Payment Methods:", paymentRows);

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        avgOrderValue,
      },
      salesData: salesRows,
      topProducts,
      orderStatus: orderStatusCount,
      paymentMethods: paymentRows,
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ error: "Gagal mengambil data laporan" }, { status: 500 });
  }
}