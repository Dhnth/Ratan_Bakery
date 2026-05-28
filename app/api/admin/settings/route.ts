import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { RowDataPacket, FieldPacket } from "mysql2";

type SettingRow = RowDataPacket & {
  key: string;
  value: string;
  description: string | null;
};

// GET all settings
export async function GET() {
  try {
    const [rows]: [SettingRow[], FieldPacket[]] = await pool.execute<SettingRow[]>(
      "SELECT `key`, `value`, `description` FROM `Setting`"
    );
    
    const settingsObj: Record<string, string> = {};
    rows.forEach((setting) => {
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

// PUT update multiple settings
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const updates = body.settings || body;

    // Mulai transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      for (const [key, value] of Object.entries(updates)) {
        if (typeof value === "string" || typeof value === "number") {
          await connection.execute(
            "UPDATE `Setting` SET `value` = ?, updatedAt = NOW() WHERE `key` = ?",
            [String(value), key]
          );
        }
      }
      await connection.commit();
      connection.release();
      
      return NextResponse.json({ success: true });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Gagal update pengaturan" },
      { status: 500 }
    );
  }
}