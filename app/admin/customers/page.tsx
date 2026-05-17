"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Package,
  Eye,
  Key,
  CheckCircle,
  XCircle,
  X,
  AlertCircle,
  ShoppingBag,
  Copy,
  RefreshCw,
  Download,
} from "lucide-react";

// Tipe data
type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
};

type CustomerOrder = {
  id: string;
  orderNumber: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  pickupDate: string;
  createdAt: string;
};

const statusFilters = [
  { id: "all", name: "Semua", color: "bg-[#823b18] text-white" },
  { id: "active", name: "Aktif", color: "bg-emerald-100 text-emerald-700" },
  { id: "inactive", name: "Nonaktif", color: "bg-red-100 text-red-700" },
];

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

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch customers
  useEffect(() => {
    let isMounted = true;

    const loadCustomers = async () => {
      try {
        const res = await fetch(
          `/api/admin/customers?search=${encodeURIComponent(debouncedSearch)}&status=${selectedStatus}`
        );
        const data = await res.json();
        if (res.ok && isMounted) {
          setCustomers(data);
        }
      } catch (err) {
        console.error("Error fetching customers:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCustomers();

    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, selectedStatus]);

  // Pagination
  const totalPages = Math.ceil(customers.length / itemsPerPage);
  const paginatedCustomers = customers.slice(
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

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Aktif</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">Nonaktif</span>;
  };

  const getOrderStatusText = (status: string) => {
    const map: Record<string, string> = {
      WAITING_CONFIRMATION: "Menunggu Konfirmasi",
      ACCEPTED: "Diterima",
      REJECTED: "Ditolak",
      PROCESSING: "Diproses",
      READY_FOR_PICKUP: "Siap Diambil",
      READY_FOR_DELIVERY: "Siap Diantar",
      COMPLETED: "Selesai",
    };
    return map[status] || status;
  };

  const getPaymentStatusText = (status: string) => {
    const map: Record<string, string> = {
      PAID: "LUNAS",
      UNPAID: "BELUM BAYAR",
      WAITING_CONFIRMATION: "MENUNGGU KONFIRMASI",
      REJECTED: "DITOLAK",
    };
    return map[status] || status;
  };

  const fetchCustomerOrders = async (customerId: string) => {
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/orders`);
      const data = await res.json();
      if (res.ok) {
        setCustomerOrders(data);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      showToast("Gagal memuat riwayat pesanan", "error");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setIsUpdating(true);
    try {
      const res = await fetch("/api/admin/customers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentStatus }),
      });

      if (res.ok) {
        showToast(
          !currentStatus ? "Akun diaktifkan" : "Akun dinonaktifkan",
          "success"
        );
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, isActive: !currentStatus } : c
          )
        );
      } else {
        showToast("Gagal mengubah status", "error");
      }
    } catch {
      showToast("Terjadi kesalahan", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetPassword = async (id: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch("/api/admin/customers/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (res.ok) {
        setNewPassword(data.newPassword);
      } else {
        showToast(data.error || "Gagal reset password", "error");
        setShowResetModal(false);
      }
    } catch {
      showToast("Terjadi kesalahan", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openDetailModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailModal(true);
  };

  const openOrdersModal = async (customer: Customer) => {
    setSelectedCustomer(customer);
    await fetchCustomerOrders(customer.id);
    setShowOrdersModal(true);
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
            <span className="text-[#823b18] cursor-pointer">Pelanggan</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-[#28180b] mb-1">
            Manajemen Pelanggan
          </h2>
          <p className="text-sm text-[#54433c] max-w-xl">
            Kelola data pelanggan, lihat riwayat pesanan, dan atur status akun.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#fbddc7] text-[#54433c] rounded-lg text-sm font-semibold hover:bg-[#ffe3cf] transition-all cursor-pointer">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Search Bar & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#87736b]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama, email, atau nomor telepon..."
            className="w-full bg-white border border-[#dac1b8] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#28180b] placeholder:text-[#87736b] focus:border-[#823b18] focus:ring-1 focus:ring-[#823b18] outline-none transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => {
                setSelectedStatus(filter.id);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                selectedStatus === filter.id
                  ? filter.color
                  : "bg-[#fff1e9] text-[#54433c] hover:bg-[#ffe3cf]"
              }`}
            >
              {filter.name}
            </button>
          ))}
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-[#dac1b8]/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#fff1e9]">
              <tr>
                <th className="p-4 text-xs font-semibold text-[#54433c] uppercase tracking-wider">Pelanggan</th>
                <th className="p-4 text-xs font-semibold text-[#54433c] uppercase tracking-wider">Kontak</th>
                <th className="p-4 text-xs font-semibold text-[#54433c] uppercase tracking-wider">Total Pesanan</th>
                <th className="p-4 text-xs font-semibold text-[#54433c] uppercase tracking-wider">Total Belanja</th>
                <th className="p-4 text-xs font-semibold text-[#54433c] uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-[#54433c] uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dac1b8]/5">
              {paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[#54433c]">
                    <div className="flex flex-col items-center gap-2">
                      <User className="w-12 h-12 text-[#dac1b8]" />
                      <p>Belum ada pelanggan</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((customer, idx) => (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-[#fff8f5] transition-colors group"
                  >
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#28180b]">{customer.name}</span>
                        <span className="text-xs text-[#54433c]/60">{customer.email}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-[#28180b]">{customer.phone}</span>
                        {customer.address && (
                          <span className="text-xs text-[#54433c]/60 line-clamp-1">{customer.address}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-[#28180b]">{customer.totalOrders} pesanan</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-semibold text-[#823b18]">{formatRupiah(customer.totalSpent)}</span>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(customer.isActive)}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end items-center gap-1">
                        <button
                          onClick={() => openDetailModal(customer)}
                          className="p-1.5 rounded-lg text-[#87736b] hover:bg-[#ffdbcd] hover:text-[#823b18] transition-all cursor-pointer"
                          title="Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openOrdersModal(customer)}
                          className="p-1.5 rounded-lg text-[#87736b] hover:bg-[#ffdbcd] hover:text-[#823b18] transition-all cursor-pointer"
                          title="Riwayat Pesanan"
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setShowResetModal(true);
                          }}
                          className="p-1.5 rounded-lg text-[#87736b] hover:bg-[#ffdbcd] hover:text-[#823b18] transition-all cursor-pointer"
                          title="Reset Password"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(customer.id, customer.isActive)}
                          disabled={isUpdating}
                          className="p-1.5 rounded-lg text-[#87736b] hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer disabled:opacity-50"
                          title={customer.isActive ? "Nonaktifkan" : "Aktifkan"}
                        >
                          {customer.isActive ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-[#fff1e9] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#dac1b8]/10">
            <span className="text-xs text-[#54433c]">
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1} -{" "}
              {Math.min(currentPage * itemsPerPage, customers.length)} dari {customers.length} pelanggan
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
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-[#dac1b8]/10 px-6 py-4 flex justify-between items-center">
                <h3 className="font-serif text-2xl text-[#823b18]">Detail Pelanggan</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 rounded-lg hover:bg-[#ffdad6] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-[#54433c]" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs text-[#54433c] uppercase tracking-wider">Nama Lengkap</label>
                    <p className="text-[#28180b] font-medium mt-1">{selectedCustomer.name}</p>
                  </div>
                  <div>
                    <label className="text-xs text-[#54433c] uppercase tracking-wider">Email</label>
                    <p className="text-[#28180b] font-medium mt-1">{selectedCustomer.email}</p>
                  </div>
                  <div>
                    <label className="text-xs text-[#54433c] uppercase tracking-wider">Nomor Telepon</label>
                    <p className="text-[#28180b] font-medium mt-1">{selectedCustomer.phone}</p>
                  </div>
                  <div>
                    <label className="text-xs text-[#54433c] uppercase tracking-wider">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedCustomer.isActive)}</div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-[#54433c] uppercase tracking-wider">Alamat</label>
                    <p className="text-[#28180b] font-medium mt-1">{selectedCustomer.address || "Belum diisi"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-[#54433c] uppercase tracking-wider">Tanggal Daftar</label>
                    <p className="text-[#28180b] font-medium mt-1">{formatDateTime(selectedCustomer.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-[#54433c] uppercase tracking-wider">Total Pesanan</label>
                    <p className="text-[#28180b] font-medium mt-1">{selectedCustomer.totalOrders} pesanan</p>
                  </div>
                  <div>
                    <label className="text-xs text-[#54433c] uppercase tracking-wider">Total Belanja</label>
                    <p className="text-[#823b18] font-bold text-lg mt-1">{formatRupiah(selectedCustomer.totalSpent)}</p>
                  </div>
                  {selectedCustomer.lastOrderDate && (
                    <div>
                      <label className="text-xs text-[#54433c] uppercase tracking-wider">Pesanan Terakhir</label>
                      <p className="text-[#28180b] font-medium mt-1">{formatDate(selectedCustomer.lastOrderDate)}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Riwayat Pesanan Modal */}
      <AnimatePresence>
        {showOrdersModal && selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-[#dac1b8]/10 px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="font-serif text-xl text-[#28180b]">Riwayat Pesanan</h3>
                  <p className="text-sm text-[#54433c]">{selectedCustomer.name}</p>
                </div>
                <button
                  onClick={() => setShowOrdersModal(false)}
                  className="p-2 rounded-lg hover:bg-[#ffdad6] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-[#54433c]" />
                </button>
              </div>
              <div className="p-6">
                {customerOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-[#dac1b8] mx-auto mb-3" />
                    <p className="text-[#54433c]">Belum ada pesanan</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customerOrders.map((order) => (
                      <div key={order.id} className="bg-[#fff1e9] rounded-xl p-4">
                        <div className="flex flex-wrap justify-between items-start gap-2">
                          <div>
                            <p className="font-semibold text-[#823b18]">{order.orderNumber}</p>
                            <p className="text-xs text-[#54433c]">{formatDate(order.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[#823b18]">{formatRupiah(order.totalAmount)}</p>
                            <div className="flex gap-2 mt-1">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                order.orderStatus === "COMPLETED" ? "bg-green-100 text-green-700" :
                                order.orderStatus === "REJECTED" ? "bg-red-100 text-red-700" :
                                order.orderStatus === "PROCESSING" ? "bg-blue-100 text-blue-700" :
                                "bg-amber-100 text-amber-700"
                              }`}>
                                {getOrderStatusText(order.orderStatus)}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                order.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-700" :
                                order.paymentStatus === "UNPAID" ? "bg-red-100 text-red-700" :
                                "bg-amber-100 text-amber-700"
                              }`}>
                                {getPaymentStatusText(order.paymentStatus)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Password Modal - Konfirmasi */}
      <AnimatePresence>
        {showResetModal && selectedCustomer && newPassword === "" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full"
            >
              <div className="p-5 border-b border-[#dac1b8]/10">
                <h3 className="font-serif text-xl text-[#28180b]">Reset Password</h3>
                <p className="text-sm text-[#54433c] mt-1">
                  Reset password untuk <span className="font-semibold">{selectedCustomer.name}</span>
                </p>
              </div>
              <div className="p-5">
                <div className="bg-amber-50 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Perhatian!</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Password baru akan digenerate secara acak. Pastikan untuk memberikan password baru ini kepada pelanggan.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 p-5 pt-0">
                <button
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 px-4 py-2.5 border border-[#dac1b8] text-[#54433c] rounded-xl text-sm font-semibold hover:bg-[#fff1e9] transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleResetPassword(selectedCustomer.id)}
                  disabled={isUpdating}
                  className="flex-1 bg-[#823b18] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#a0522d] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isUpdating ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : "Reset Password"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Show New Password Modal - Dengan tombol copy */}
      <AnimatePresence>
        {newPassword !== "" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full"
            >
              <div className="p-5 border-b border-[#dac1b8]/10">
                <h3 className="font-serif text-xl text-[#823b18]">Password Baru</h3>
                <p className="text-sm text-[#54433c] mt-1">
                  Password baru untuk <span className="font-semibold">{selectedCustomer?.name}</span>
                </p>
              </div>
              <div className="p-5">
                <div className="bg-emerald-50 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <code className="text-lg font-mono font-bold text-emerald-700 select-all">
                      {newPassword}
                    </code>
                    <button
                      onClick={() => copyToClipboard(newPassword)}
                      className="p-2 rounded-lg bg-white text-[#823b18] hover:bg-[#ffdbcd] transition-all cursor-pointer flex items-center gap-1 text-sm"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Tersalin!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Salin
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-[#54433c] mt-3 text-center">
                  *Silakan salin password di atas dan berikan kepada pelanggan.
                </p>
              </div>
              <div className="flex gap-3 p-5 pt-0">
                <button
                  onClick={() => {
                    setNewPassword("");
                    setShowResetModal(false);
                  }}
                  className="flex-1 px-4 py-2.5 border border-[#dac1b8] text-[#54433c] rounded-xl text-sm font-semibold hover:bg-[#fff1e9] transition-all cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}