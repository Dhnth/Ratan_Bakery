import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

type CartItem = {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
};

// Keranjang sementara (untuk MVP, nanti bisa pindah ke database)
const carts: Record<string, CartItem[]> = {};

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ items: [] });
  }
  
  const userCart = carts[session.user.id] || [];
  return NextResponse.json({ items: userCart });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }
  
  const body = await request.json();
  const { productId, name, price, imageUrl, quantity }: CartItem & { quantity: number } = body;
  
  if (!productId || !name || !price || !quantity) {
    return NextResponse.json({ error: "Data produk tidak lengkap" }, { status: 400 });
  }
  
  if (!carts[session.user.id]) {
    carts[session.user.id] = [];
  }
  
  const existingItem = carts[session.user.id].find(item => item.productId === productId);
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    carts[session.user.id].push({
      productId,
      name,
      price,
      imageUrl: imageUrl || null,
      quantity,
    });
  }
  
  return NextResponse.json({ success: true, items: carts[session.user.id] });
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }
  
  const { productId, quantity } = await request.json();
  
  if (!carts[session.user.id]) {
    carts[session.user.id] = [];
  }
  
  const item = carts[session.user.id].find(item => item.productId === productId);
  
  if (item) {
    if (quantity <= 0) {
      carts[session.user.id] = carts[session.user.id].filter(item => item.productId !== productId);
    } else {
      item.quantity = quantity;
    }
  }
  
  return NextResponse.json({ success: true, items: carts[session.user.id] });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }
  
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  
  if (productId) {
    carts[session.user.id] = carts[session.user.id].filter(item => item.productId !== productId);
  } else {
    carts[session.user.id] = [];
  }
  
  return NextResponse.json({ success: true, items: carts[session.user.id] });
}