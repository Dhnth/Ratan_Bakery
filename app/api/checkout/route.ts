// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

type CartItem = {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
};

type ProductStock = {
  stock: number;
  name: string;
} & RowDataPacket;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }
  
  const body = await request.json();
  const { pickupDate, pickupTime, deliveryMethod, deliveryAddress, notes, paymentMethod, paymentProofUrl, customerPhone, lat, lng } = body;
  
  // Ambil cart dari API cart
  const cartRes = await fetch(`${process.env.NEXTAUTH_URL}/api/cart`, {
    headers: {
      Cookie: request.headers.get("cookie") || "",
      "Content-Type": "application/json",
    },
  });
  const cartData = await cartRes.json();
  const cartItems: CartItem[] = cartData.items || [];
  
  if (cartItems.length === 0) {
    return NextResponse.json({ error: "Keranjang kosong" }, { status: 400 });
  }
  
  // Hitung subtotal
  const subtotal = cartItems.reduce((sum: number, item: CartItem) => sum + (item.price * item.quantity), 0);
  
  // Hitung ongkir
  let deliveryFee = 0;
  if (deliveryMethod === "DELIVERY") {
    const deliveryFeeRes = await fetch(`${process.env.NEXTAUTH_URL}/api/checkout/delivery-fee?lat=${lat || ""}&lng=${lng || ""}&address=${encodeURIComponent(deliveryAddress || "")}`);
    const deliveryFeeData = await deliveryFeeRes.json();
    deliveryFee = deliveryFeeData.deliveryFee || 5000;
  }
  
  const totalAmount = subtotal + deliveryFee;
  
  // Generate order number
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  const orderNumber = `INV/${dateStr}/${randomNum}`;
  
  // Gabungkan tanggal dan jam
  const fullPickupDate = new Date(`${pickupDate}T${pickupTime || "10:00"}:00`);
  
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  
  try {
    // Cek stok untuk setiap item sebelum checkout
    for (const item of cartItems) {
      const [rows] = await connection.execute<ProductStock[]>(
        `SELECT stock, name FROM Product WHERE id = ? FOR UPDATE`,
        [item.productId]
      );
      const product = rows[0];
      
      if (!product) {
        throw new Error(`Produk tidak ditemukan`);
      }
      
      if (product.stock < item.quantity) {
        throw new Error(`Stok ${product.name} tidak mencukupi. Tersisa: ${product.stock}`);
      }
    }
    
    // Kurangi stok untuk setiap item
    for (const item of cartItems) {
      await connection.execute<ResultSetHeader>(
        `UPDATE Product SET stock = stock - ? WHERE id = ?`,
        [item.quantity, item.productId]
      );
    }
    
    // Insert order
    const orderId = crypto.randomUUID();
    await connection.execute<ResultSetHeader>(
      `INSERT INTO \`Order\` 
       (id, orderNumber, userId, pickupDate, deliveryMethod, deliveryAddress, deliveryFee, totalAmount, paymentMethod, paymentStatus, orderStatus, notes, paymentProofUrl, paymentProofAttempts, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        orderId, orderNumber, session.user.id, fullPickupDate, deliveryMethod,
        deliveryAddress || null, deliveryFee, totalAmount, paymentMethod,
        paymentProofUrl ? "WAITING_CONFIRMATION" : "UNPAID", 
        "WAITING_CONFIRMATION", notes || null, paymentProofUrl || null, 0
      ]
    );
    
    // Insert order items
    for (const item of cartItems) {
      await connection.execute<ResultSetHeader>(
        `INSERT INTO \`OrderItem\` (id, orderId, productId, quantity, priceAtTime)
         VALUES (?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), orderId, item.productId, item.quantity, item.price]
      );
    }
    
    // Clear cart
    await fetch(`${process.env.NEXTAUTH_URL}/api/cart`, {
      method: "DELETE",
      headers: { Cookie: request.headers.get("cookie") || "" },
    });
    
    await connection.commit();
    connection.release();
    
    return NextResponse.json({
      success: true,
      orderId,
      orderNumber,
      totalAmount,
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error("Checkout error:", error);
    const errorMessage = error instanceof Error ? error.message : "Gagal memproses pesanan";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}