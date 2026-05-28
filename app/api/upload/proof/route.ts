import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("proof") as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "Tidak ada file yang diupload" }, { status: 400 });
    }
    
    // Validasi file
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Format file harus JPG, PNG, atau WEBP" }, { status: 400 });
    }
    
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran file maksimal 2MB" }, { status: 400 });
    }
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(file.name);
    const filename = `proof_temp_${timestamp}_${randomStr}${ext}`;
    
    const uploadDir = path.join(process.cwd(), "public", "uploads", "proofs");
    await mkdir(uploadDir, { recursive: true });
    
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);
    
    const imageUrl = `/uploads/proofs/${filename}`;
    
    return NextResponse.json({
      success: true,
      message: "Bukti transfer berhasil diupload",
      url: imageUrl,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Gagal upload bukti transfer" }, { status: 500 });
  }
}