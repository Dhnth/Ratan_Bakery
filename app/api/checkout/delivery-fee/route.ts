import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

type SettingRow = RowDataPacket & {
  value: string;
};

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const address = searchParams.get("address") || "";

  if (!lat || !lng) {
    return NextResponse.json({ error: "Lokasi tidak ditemukan" }, { status: 400 });
  }

  try {
    // Ambil setting toko dari database - gunakan backtick untuk kolom 'key'
    const [radiusRows] = await pool.execute<SettingRow[]>(
      "SELECT value FROM `Setting` WHERE `key` = 'delivery_radius_km'"
    );
    const [feeWithinRows] = await pool.execute<SettingRow[]>(
      "SELECT value FROM `Setting` WHERE `key` = 'delivery_fee_within_radius'"
    );
    const [feeOutsideRows] = await pool.execute<SettingRow[]>(
      "SELECT value FROM `Setting` WHERE `key` = 'delivery_fee_outside_radius'"
    );
    const [storeLatRows] = await pool.execute<SettingRow[]>(
      "SELECT value FROM `Setting` WHERE `key` = 'store_latitude'"
    );
    const [storeLngRows] = await pool.execute<SettingRow[]>(
      "SELECT value FROM `Setting` WHERE `key` = 'store_longitude'"
    );
    const [storeAddressRows] = await pool.execute<SettingRow[]>(
      "SELECT value FROM `Setting` WHERE `key` = 'store_address'"
    );

    const DELIVERY_RADIUS_KM = parseFloat(radiusRows[0]?.value || "10");
    const DELIVERY_FEE_WITHIN = parseInt(feeWithinRows[0]?.value || "5000");
    const DELIVERY_FEE_OUTSIDE = parseInt(feeOutsideRows[0]?.value || "10000");
    const STORE_LAT = parseFloat(storeLatRows[0]?.value || "-7.3886");
    const STORE_LNG = parseFloat(storeLngRows[0]?.value || "108.5431");
    const STORE_ADDRESS = storeAddressRows[0]?.value || "Kujangsari, Kec. Langensari, Kota Banjar, Jawa Barat 46324";

    const customerLat = parseFloat(lat);
    const customerLng = parseFloat(lng);

    // Hitung jarak menggunakan Haversine formula
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(customerLat - STORE_LAT);
    const dLon = toRad(customerLng - STORE_LNG);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(STORE_LAT)) * Math.cos(toRad(customerLat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Cek apakah di luar Banjar (detection sederhana berdasarkan koordinat)
    // Banjar bounds: lat -7.5 to -7.3, lng 108.4 to 108.7
    const isOutsideBanjar = customerLat < -7.5 || customerLat > -7.3 || customerLng < 108.4 || customerLng > 108.7;
    
    let deliveryFee = 0;
    let canDeliver = true;
    let message = "";
    let isWithinRadius = true;

    if (isOutsideBanjar) {
      canDeliver = false;
      message = "Mohon maaf, lokasi Anda di luar Kota Banjar. Silakan hubungi admin untuk informasi lebih lanjut.";
    } else if (distance <= DELIVERY_RADIUS_KM) {
      deliveryFee = DELIVERY_FEE_WITHIN;
      isWithinRadius = true;
      message = `Dalam radius ${DELIVERY_RADIUS_KM}km (jarak ${distance.toFixed(1)}km) → Ongkir ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(deliveryFee)}`;
    } else {
      deliveryFee = DELIVERY_FEE_OUTSIDE;
      isWithinRadius = false;
      message = `Luar radius ${DELIVERY_RADIUS_KM}km (jarak ${distance.toFixed(1)}km) → Ongkir ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(deliveryFee)}`;
    }

    return NextResponse.json({
      success: true,
      distance: distance.toFixed(1),
      deliveryFee,
      isWithinRadius,
      canDeliver,
      message,
      storeLocation: { lat: STORE_LAT, lng: STORE_LNG, address: STORE_ADDRESS },
      customerLocation: { lat: customerLat, lng: customerLng, address },
    });
  } catch (error) {
    console.error("Error calculating delivery fee:", error);
    return NextResponse.json({ error: "Gagal menghitung ongkir" }, { status: 500 });
  }
}