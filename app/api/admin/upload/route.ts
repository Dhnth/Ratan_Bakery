import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "Tidak ada file yang diupload" }, { status: 400 });
    }

    // Validasi tipe file
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Format file harus JPG, PNG, atau WEBP" }, { status: 400 });
    }

    // Validasi ukuran (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran file maksimal 2MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Buat nama file unik
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(file.name);
    const filename = `${timestamp}-${randomStr}${ext}`;
    
    // Path penyimpanan
    const uploadDir = path.join(process.cwd(), "public", "images", "products");
    
    // Buat folder jika belum ada
    await mkdir(uploadDir, { recursive: true });
    
    // Simpan file
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);
    
    // Return URL yang bisa diakses
    const imageUrl = `/images/products/${filename}`;
    
    return NextResponse.json({ success: true, url: imageUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Gagal upload gambar" }, { status: 500 });
  }
}