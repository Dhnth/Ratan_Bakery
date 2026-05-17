"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ShoppingBag,
  Banknote,
  ShoppingCart,
  Clock,
  AlertTriangle,
  Package,
  Truck,
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

// Tipe data
type Stats = {
  totalOrders: number;
  revenue: number;
  activeProducts: number;
  pendingPayments: number;
};

type Order = {
  id: string;
  orderNumber: string;
  totalAmount: number;
  orderStatus: string;
  customerName: string;
  createdAt: string;
};

type LowStockProduct = {
  id: string;
  name: string;
  stock: number;
  imageUrl: string | null;
};

type StatusInfo = {
  label: string;
  color: string;
  icon: LucideIcon;
};

const statusMap: Record<string, StatusInfo> = {
  WAITING_CONFIRMATION: { label: "Menunggu Konfirmasi", color: "bg-amber-100 text-amber-700", icon: Clock },
  ACCEPTED: { label: "Diterima", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  REJECTED: { label: "Ditolak", color: "bg-red-100 text-red-700", icon: XCircle },
  PROCESSING: { label: "Diproses", color: "bg-blue-100 text-blue-700", icon: Package },
  READY_FOR_PICKUP: { label: "Siap Diambil", color: "bg-teal-100 text-teal-700", icon: CheckCircle },
  READY_FOR_DELIVERY: { label: "Siap Diantar", color: "bg-teal-100 text-teal-700", icon: Truck },
  COMPLETED: { label: "Selesai", color: "bg-green-100 text-green-700", icon: CheckCircle },
};

type StatCard = {
  label: string;
  value: string | number;
  change: string;
  trend: "up" | "down" | "stable";
  icon: LucideIcon;
  color: string;
  iconColor: string;
};

type BenefitItem = {
  icon: LucideIcon;
  title: string;
  desc: string;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.4 } },
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMounted = useRef(true);

  // Debounce search 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch data
  useEffect(() => {
    if (status !== "authenticated") return;
    if (session?.user?.role !== "ADMIN") return;

    let isActive = true;

    const loadData = async () => {
      if (!isActive) return;

      try {
        const [statsRes, ordersRes, lowStockRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch(`/api/admin/orders?search=${encodeURIComponent(debouncedSearch)}`),
          fetch("/api/admin/low-stock"),
        ]);

        const statsData = await statsRes.json() as Stats;
        const ordersData = await ordersRes.json() as Order[];
        const lowStockData = await lowStockRes.json() as LowStockProduct[];

        if (isActive) {
          if (statsRes.ok) setStats(statsData);
          if (ordersRes.ok) setOrders(ordersData);
          if (lowStockRes.ok) setLowStock(lowStockData);
          setIsLoading(false);
          setIsRefreshing(false);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        if (isActive) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    loadData();

    return () => {
      isActive = false;
    };
  }, [status, session, debouncedSearch]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [statsRes, ordersRes, lowStockRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch(`/api/admin/orders?search=${encodeURIComponent(debouncedSearch)}`),
        fetch("/api/admin/low-stock"),
      ]);

      const statsData = await statsRes.json() as Stats;
      const ordersData = await ordersRes.json() as Order[];
      const lowStockData = await lowStockRes.json() as LowStockProduct[];

      if (statsRes.ok) setStats(statsData);
      if (ordersRes.ok) setOrders(ordersData);
      if (lowStockRes.ok) setLowStock(lowStockData);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [debouncedSearch]);

  // Cleanup
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const formatRupiah = (amount: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTrendIcon = (trend: "up" | "down" | "stable"): React.ReactNode => {
    if (trend === "up") return <TrendingUp className="w-3 h-3" />;
    if (trend === "down") return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getTrendColor = (trend: "up" | "down" | "stable"): string => {
    if (trend === "up") return "text-emerald-600";
    if (trend === "down") return "text-red-600";
    return "text-gray-500";
  };

  // Loading state
  if (status === "loading" || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-[#823b18] border-t-transparent rounded-full"
        />
        <p className="text-[#54433c] mt-4 text-sm">Memuat dashboard...</p>
      </div>
    );
  }

  if (session?.user?.role !== "ADMIN") {
    return null;
  }

  const statCards: StatCard[] = [
    { label: "Total Pesanan", value: stats?.totalOrders || 0, change: "+12%", trend: "up", icon: ShoppingBag, color: "bg-amber-50", iconColor: "text-amber-700" },
    { label: "Pendapatan", value: formatRupiah(stats?.revenue || 0), change: "+8.4%", trend: "up", icon: Banknote, color: "bg-emerald-50", iconColor: "text-emerald-700" },
    { label: "Produk Aktif", value: stats?.activeProducts || 0, change: "Stabil", trend: "stable", icon: ShoppingCart, color: "bg-blue-50", iconColor: "text-blue-700" },
    { label: "Pembayaran Tertunda", value: stats?.pendingPayments || 0, change: stats?.pendingPayments ? "+2" : "Aman", trend: stats?.pendingPayments ? "down" : "stable", icon: Clock, color: "bg-red-50", iconColor: "text-red-700" },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-serif text-3xl md:text-4xl text-[#823b18] mb-1">Ringkasan Harian</h2>
          <p className="text-[#54433c] text-sm">
            Selamat datang, {session?.user?.name || "Kepala Baker"}. Ini kondisi dapur Anda hari ini.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-[#ffeadc] rounded-xl text-[#823b18] text-sm font-semibold hover:bg-[#ffe3cf] transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Segarkan
        </motion.button>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="bg-white p-5 rounded-2xl shadow-sm border border-[#dac1b8]/10 hover:shadow-md transition-all duration-300 group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2.5 rounded-xl ${stat.color} group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold ${getTrendColor(stat.trend)}`}>
                  {getTrendIcon(stat.trend)}
                  <span>{stat.change}</span>
                </div>
              </div>
              <p className="text-xs font-semibold tracking-wide text-[#54433c] uppercase">{stat.label}</p>
              <p className="font-serif text-2xl md:text-3xl font-bold text-[#28180b] mt-1">{stat.value}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-[#dac1b8]/10 overflow-hidden">
            <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#dac1b8]/10">
              <h3 className="font-serif text-xl md:text-2xl text-[#28180b]">Pesanan Terbaru</h3>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#87736b]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari pesanan atau pelanggan..."
                  className="w-full bg-[#fff1e9] border border-[#dac1b8] rounded-xl pl-9 pr-4 py-2 text-sm text-[#28180b] placeholder:text-[#87736b]/50 focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none transition-all"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#fff1e9]">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold text-[#54433c] uppercase tracking-wider">No. Pesanan</th>
                    <th className="px-5 py-3 text-xs font-semibold text-[#54433c] uppercase tracking-wider">Pelanggan</th>
                    <th className="px-5 py-3 text-xs font-semibold text-[#54433c] uppercase tracking-wider">Total</th>
                    <th className="px-5 py-3 text-xs font-semibold text-[#54433c] uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-xs font-semibold text-[#54433c] uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dac1b8]/5">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-[#54433c]">
                        <div className="flex flex-col items-center gap-2">
                          <Package className="w-12 h-12 text-[#dac1b8]" />
                          <p>Belum ada pesanan</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    orders.map((order, idx) => {
                      const statusInfo = statusMap[order.orderStatus] ?? { 
                        label: order.orderStatus, 
                        color: "bg-gray-100 text-gray-600",
                        icon: MoreHorizontal
                      };
                      const StatusIcon = statusInfo.icon;
                      return (
                        <motion.tr
                          key={order.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="hover:bg-[#fff1e9] transition-colors group"
                        >
                          <td className="px-5 py-4">
                            <span className="text-sm font-medium text-[#823b18]">{order.orderNumber}</span>
                          </td>
                          <td className="px-5 py-4 text-sm text-[#28180b]">{order.customerName}</td>
                          <td className="px-5 py-4 text-sm font-semibold text-[#28180b]">{formatRupiah(order.totalAmount)}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusInfo.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <button className="p-1.5 rounded-lg text-[#87736b] hover:text-[#823b18] hover:bg-[#823b18]/10 transition-all opacity-0 group-hover:opacity-100">
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Banner */}
          <div className="relative rounded-2xl overflow-hidden h-48 bg-gradient-to-r from-[#823b18] to-[#a0522d]">
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative z-10 p-6 flex flex-col justify-center h-full">
              <h4 className="font-serif text-2xl text-white mb-2">Jadwal Adonan Harian</h4>
              <p className="text-white/80 max-w-xs text-sm mb-4">3 resep musiman baru siap untuk uji coba pemanggangan besok pagi.</p>
              <button className="w-fit px-5 py-2 bg-white/10 backdrop-blur-sm text-white rounded-xl text-sm font-semibold hover:bg-white/20 transition-all border border-white/20">
                Kelola Resep
              </button>
            </div>
            <div className="absolute bottom-0 right-0 opacity-10">
              <Package className="w-32 h-32 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Sidebar */}
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Low Stock Alert */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#dac1b8]/10 overflow-hidden">
            <div className="p-5 border-b border-[#dac1b8]/10">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="font-serif text-xl text-[#28180b]">Stok Menipis</h3>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {lowStock.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                  <p className="text-[#496800] font-medium">Semua stok aman!</p>
                  <p className="text-xs text-[#54433c] mt-1">Tidak ada produk dengan stok rendah.</p>
                </div>
              ) : (
                lowStock.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-red-50/50 border border-red-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#ffeadc] overflow-hidden relative flex-shrink-0">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#dac1b8]/30">
                            <Package className="w-6 h-6 text-[#87736b]" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-[#28180b]">{item.name}</p>
                        <p className="text-xs text-red-600 font-medium">Tersisa {item.stock} pcs</p>
                      </div>
                    </div>
                    <button className="p-2 rounded-lg text-[#823b18] hover:bg-[#823b18]/10 transition-all">
                      <Package className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
            <div className="p-4 pt-0">
              <button className="w-full py-2.5 border border-[#823b18] text-[#823b18] rounded-xl text-sm font-semibold hover:bg-[#823b18] hover:text-white transition-all">
                Laporan Inventaris
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-[#ffeadc] to-[#ffe3cf] p-6 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/30 backdrop-blur-sm rounded-full mb-3">
                <Truck className="w-3 h-3 text-[#823b18]" />
                <span className="text-[10px] font-semibold text-[#823b18] uppercase tracking-wider">Aksi Cepat</span>
              </div>
              <h3 className="font-serif text-xl text-[#28180b] mb-4">Kirim Pengantaran Pagi</h3>
              <div className="flex items-center -space-x-2 mb-5">
                {["D1", "D2", "D3"].map((d, i) => (
                  <div
                    key={d}
                    className="w-8 h-8 rounded-full border-2 border-white bg-[#823b18]/20 flex items-center justify-center text-[10px] font-bold text-[#823b18]"
                    style={{ zIndex: 3 - i }}
                  >
                    {d}
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-white bg-white/80 flex items-center justify-center text-[10px] font-bold text-[#54433c]">
                  +2
                </div>
              </div>
              <button className="w-full py-2.5 bg-[#823b18] text-white rounded-xl text-sm font-semibold shadow-lg shadow-[#823b18]/20 hover:bg-[#a0522d] transition-all active:scale-95">
                Mulai Pengantaran
              </button>
            </div>
            <div className="absolute -right-6 -bottom-6 opacity-5">
              <Truck className="w-32 h-32 text-[#823b18]" />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}