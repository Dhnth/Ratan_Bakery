"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Search,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  ShoppingBag,
  Calendar,
  ChevronLeft,
  ChevronRight,
  User,
  Coffee,
  LogOut,
  Menu,
  X,
  Settings,
  ChevronDown,
} from "lucide-react";

// Tipe data
type Order = {
  id: string;
  orderNumber: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  deliveryMethod: string;
  pickupDate: string;
  createdAt: string;
};

type StatusInfo = {
  label: string;
  color: string;
  icon: React.ElementType;
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

export default function CustomerOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const itemsPerPage = 5;
  
  const profileDropdownRef = useRef<HTMLDivElement>(null);

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
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders");
        const data = await res.json();
        if (res.ok) {
          setOrders(data);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (session) {
      fetchOrders();
    }
  }, [session]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    });
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter orders based on search
  const filteredOrders = orders.filter((order) =>
    order.orderNumber.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-[#fff8f5] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#823b18] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff8f5] relative">
      {/* Background Pattern - Sama seperti customer page */}
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
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-[#ffdbcd] to-[#fbddc7] rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#823b18] flex items-center justify-center">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-xl sm:text-2xl text-[#28180b]">
                Riwayat Pesanan, {session?.user?.name?.split(" ")[0]}
              </h1>
              <p className="text-[#54433c] text-xs sm:text-sm mt-1">
                Lihat dan lacak semua pesanan Anda.
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md mb-6 sm:mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#87736b] cursor-pointer" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan nomor pesanan..."
            className="w-full bg-white border border-[#dac1b8] rounded-xl pl-10 pr-4 py-2.5 sm:py-3 text-sm text-[#28180b] placeholder:text-[#87736b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none transition-all shadow-sm cursor-pointer"
          />
        </div>

        {/* Orders List */}
        {paginatedOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-[#dac1b8]/10 shadow-sm">
            <Package className="w-16 h-16 mx-auto mb-4 text-[#dac1b8]" />
            <h3 className="font-serif text-xl text-[#28180b] mb-2">Belum Ada Pesanan</h3>
            <p className="text-[#54433c] text-sm mb-4">
              Anda belum melakukan pemesanan apapun.
            </p>
            <Link
              href="/customer"
              className="inline-block bg-[#823b18] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#a0522d] transition-all shadow-md hover:shadow-lg"
            >
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedOrders.map((order, idx) => {
              const statusInfo = statusConfig[order.orderStatus] || {
                label: order.orderStatus,
                color: "bg-gray-100 text-gray-700",
                icon: Package,
              };
              const StatusIcon = statusInfo.icon;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#dac1b8]/10 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left Section */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className="font-serif text-base sm:text-lg font-semibold text-[#823b18]">
                          {order.orderNumber}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${statusInfo.color} flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-[10px] uppercase text-[#54433c]/60 font-bold tracking-wider mb-0.5">
                            Tanggal Pesan
                          </p>
                          <p className="text-[#28180b] font-medium flex items-center gap-1 text-xs sm:text-sm">
                            <Calendar className="w-3 h-3 text-[#87736b]" />
                            {formatDateTime(order.createdAt)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-[#54433c]/60 font-bold tracking-wider mb-0.5">
                            Tanggal Ambil
                          </p>
                          <p className="text-[#28180b] font-medium text-xs sm:text-sm">
                            {formatDate(order.pickupDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-[#54433c]/60 font-bold tracking-wider mb-0.5">
                            Metode
                          </p>
                          <p className="text-[#28180b] font-medium text-xs sm:text-sm">
                            {order.deliveryMethod === "PICKUP" ? "Ambil Sendiri" : "Diantar"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-[#54433c]/60 font-bold tracking-wider mb-0.5">
                            Total
                          </p>
                          <p className="text-[#823b18] font-bold text-xs sm:text-sm">
                            {formatRupiah(order.totalAmount)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Link
                      href={`/customer/orders/${order.id}`}
                      className="flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl text-sm font-semibold bg-[#823b18] text-white hover:bg-[#a0522d] transition-all shadow-sm hover:shadow-md whitespace-nowrap"
                    >
                      <Eye className="w-4 h-4" />
                      Detail Pesanan
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
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
      </div>
    </div>
  );
}