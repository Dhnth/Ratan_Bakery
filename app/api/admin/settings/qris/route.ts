// app/api/admin/settings/qris/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const formData = await request.formData();
    const file = formData.get("qris") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    
    // Check file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Format file tidak didukung. Gunakan JPG, PNG, atau WEBP." }, { status: 400 });
    }
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran file maksimal 2MB" }, { status: 400 });
    }
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split(".").pop();
    const filename = `qris_${timestamp}_${randomStr}.${ext}`;
    
    // Ensure directory exists
    const uploadDir = path.join(process.cwd(), "public/uploads/qris");
    await mkdir(uploadDir, { recursive: true });
    
    // Save file
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);
    
    const url = `/uploads/qris/${filename}`;
    
    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Gagal upload file" }, { status: 500 });
  }
}