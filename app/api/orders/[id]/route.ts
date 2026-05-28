// app/api/orders/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import pool from "@/lib/db";
import { RowDataPacket, FieldPacket } from "mysql2";

type OrderDetailRow = RowDataPacket & {
  id: string;
  orderNumber: string;
  userId: string;
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
  customerName: string;
  customerPhone: string;
  customerEmail: string;
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
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { id } = await params;
  
  try {
    // Get order details with customer info from User table
    const [orderRows]: [OrderDetailRow[], FieldPacket[]] = await pool.execute<OrderDetailRow[]>(
      `SELECT o.*, 
              u.name as customerName, 
              u.phone as customerPhone, 
              u.email as customerEmail
       FROM \`Order\` o
       JOIN \`User\` u ON o.userId = u.id
       WHERE o.id = ? AND o.userId = ?`,
      [id, session.user.id]
    );
    
    if (orderRows.length === 0) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }
    
    const order = orderRows[0];
    
    // Get order items with product info
    const [itemsRows]: [OrderItemRow[], FieldPacket[]] = await pool.execute<OrderItemRow[]>(
      `SELECT oi.*, 
              p.name as productName, 
              p.imageUrl as productImageUrl
       FROM \`OrderItem\` oi
       JOIN \`Product\` p ON oi.productId = p.id
       WHERE oi.orderId = ?`,
      [id]
    );
    
    return NextResponse.json({ order, items: itemsRows });
  } catch (error) {
    console.error("Error fetching order detail:", error);
    return NextResponse.json(
      { error: "Gagal mengambil detail pesanan" },
      { status: 500 }
    );
  }
}