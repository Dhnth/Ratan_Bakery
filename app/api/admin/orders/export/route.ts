import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import ExcelJS from "exceljs";
import { RowDataPacket } from "mysql2";

// Warna sesuai tema Ratan Bakery
const colors = {
  primary: "#823b18",      // Terracotta utama
  primaryLight: "#a0522d", // Terracotta lebih terang
  secondary: "#496800",    // Sage green
  background: "#fff8f5",   // Background cream
  text: "#28180b",         // Dark brown
  textLight: "#54433c",    // Light brown
  success: "#10b981",      // Green untuk LUNAS
  warning: "#f59e0b",      // Orange untuk waiting
  error: "#ef4444",        // Red untuk unpaid/rejected
};

type OrderRow = RowDataPacket & {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  deliveryMethod: string;
  pickupDate: string;
  createdAt: string;
  confirmedAt: string | null;
  completedAt: string | null;
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const status = searchParams.get("status") || "all";

    let query = `
      SELECT 
        o.orderNumber,
        u.name as customerName,
        u.phone as customerPhone,
        o.totalAmount,
        o.orderStatus,
        o.paymentStatus,
        o.deliveryMethod,
        o.pickupDate,
        o.createdAt,
        o.confirmedAt,
        o.completedAt
      FROM \`Order\` o
      JOIN \`User\` u ON o.userId = u.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (status !== "all") {
      query += ` AND o.orderStatus = ?`;
      params.push(status);
    }

    if (startDate) {
      query += ` AND DATE(o.createdAt) >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND DATE(o.createdAt) <= ?`;
      params.push(endDate);
    }

    query += ` ORDER BY o.createdAt DESC`;

    const [rows] = await pool.execute<OrderRow[]>(query, params);
    const orders = rows;

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Ratan Bakery";
    workbook.lastModifiedBy = "Admin";
    workbook.created = new Date();
    workbook.modified = new Date();

    const worksheet = workbook.addWorksheet("Laporan Pesanan");

    // Define columns
    worksheet.columns = [
      { header: "No", key: "no", width: 8 },
      { header: "No. Pesanan", key: "orderNumber", width: 20 },
      { header: "Tanggal Pesan", key: "orderDate", width: 15 },
      { header: "Tanggal Ambil", key: "pickupDate", width: 15 },
      { header: "Pelanggan", key: "customerName", width: 25 },
      { header: "No. Telepon", key: "customerPhone", width: 18 },
      { header: "Metode", key: "deliveryMethod", width: 12 },
      { header: "Total", key: "totalAmount", width: 15 },
      { header: "Status Pesanan", key: "orderStatus", width: 18 },
      { header: "Status Bayar", key: "paymentStatus", width: 18 },
      { header: "Tgl. Konfirmasi", key: "confirmedAt", width: 15 },
      { header: "Tgl. Selesai", key: "completedAt", width: 15 },
    ];

    // Style Header
    const headerRow = worksheet.getRow(1);
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
        size: 11,
        name: "Calibri",
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: colors.primary.replace("#", "FF") },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      };
    });

    // Format helper functions
    const formatDate = (date: Date | string | null): string => {
      if (!date) return "-";
      const d = new Date(date);
      return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    };

    const formatDateTime = (date: Date | string | null): string => {
      if (!date) return "-";
      const d = new Date(date);
      return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const formatRupiah = (amount: number): string => {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(amount);
    };

    const getMethodText = (method: string): string => {
      return method === "PICKUP" ? "Ambil Sendiri" : "Diantar";
    };

    const getOrderStatusText = (status: string): string => {
      const map: Record<string, string> = {
        WAITING_CONFIRMATION: "Menunggu Konfirmasi",
        ACCEPTED: "Diterima",
        REJECTED: "Ditolak",
        PROCESSING: "Diproses",
        READY_FOR_PICKUP: "Siap Diambil",
        READY_FOR_DELIVERY: "Siap Diantar",
        COMPLETED: "Selesai",
      };
      return map[status] || status;
    };

    const getPaymentStatusText = (status: string): string => {
      const map: Record<string, string> = {
        PAID: "LUNAS",
        UNPAID: "BELUM BAYAR",
        WAITING_CONFIRMATION: "MENUNGGU KONFIRMASI",
        REJECTED: "DITOLAK",
      };
      return map[status] || status;
    };

    const getOrderStatusColor = (status: string): string => {
      const map: Record<string, string> = {
        WAITING_CONFIRMATION: "FFF59E0B", // Orange
        ACCEPTED: "FF10B981", // Green
        REJECTED: "FFEF4444", // Red
        PROCESSING: "FF3B82F6", // Blue
        READY_FOR_PICKUP: "FF8B5CF6", // Purple
        READY_FOR_DELIVERY: "FF8B5CF6", // Purple
        COMPLETED: "FF059669", // Dark Green
      };
      return map[status] || "FF6B7280";
    };

    const getPaymentStatusColor = (status: string): string => {
      const map: Record<string, string> = {
        PAID: "FF059669", // Dark Green
        UNPAID: "FFEF4444", // Red
        WAITING_CONFIRMATION: "FFF59E0B", // Orange
        REJECTED: "FF6B7280", // Gray
      };
      return map[status] || "FF6B7280";
    };

    // Fill data
    orders.forEach((order: OrderRow, index: number) => {
      const row = worksheet.addRow({
        no: index + 1,
        orderNumber: order.orderNumber,
        orderDate: formatDateTime(order.createdAt),
        pickupDate: formatDate(order.pickupDate),
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        deliveryMethod: getMethodText(order.deliveryMethod),
        totalAmount: formatRupiah(order.totalAmount),
        orderStatus: getOrderStatusText(order.orderStatus),
        paymentStatus: getPaymentStatusText(order.paymentStatus),
        confirmedAt: formatDateTime(order.confirmedAt),
        completedAt: formatDateTime(order.completedAt),
      });

      row.height = 22;
      row.eachCell((cell, colNumber) => {
        cell.alignment = { vertical: "middle" };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE0E0E0" } },
          left: { style: "thin", color: { argb: "FFE0E0E0" } },
          bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
          right: { style: "thin", color: { argb: "FFE0E0E0" } },
        };

        // Color untuk Status Pesanan (colNumber = 9)
        if (colNumber === 9) {
          cell.font = {
            color: { argb: getOrderStatusColor(order.orderStatus) },
            bold: true,
            size: 10,
          };
        }

        // Color untuk Status Bayar (colNumber = 10)
        if (colNumber === 10) {
          cell.font = {
            color: { argb: getPaymentStatusColor(order.paymentStatus) },
            bold: true,
            size: 10,
          };
        }

        // Total amount (colNumber = 8)
        if (colNumber === 8) {
          cell.font = { bold: true, color: { argb: colors.primary.replace("#", "FF") } };
        }
      });
    });

    // Add empty row
    worksheet.addRow([]);

    // Add summary row
    const summaryRow = worksheet.addRow({
      orderNumber: `Total Data: ${orders.length} pesanan`,
    });
    summaryRow.getCell(1).font = { bold: true, size: 11, color: { argb: colors.secondary.replace("#", "FF") } };
    summaryRow.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF5F5F5" },
    };

    // Merge summary row
    worksheet.mergeCells(`A${worksheet.rowCount}:L${worksheet.rowCount}`);

    // Auto filter on header row
    worksheet.autoFilter = `A1:L1`;

    // Set column alignment
    worksheet.getColumn("orderDate").alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getColumn("pickupDate").alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getColumn("deliveryMethod").alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getColumn("totalAmount").alignment = { horizontal: "right", vertical: "middle" };
    worksheet.getColumn("orderStatus").alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getColumn("paymentStatus").alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getColumn("confirmedAt").alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getColumn("completedAt").alignment = { horizontal: "center", vertical: "middle" };

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    const fileName = `laporan_pesanan_${new Date().toISOString().split("T")[0]}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      },
    });
  } catch (error) {
    console.error("Export API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}