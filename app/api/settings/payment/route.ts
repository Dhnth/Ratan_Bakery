// app/api/settings/payment/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, FieldPacket } from "mysql2";

type SettingRow = RowDataPacket & {
  key: string;
  value: string;
};

type BankAccount = {
  id: string;
  name: string;
  accountNumber: string;
  holderName: string;
  isActive: boolean;
};

type EwalletAccount = {
  id: string;
  name: string;
  accountNumber: string;
  holderName: string;
  isActive: boolean;
};

export async function GET() {
  try {
    const [rows]: [SettingRow[], FieldPacket[]] = await pool.execute<SettingRow[]>(
      "SELECT `key`, `value` FROM `Setting` WHERE `key` IN ('bank_accounts', 'ewallet_accounts', 'qris_enabled', 'qris_image_url')"
    );
    
    let bankAccounts: BankAccount[] = [];
    let ewalletAccounts: EwalletAccount[] = [];
    let qrisEnabled = "false";
    let qrisImageUrl = "";
    
    for (const setting of rows) {
      if (setting.key === "bank_accounts" && setting.value) {
        try {
          bankAccounts = JSON.parse(setting.value) as BankAccount[];
        } catch (e) {
          console.error("Error parsing bank_accounts:", e);
        }
      }
      if (setting.key === "ewallet_accounts" && setting.value) {
        try {
          ewalletAccounts = JSON.parse(setting.value) as EwalletAccount[];
        } catch (e) {
          console.error("Error parsing ewallet_accounts:", e);
        }
      }
      if (setting.key === "qris_enabled") {
        qrisEnabled = setting.value;
      }
      if (setting.key === "qris_image_url") {
        qrisImageUrl = setting.value;
      }
    }
    
    return NextResponse.json({
      bankAccounts,
      ewalletAccounts,
      qrisEnabled,
      qrisImageUrl,
    });
  } catch (error) {
    console.error("Error fetching payment settings:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data pembayaran" },
      { status: 500 }
    );
  }
}