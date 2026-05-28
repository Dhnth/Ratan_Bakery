// app/customer/orders/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  ShoppingBag,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  CreditCard,
  AlertCircle,
  Download,
  Eye,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

// Tipe data
type OrderDetail = {
  id: string;
  orderNumber: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  deliveryMethod: string;
  pickupDate: string;
  deliveryAddress: string | null;
  deliveryFee: number;
  paymentMethod: string;
  notes: string | null;
  paymentProofUrl: string | null;
  confirmedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
};

type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  priceAtTime: number;
  productImageUrl: string | null;
};

type StatusInfo = {
  label: string;
  color: string;
  icon: LucideIcon;
};

const statusConfig: Record<string, StatusInfo> = {
  WAITING_CONFIRMATION: { label: "Menunggu Konfirmasi", color: "bg-amber-100 text-amber-700", icon: Clock },
  ACCEPTED: { label: "Diterima", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  REJECTED: { label: "Ditolak", color: "bg-red-100 text-red-700", icon: XCircle },
  PROCESSING: { label: "Diproses", color: "bg-blue-100 text-blue-700", icon: Package },
  READY_FOR_PICKUP: { label: "Siap Diambil", color: "bg-teal-100 text-teal-700", icon: ShoppingBag },
  READY_FOR_DELIVERY: { label: "Siap Diantar", color: "bg-teal-100 text-teal-700", icon: Truck },
  COMPLETED: { label: "Selesai", color: "bg-green-100 text-green-700", icon: CheckCircle },
};

const paymentConfig: Record<string, { label: string; color: string }> = {
  PAID: { label: "LUNAS", color: "bg-emerald-100 text-emerald-700" },
  UNPAID: { label: "BELUM BAYAR", color: "bg-red-100 text-red-700" },
  WAITING_CONFIRMATION: { label: "MENUNGGU KONFIRMASI", color: "bg-amber-100 text-amber-700" },
  REJECTED: { label: "DITOLAK", color: "bg-gray-100 text-gray-700" },
};

export default function CustomerOrderDetailPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!orderId) return;
      
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        
        if (res.ok) {
          setOrder(data.order);
          setItems(data.items || []);
        } else if (res.status === 404) {
          setError("Pesanan tidak ditemukan");
        } else {
          setError(data.error || "Gagal memuat detail pesanan");
        }
      } catch (error) {
        console.error("Error fetching order detail:", error);
        setError("Terjadi kesalahan saat memuat data");
      } finally {
        setIsLoading(false);
      }
    };

    if (session && orderId) {
      fetchOrderDetail();
    }
  }, [orderId, session]);

  // Redirect if not authenticated
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [sessionStatus, router]);

  const formatRupiah = (amount: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleUploadProof = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("proof", file);
    
    try {
      const res = await fetch(`/api/orders/${orderId}/upload-proof`, {
        method: "POST",
        body: formData,
      });
      
      if (res.ok) {
        // Refresh data
        const refreshRes = await fetch(`/api/orders/${orderId}`);
        const data = await refreshRes.json();
        if (refreshRes.ok) {
          setOrder(data.order);
        }
        alert("Bukti transfer berhasil diupload!");
      } else {
        alert("Gagal upload bukti transfer");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Terjadi kesalahan saat upload");
    } finally {
      setIsUploading(false);
    }
  };

  if (sessionStatus === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-[#fff8f5] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#823b18] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fff8f5] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="font-serif text-2xl text-[#28180b] mb-2">Oops!</h2>
          <p className="text-[#54433c]">{error}</p>
          <Link
            href="/customer/orders"
            className="inline-block mt-4 bg-[#823b18] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-[#a0522d] transition-all"
          >
            Kembali ke Riwayat Pesanan
          </Link>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const statusInfo = statusConfig[order.orderStatus] || {
    label: order.orderStatus,
    color: "bg-gray-100 text-gray-700",
    icon: Clock,
  };
  const StatusIcon = statusInfo.icon;
  const paymentInfo = paymentConfig[order.paymentStatus] || {
    label: order.paymentStatus,
    color: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="min-h-screen bg-[#fff8f5] relative">
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 50%, rgba(130, 59, 24, 0.03) 0%, transparent 50%),
                              radial-gradient(circle at 75% 30%, rgba(130, 59, 24, 0.03) 0%, transparent 50%),
                              repeating-linear-gradient(45deg, rgba(130, 59, 24, 0.02) 0px, rgba(130, 59, 24, 0.02) 2px, transparent 2px, transparent 8px)`,
          }}
        />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#dac1b8]/10">
              <h2 className="font-serif text-xl text-[#28180b] mb-4">Status Pesanan</h2>
              <div className={`flex items-center gap-3 p-3 rounded-xl ${statusInfo.color} mb-4`}>
                <StatusIcon className="w-5 h-5" />
                <span className="font-semibold">{statusInfo.label}</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#54433c]">Dibuat:</span>
                  <span className="text-[#28180b]">{formatDate(order.createdAt)}</span>
                </div>
                {order.confirmedAt && (
                  <div className="flex justify-between">
                    <span className="text-[#54433c]">Dikonfirmasi:</span>
                    <span className="text-[#28180b]">{formatDate(order.confirmedAt)}</span>
                  </div>
                )}
                {order.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-[#54433c]">Selesai:</span>
                    <span className="text-[#28180b]">{formatDate(order.completedAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#dac1b8]/10 overflow-hidden">
              <div className="p-5 border-b border-[#dac1b8]/10">
                <h2 className="font-serif text-xl text-[#28180b]">Item Pesanan</h2>
              </div>
              <div className="divide-y divide-[#dac1b8]/10">
                {items.length === 0 ? (
                  <div className="p-8 text-center text-[#54433c]">
                    <Package className="w-12 h-12 mx-auto mb-3 text-[#dac1b8]" />
                    <p>Tidak ada item dalam pesanan ini</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="p-4 flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg bg-[#ffeadc] overflow-hidden relative shrink-0">
                        {item.productImageUrl ? (
                          <Image
                            src={item.productImageUrl}
                            alt={item.productName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-[#87736b]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#28180b]">{item.productName}</h3>
                        <p className="text-sm text-[#54433c]">
                          {item.quantity} x {formatRupiah(item.priceAtTime)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#823b18]">
                          {formatRupiah(item.quantity * item.priceAtTime)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Subtotal & Delivery Fee */}
              <div className="p-5 border-t border-[#dac1b8]/10 bg-[#fff8f5]">
                {order.deliveryFee > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[#54433c]">Ongkos Kirim</span>
                    <span className="text-[#28180b]">{formatRupiah(order.deliveryFee)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[#28180b]">Total Pembayaran</span>
                  <span className="font-serif text-2xl font-bold text-[#823b18]">
                    {formatRupiah(order.totalAmount)}
                  </span>
                </div>
                <p className="text-xs text-[#54433c] mt-2 text-right">
                  {order.deliveryFee > 0 ? "Sudah termasuk ongkos kirim" : "Ambil sendiri (gratis ongkir)"}
                </p>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#dac1b8]/10">
                <h2 className="font-serif text-xl text-[#28180b] mb-2">Catatan</h2>
                <p className="text-[#54433c]">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#dac1b8]/10">
              <h2 className="font-serif text-xl text-[#28180b] mb-3">Informasi Pelanggan</h2>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#823b18]" />
                  <span className="text-sm text-[#28180b]">{order.customerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#823b18]" />
                  <span className="text-sm text-[#28180b]">{order.customerPhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#823b18]" />
                  <span className="text-sm text-[#28180b]">{order.customerEmail}</span>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#dac1b8]/10">
              <h2 className="font-serif text-xl text-[#28180b] mb-3">Status Pembayaran</h2>
              <div className={`flex items-center gap-3 p-3 rounded-xl ${paymentInfo.color} mb-3`}>
                <CreditCard className="w-5 h-5" />
                <span className="font-semibold">{paymentInfo.label}</span>
              </div>
              <p className="text-sm text-[#54433c]">Metode: {order.paymentMethod}</p>
              
              {/* Bukti Transfer */}
              {order.paymentProofUrl && (
                <div className="mt-3 pt-3 border-t border-[#dac1b8]/10">
                  <p className="text-sm font-semibold text-[#28180b] mb-2">Bukti Transfer:</p>
                  <a
                    href={order.paymentProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[#823b18] text-sm hover:underline"
                  >
                    <Eye className="w-4 h-4" />
                    Lihat Bukti Transfer
                  </a>
                </div>
              )}
            </div>

            {/* Delivery Info */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#dac1b8]/10">
              <h2 className="font-serif text-xl text-[#28180b] mb-3">Informasi Pengiriman</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-[#823b18] mt-0.5" />
                  <div>
                    <p className="text-xs text-[#54433c]">Tanggal & Waktu Ambil</p>
                    <p className="text-sm font-medium text-[#28180b]">{formatDate(order.pickupDate)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  {order.deliveryMethod === "PICKUP" ? (
                    <ShoppingBag className="w-4 h-4 text-[#823b18] mt-0.5" />
                  ) : (
                    <Truck className="w-4 h-4 text-[#823b18] mt-0.5" />
                  )}
                  <div>
                    <p className="text-xs text-[#54433c]">Metode</p>
                    <p className="text-sm font-medium text-[#28180b]">
                      {order.deliveryMethod === "PICKUP" ? "Ambil Sendiri" : "Diantar"}
                    </p>
                  </div>
                </div>
                {order.deliveryAddress && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[#823b18] mt-0.5" />
                    <div>
                      <p className="text-xs text-[#54433c]">Alamat Pengiriman</p>
                      <p className="text-sm font-medium text-[#28180b]">{order.deliveryAddress}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Payment Proof Button */}
            {order.paymentStatus === "UNPAID" && order.orderStatus !== "REJECTED" && (
              <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <h2 className="font-serif text-lg text-amber-800">Upload Bukti Transfer</h2>
                </div>
                <p className="text-sm text-amber-700 mb-3">
                  Silakan upload bukti transfer untuk mengkonfirmasi pembayaran.
                </p>
                <button
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/jpeg,image/png,image/webp";
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (!file) return;
                      await handleUploadProof(file);
                    };
                    input.click();
                  }}
                  disabled={isUploading}
                  className="w-full bg-[#823b18] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#a0522d] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Mengupload...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Upload Bukti Transfer
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}