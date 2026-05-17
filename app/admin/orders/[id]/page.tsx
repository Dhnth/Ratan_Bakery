"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Truck,
  ShoppingBag,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Banknote,
  RefreshCw,
  AlertCircle,
  Eye,
} from "lucide-react";

type OrderDetail = {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string | null;
  pickupDate: string;
  deliveryMethod: string;
  deliveryAddress: string | null;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  paymentProofUrl: string | null;
  paymentProofAttempts: number;
  rejectionReason: string | null;
  notes: string | null;
  confirmedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  priceAtTime: number;
  productImageUrl: string | null;
};

const statusConfig: Record<
  string,
  { label: string; color: string; icon: typeof Clock }
> = {
  WAITING_CONFIRMATION: {
    label: "Menunggu Konfirmasi",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    icon: Clock,
  },
  ACCEPTED: {
    label: "Diterima",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: CheckCircle,
  },
  REJECTED: {
    label: "Ditolak",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
  PROCESSING: {
    label: "Diproses",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Package,
  },
  READY_FOR_PICKUP: {
    label: "Siap Diambil",
    color: "bg-teal-100 text-teal-800 border-teal-200",
    icon: CheckCircle,
  },
  READY_FOR_DELIVERY: {
    label: "Siap Diantar",
    color: "bg-teal-100 text-teal-800 border-teal-200",
    icon: Truck,
  },
  COMPLETED: {
    label: "Selesai",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
};

const paymentConfig: Record<string, { label: string; color: string }> = {
  PAID: { label: "LUNAS", color: "bg-emerald-100 text-emerald-800" },
  UNPAID: { label: "BELUM BAYAR", color: "bg-red-100 text-red-800" },
  WAITING_CONFIRMATION: {
    label: "MENUNGGU KONFIRMASI",
    color: "bg-amber-100 text-amber-800",
  },
  REJECTED: { label: "DITOLAK", color: "bg-gray-100 text-gray-700" },
};

const showToast = (message: string, type: "success" | "error" = "success") => {
  const toast = document.createElement("div");
  toast.className = `fixed top-20 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${
    type === "success"
      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
      : "bg-red-50 border-red-200 text-red-800"
  }`;
  toast.innerHTML = `
    <div class="flex items-center gap-3">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${type === "success" ? "text-emerald-500" : "text-red-500"}">
        ${type === "success" ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>' : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'}
      </svg>
      <span class="text-sm font-medium">${message}</span>
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(50px)";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        const res = await fetch(`/api/admin/orders/${orderId}`);
        const data = await res.json();
        if (res.ok) {
          setOrder(data.order);
          setItems(data.items);
        } else {
          showToast("Pesanan tidak ditemukan", "error");
          router.push("/admin/orders");
        }
      } catch (error) {
        console.error("Error fetching order detail:", error);
        showToast("Gagal memuat detail pesanan", "error");
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId, router]);

  const updateOrder = async (updates: {
    orderStatus?: string;
    paymentStatus?: string;
  }) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        showToast("Status pesanan berhasil diupdate", "success");
        const refreshRes = await fetch(`/api/admin/orders/${orderId}`);
        const data = await refreshRes.json();
        if (refreshRes.ok) {
          setOrder(data.order);
          setItems(data.items);
        }
      } else {
        showToast("Gagal update status", "error");
      }
    } catch {
      showToast("Terjadi kesalahan", "error");
    } finally {
      setIsUpdating(false);
      setShowRejectModal(false);
      setRejectionReason("");
    }
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#823b18] border-t-transparent rounded-full animate-spin" />
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
  const isPaid = order.paymentStatus === "PAID";
  const isCompleted =
    order.orderStatus === "COMPLETED" || order.orderStatus === "REJECTED";
  const canConfirmPayment = !isPaid && order.orderStatus !== "REJECTED";

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.priceAtTime), 0);
  const calculatedTotal = subtotal + (order.deliveryFee || 0);
  const isInconsistent = Math.abs(order.totalAmount - calculatedTotal) > 100;

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/orders"
          className="p-2 rounded-lg hover:bg-[#ffdbcd] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#823b18]" />
        </Link>
        <div>
          <h1 className="font-serif text-3xl text-[#823b18]">Detail Pesanan</h1>
          <p className="text-sm text-[#54433c]">{order.orderNumber}</p>
        </div>
      </div>

      {/* Data Inconsistency Warning */}
      {isInconsistent && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Data tidak konsisten!</p>
            <p className="text-xs text-red-600">
              Total di database ({formatRupiah(order.totalAmount)}) tidak sesuai dengan perhitungan item + ongkir ({formatRupiah(calculatedTotal)}).
              Silakan perbaiki data pesanan ini.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Order Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-xl shadow-sm border border-[#dac1b8]/10 overflow-hidden">
            <div className="p-5 border-b border-[#dac1b8]/10">
              <h2 className="font-serif text-xl text-[#28180b]">Item Pesanan</h2>
            </div>
            <div className="divide-y divide-[#dac1b8]/10">
              {items.map((item) => (
                <div key={item.id} className="p-4 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-[#ffeadc] overflow-hidden relative flex-shrink-0">
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
                    <h3 className="font-semibold text-[#28180b]">
                      {item.productName}
                    </h3>
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
              ))}
            </div>

            {/* Subtotal & Ongkir */}
            <div className="p-5 bg-white border-t border-[#dac1b8]/10">
              <div className="flex justify-between items-center">
                <span className="text-[#54433c]">Subtotal</span>
                <span className="font-medium text-[#28180b]">
                  {formatRupiah(subtotal)}
                </span>
              </div>
              {order.deliveryFee > 0 && (
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[#54433c]">Ongkos Kirim</span>
                  <span className="font-medium text-[#28180b]">
                    {formatRupiah(order.deliveryFee)}
                  </span>
                </div>
              )}
            </div>

            {/* Grand Total */}
            <div className="p-5 bg-[#fff1e9]">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-[#28180b]">Total Pembayaran</span>
                <span className="font-serif text-2xl font-bold text-[#823b18]">
                  {formatRupiah(order.totalAmount)}
                </span>
              </div>
              <p className="text-xs text-[#54433c] mt-1 text-right">
                {order.deliveryFee > 0 ? "Sudah termasuk ongkos kirim" : "Ambil sendiri (gratis ongkir)"}
              </p>
            </div>
          </div>

          {/* Customer Info with Address */}
          <div className="bg-white rounded-xl shadow-sm border border-[#dac1b8]/10 overflow-hidden">
            <div className="p-5 border-b border-[#dac1b8]/10">
              <h2 className="font-serif text-xl text-[#28180b]">
                Informasi Pelanggan
              </h2>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-[#823b18]" />
                <span className="text-[#28180b] font-medium">{order.customerName}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#823b18]" />
                <span className="text-[#28180b]">{order.customerPhone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#823b18]" />
                <span className="text-[#28180b]">{order.customerEmail}</span>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-white rounded-xl shadow-sm border border-[#dac1b8]/10 overflow-hidden">
            <div className="p-5 border-b border-[#dac1b8]/10">
              <h2 className="font-serif text-xl text-[#28180b]">
                Informasi Pengiriman
              </h2>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#823b18]" />
                <div>
                  <span className="text-[#54433c] text-sm">Tanggal Ambil:</span>
                  <p className="text-[#28180b] font-medium">{formatDate(order.pickupDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {order.deliveryMethod === "PICKUP" ? (
                  <ShoppingBag className="w-5 h-5 text-[#823b18]" />
                ) : (
                  <Truck className="w-5 h-5 text-[#823b18]" />
                )}
                <div>
                  <span className="text-[#54433c] text-sm">Metode:</span>
                  <p className="text-[#28180b] font-medium">
                    {order.deliveryMethod === "PICKUP" ? "Ambil Sendiri" : "Diantar"}
                  </p>
                </div>
              </div>
              {order.deliveryAddress && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#823b18] mt-0.5" />
                  <div>
                    <span className="text-[#54433c] text-sm">Alamat Pengiriman:</span>
                    <p className="text-[#28180b] font-medium">{order.deliveryAddress}</p>
                  </div>
                </div>
              )}
              {order.deliveryFee > 0 && (
                <div className="flex items-center gap-3">
                  <Banknote className="w-5 h-5 text-[#823b18]" />
                  <div>
                    <span className="text-[#54433c] text-sm">Biaya Kirim:</span>
                    <p className="text-[#28180b] font-medium">{formatRupiah(order.deliveryFee)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-white rounded-xl shadow-sm border border-[#dac1b8]/10 overflow-hidden">
              <div className="p-5 border-b border-[#dac1b8]/10">
                <h2 className="font-serif text-xl text-[#28180b]">Catatan</h2>
              </div>
              <div className="p-5">
                <p className="text-[#28180b]">{order.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Status & Actions */}
        <div className="space-y-6">
          {/* Order Status Card */}
          <div className="bg-white rounded-xl shadow-sm border border-[#dac1b8]/10 overflow-hidden">
            <div className="p-5 border-b border-[#dac1b8]/10">
              <h2 className="font-serif text-xl text-[#28180b]">
                Status Pesanan
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div
                className={`flex items-center gap-3 p-3 rounded-xl ${statusInfo.color}`}
              >
                <StatusIcon className="w-5 h-5" />
                <span className="font-semibold">{statusInfo.label}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#54433c]">Dibuat:</span>
                <span className="text-[#28180b]">{formatDate(order.createdAt)}</span>
              </div>
              {order.confirmedAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#54433c]">Dikonfirmasi:</span>
                  <span className="text-[#28180b]">{formatDate(order.confirmedAt)}</span>
                </div>
              )}
              {order.completedAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#54433c]">Selesai:</span>
                  <span className="text-[#28180b]">{formatDate(order.completedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Status Card */}
          <div className="bg-white rounded-xl shadow-sm border border-[#dac1b8]/10 overflow-hidden">
            <div className="p-5 border-b border-[#dac1b8]/10">
              <h2 className="font-serif text-xl text-[#28180b]">
                Status Pembayaran
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div
                className={`flex items-center gap-3 p-3 rounded-xl ${paymentInfo.color}`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="font-semibold">{paymentInfo.label}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#54433c]">Metode:</span>
                <span className="text-[#28180b] font-medium">{order.paymentMethod}</span>
              </div>

              {/* Bukti Transfer */}
              {order.paymentProofUrl ? (
                <div className="mt-3 space-y-3">
                  <p className="text-sm font-semibold text-[#28180b]">
                    Bukti Transfer:
                  </p>
                  <div className="bg-[#fff1e9] rounded-xl p-3">
                    <a
                      href={order.paymentProofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#823b18] hover:underline mb-3"
                    >
                      <Eye className="w-4 h-4" />
                      Lihat Bukti Transfer
                    </a>
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border border-[#dac1b8]/30 bg-white">
                      <Image
                        src={order.paymentProofUrl}
                        alt="Bukti Transfer"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  </div>
                  <p className="text-xs text-[#54433c]">
                    Upload ke-{order.paymentProofAttempts} dari 3 kesempatan
                  </p>
                </div>
              ) : (
                <div className="mt-3 p-3 bg-amber-50 rounded-xl text-center">
                  <AlertCircle className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                  <p className="text-sm text-amber-700 font-medium">
                    Belum ada bukti transfer
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Customer wajib upload bukti transfer maksimal 3x
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {!isCompleted && (
            <div className="bg-white rounded-xl shadow-sm border border-[#dac1b8]/10 overflow-hidden">
              <div className="p-5 border-b border-[#dac1b8]/10">
                <h2 className="font-serif text-xl text-[#28180b]">Aksi</h2>
              </div>
              <div className="p-5 space-y-3">
                {/* Confirm Payment Button */}
                {canConfirmPayment && (
                  <button
                    onClick={() =>
                      updateOrder({
                        paymentStatus: "PAID",
                        orderStatus: "ACCEPTED",
                      })
                    }
                    disabled={isUpdating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#823b18] text-white rounded-xl text-sm font-semibold hover:bg-[#a0522d] transition-all disabled:opacity-50"
                  >
                    {isUpdating ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Konfirmasi Pembayaran & Terima Pesanan
                  </button>
                )}

                {/* Update Status Flow */}
                {order.orderStatus === "ACCEPTED" && (
                  <button
                    onClick={() => updateOrder({ orderStatus: "PROCESSING" })}
                    disabled={isUpdating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-[#496800] text-[#496800] rounded-xl text-sm font-semibold hover:bg-[#c8f17a]/20 transition-all disabled:opacity-50"
                  >
                    {isUpdating ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Package className="w-4 h-4" />
                    )}
                    Proses Pesanan
                  </button>
                )}

                {order.orderStatus === "PROCESSING" && (
                  <button
                    onClick={() =>
                      updateOrder({
                        orderStatus:
                          order.deliveryMethod === "PICKUP"
                            ? "READY_FOR_PICKUP"
                            : "READY_FOR_DELIVERY",
                      })
                    }
                    disabled={isUpdating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-[#496800] text-[#496800] rounded-xl text-sm font-semibold hover:bg-[#c8f17a]/20 transition-all disabled:opacity-50"
                  >
                    {isUpdating ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Tandai Siap
                  </button>
                )}

                {(order.orderStatus === "READY_FOR_PICKUP" ||
                  order.orderStatus === "READY_FOR_DELIVERY") && (
                  <button
                    onClick={() => updateOrder({ orderStatus: "COMPLETED" })}
                    disabled={isUpdating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#496800] text-white rounded-xl text-sm font-semibold hover:bg-[#3a5200] transition-all disabled:opacity-50"
                  >
                    {isUpdating ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Selesaikan Pesanan
                  </button>
                )}

                {/* Reject Button */}
                {order.orderStatus === "WAITING_CONFIRMATION" && (
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={isUpdating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-red-500 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-all disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Tolak Pesanan
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full"
          >
            <div className="p-5 border-b border-[#dac1b8]/10">
              <h3 className="font-serif text-xl text-[#28180b]">
                Tolak Pesanan
              </h3>
            </div>
            <div className="p-5">
              <label className="block text-sm font-semibold text-[#28180b] mb-2">
                Alasan Penolakan
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="Masukkan alasan penolakan..."
                className="w-full bg-[#fff1e9] border border-[#dac1b8] rounded-xl px-4 py-2 text-sm text-[#28180b] placeholder:text-[#87736b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none"
              />
            </div>
            <div className="flex gap-3 p-5 pt-0">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2.5 border border-[#dac1b8] text-[#54433c] rounded-xl text-sm font-semibold hover:bg-[#fff1e9] transition-all"
              >
                Batal
              </button>
              <button
                onClick={() =>
                  updateOrder({
                    orderStatus: "REJECTED",
                    paymentStatus: "REJECTED",
                  })
                }
                disabled={isUpdating}
                className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600 transition-all disabled:opacity-50"
              >
                {isUpdating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  "Ya, Tolak"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}