import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [rows] = await pool.execute("SELECT `key`, `value` FROM `Setting`");
    const settings = rows as { key: string; value: string }[];
    
    // Convert ke object key-value
    const settingsObj: Record<string, string> = {};
    settings.forEach((setting) => {
      settingsObj[setting.key] = setting.value;
    });
    
    return NextResponse.json(settingsObj);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data settings" },
      { status: 500 }
    );
  }
}