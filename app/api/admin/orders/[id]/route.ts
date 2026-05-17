import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { RowDataPacket, FieldPacket } from "mysql2";

type OrderDetailRow = RowDataPacket & {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string | null;
  pickupDate: string;
  deliveryMethod: string;
  deliveryAddress: string | null;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  paymentProofUrl: string | null;
  paymentProofAttempts: number;
  rejectionReason: string | null;
  notes: string | null;
  confirmedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type OrderItemRow = RowDataPacket & {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  priceAtTime: number;
  productImageUrl: string | null;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Get order details with customer address
    const [orderRows]: [OrderDetailRow[], FieldPacket[]] = await pool.execute<OrderDetailRow[]>(
      `SELECT o.*, 
              u.name as customerName, 
              u.phone as customerPhone, 
              u.email as customerEmail, 
              u.address as customerAddress
       FROM \`Order\` o
       JOIN \`User\` u ON o.userId = u.id
       WHERE o.id = ?`,
      [id]
    );

    if (orderRows.length === 0) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    const order = orderRows[0];

    // Get order items
    const [itemsRows]: [OrderItemRow[], FieldPacket[]] = await pool.execute<OrderItemRow[]>(
      `SELECT oi.*, p.name as productName, p.imageUrl as productImageUrl
       FROM \`OrderItem\` oi
       JOIN \`Product\` p ON oi.productId = p.id
       WHERE oi.orderId = ?`,
      [id]
    );

    return NextResponse.json({ order, items: itemsRows });
  } catch (error) {
    console.error("Error fetching order detail:", error);
    return NextResponse.json({ error: "Gagal mengambil detail pesanan" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { orderStatus, paymentStatus, rejectionReason } = body;

  try {
    let query = "UPDATE `Order` SET updatedAt = NOW()";
    const updateParams: (string | number | null)[] = [];

    if (orderStatus) {
      query += ", orderStatus = ?";
      updateParams.push(orderStatus);
      
      if (orderStatus === "COMPLETED") {
        query += ", completedAt = NOW()";
      }
      if (orderStatus === "REJECTED") {
        query += ", rejectionReason = ?";
        updateParams.push(rejectionReason || null);
      }
    }

    if (paymentStatus) {
      query += ", paymentStatus = ?";
      updateParams.push(paymentStatus);
      
      if (paymentStatus === "PAID") {
        query += ", confirmedAt = NOW()";
      }
    }

    query += " WHERE id = ?";
    updateParams.push(id);

    await pool.execute(query, updateParams);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json({ error: "Gagal update pesanan" }, { status: 500 });
  }
}