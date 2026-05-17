"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Truck,
  Eye,
  Package,
  Download,
  Plus,
  X,
  Calendar,
} from "lucide-react";

// Tipe data order
type Order = {
  id: string;
  orderNumber: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  deliveryMethod: string;
  pickupDate: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string | null;
  createdAt: string;
};

// Status options untuk filter
const statusFilters = [
  { id: "all", name: "Semua Pesanan", color: "bg-[#823b18] text-white" },
  { id: "WAITING_CONFIRMATION", name: "Pending", color: "bg-amber-100 text-amber-700" },
  { id: "ACCEPTED", name: "Diterima", color: "bg-emerald-100 text-emerald-700" },
  { id: "PROCESSING", name: "Diproses", color: "bg-blue-100 text-blue-700" },
  { id: "READY_FOR_DELIVERY", name: "Siap Diantar", color: "bg-teal-100 text-teal-700" },
  { id: "READY_FOR_PICKUP", name: "Siap Diambil", color: "bg-teal-100 text-teal-700" },
  { id: "COMPLETED", name: "Selesai", color: "bg-green-100 text-green-700" },
  { id: "REJECTED", name: "Ditolak", color: "bg-red-100 text-red-700" },
];

const statusBadgeColors: Record<string, string> = {
  WAITING_CONFIRMATION: "bg-amber-100 text-amber-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  READY_FOR_PICKUP: "bg-teal-100 text-teal-700",
  READY_FOR_DELIVERY: "bg-teal-100 text-teal-700",
  COMPLETED: "bg-green-100 text-green-700",
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showExportModal, setShowExportModal] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const itemsPerPage = 5;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch orders
  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      try {
        const res = await fetch(
          `/api/admin/orders?search=${encodeURIComponent(debouncedSearch)}&status=${selectedStatus}`
        );
        const data = await res.json();
        if (res.ok && isMounted) {
          setOrders(data);
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, selectedStatus]);

  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const paginatedOrders = orders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
      month: "short",
      year: "numeric",
    });
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "WAITING_CONFIRMATION": return "Menunggu Konfirmasi";
      case "ACCEPTED": return "Diterima";
      case "PROCESSING": return "Diproses";
      case "READY_FOR_PICKUP": return "Siap Diambil";
      case "READY_FOR_DELIVERY": return "Siap Diantar";
      case "COMPLETED": return "Selesai";
      case "REJECTED": return "Ditolak";
      default: return status;
    }
  };

  const handleExport = async () => {
    try {
      let url = `/api/admin/orders/export?status=${selectedStatus}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      
      window.open(url, "_blank");
      showToast("Export dimulai!", "success");
      setShowExportModal(false);
      setStartDate("");
      setEndDate("");
    } catch (error) {
      showToast("Gagal export data", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#823b18] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1 text-xs text-[#54433c]/60 mb-1">
            <span>Dashboard</span>
            <span className="text-[#54433c]/40">/</span>
            <span className="text-[#823b18] cursor-pointer">Pesanan</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-[#28180b] mb-1">
            Manajemen Pesanan
          </h2>
          <p className="text-sm text-[#54433c] max-w-xl">
            Monitor dan kelola semua pesanan roti dari persiapan hingga pengiriman.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#c8f17a] text-[#131f00] rounded-lg text-sm font-semibold hover:opacity-90 transition-all cursor-pointer">
            <Plus className="w-4 h-4" />
            Pesanan Baru
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#fbddc7] text-[#54433c] rounded-lg text-sm font-semibold hover:bg-[#ffe3cf] transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#87736b]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari pesanan, pelanggan, atau nomor telepon..."
          className="w-full bg-white border border-[#dac1b8] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#28180b] placeholder:text-[#87736b] focus:border-[#823b18] focus:ring-1 focus:ring-[#823b18] outline-none transition-all"
        />
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => {
              setSelectedStatus(filter.id);
              setCurrentPage(1);
            }}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              selectedStatus === filter.id
                ? filter.color
                : "bg-[#fff1e9] text-[#54433c] hover:bg-[#ffe3cf]"
            }`}
          >
            {filter.name}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {paginatedOrders.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-[#dac1b8]/10">
            <Package className="w-16 h-16 text-[#dac1b8] mx-auto mb-4" />
            <p className="text-[#54433c]">Belum ada pesanan</p>
          </div>
        ) : (
          paginatedOrders.map((order, idx) => {
            const badgeColor = statusBadgeColors[order.orderStatus] || "bg-gray-100 text-gray-600";

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-xl p-5 shadow-sm border border-[#dac1b8]/10 hover:border-[#823b18]/20 transition-all group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Section */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-14 h-14 rounded-lg bg-[#ffeadc] overflow-hidden flex-shrink-0 flex items-center justify-center">
                      <Package className="w-7 h-7 text-[#823b18]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="font-serif text-xl font-semibold text-[#823b18]">
                          {order.orderNumber}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeColor}`}>
                          {getStatusLabel(order.orderStatus)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <p className="text-[10px] uppercase text-[#54433c]/60 font-bold tracking-wider mb-0.5">
                            Tgl. Ambil
                          </p>
                          <p className="text-sm font-medium text-[#28180b]">
                            {formatDate(order.pickupDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-[#54433c]/60 font-bold tracking-wider mb-0.5">
                            Metode
                          </p>
                          <p className="text-sm font-medium text-[#28180b] flex items-center gap-1">
                            {order.deliveryMethod === "PICKUP" ? (
                              <ShoppingBag className="w-3.5 h-3.5" />
                            ) : (
                              <Truck className="w-3.5 h-3.5" />
                            )}
                            {order.deliveryMethod === "PICKUP" ? "Ambil Sendiri" : "Diantar"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-[#54433c]/60 font-bold tracking-wider mb-0.5">
                            Total
                          </p>
                          <p className="text-sm font-bold text-[#823b18]">
                            {formatRupiah(order.totalAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-[#54433c]/60 font-bold tracking-wider mb-0.5">
                            Pelanggan
                          </p>
                          <p className="text-sm font-medium text-[#28180b] truncate">
                            {order.customerName}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold bg-[#823b18] text-white hover:bg-[#a0522d] transition-all cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    Detail
                  </Link>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-[#fff1e9] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl">
          <span className="text-xs text-[#54433c]">
            Menampilkan {((currentPage - 1) * itemsPerPage) + 1} -{" "}
            {Math.min(currentPage * itemsPerPage, orders.length)} dari {orders.length} pesanan
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#54433c] hover:bg-white disabled:opacity-50 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum = currentPage;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-all cursor-pointer ${
                    currentPage === pageNum
                      ? "bg-[#823b18] text-white"
                      : "text-[#54433c] hover:bg-white"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#54433c] hover:bg-white disabled:opacity-50 transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full"
            >
              <div className="p-5 border-b border-[#dac1b8]/10 flex justify-between items-center">
                <div>
                  <h3 className="font-serif text-xl text-[#28180b]">Export Laporan</h3>
                  <p className="text-xs text-[#54433c] mt-1">Pilih rentang tanggal untuk export</p>
                </div>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="p-1 rounded-lg hover:bg-[#ffdad6] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-[#54433c]" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#28180b] mb-1">
                    Dari Tanggal
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#87736b]" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-white border border-[#dac1b8] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#28180b] focus:border-[#823b18] focus:ring-1 focus:ring-[#823b18] outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#28180b] mb-1">
                    Sampai Tanggal
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#87736b]" />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-white border border-[#dac1b8] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#28180b] focus:border-[#823b18] focus:ring-1 focus:ring-[#823b18] outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 p-5 pt-0">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 px-4 py-2.5 border border-[#dac1b8] text-[#54433c] rounded-xl text-sm font-semibold hover:bg-[#fff1e9] transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleExport}
                  className="flex-1 bg-[#823b18] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#a0522d] transition-all cursor-pointer"
                >
                  Export Sekarang
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}