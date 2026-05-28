"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  DollarSign,
  Download,
  RefreshCw,
  CreditCard,
  Smartphone,
  Landmark,
} from "lucide-react";

// Tipe data
type Summary = {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  avgOrderValue: number;
};

type SalesData = {
  date: string;
  totalOrders: number;
  totalRevenue: number;
};

type TopProduct = {
  productId: string;
  productName: string;
  totalSold: number;
  totalRevenue: number;
};

type OrderStatus = {
  WAITING_CONFIRMATION: number;
  ACCEPTED: number;
  PROCESSING: number;
  READY_FOR_PICKUP: number;
  READY_FOR_DELIVERY: number;
  COMPLETED: number;
  REJECTED: number;
};

type PaymentMethod = {
  paymentMethod: string;
  count: number;
  total: number;
};

type PaymentIconType = {
  [key: string]: React.ComponentType<{ className?: string }>;
};

const statusLabels: Record<string, string> = {
  WAITING_CONFIRMATION: "Menunggu Konfirmasi",
  ACCEPTED: "Diterima",
  PROCESSING: "Diproses",
  READY_FOR_PICKUP: "Siap Diambil",
  READY_FOR_DELIVERY: "Siap Diantar",
  COMPLETED: "Selesai",
  REJECTED: "Ditolak",
};

const statusColors: Record<string, string> = {
  WAITING_CONFIRMATION: "bg-amber-500",
  ACCEPTED: "bg-emerald-500",
  PROCESSING: "bg-blue-500",
  READY_FOR_PICKUP: "bg-teal-500",
  READY_FOR_DELIVERY: "bg-teal-500",
  COMPLETED: "bg-green-500",
  REJECTED: "bg-red-500",
};

const paymentIcons: PaymentIconType = {
  BCA: Landmark,
  MANDIRI: Landmark,
  DANA: Smartphone,
  OVO: Smartphone,
  default: CreditCard,
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

export default function ReportsPage() {
  const [range, setRange] = useState("week");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<Summary>({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    avgOrderValue: 0,
  });
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [orderStatus, setOrderStatus] = useState<OrderStatus>({
    WAITING_CONFIRMATION: 0,
    ACCEPTED: 0,
    PROCESSING: 0,
    READY_FOR_PICKUP: 0,
    READY_FOR_DELIVERY: 0,
    COMPLETED: 0,
    REJECTED: 0,
  });
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

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
    });
  };

  // Fetch reports - langsung di dalam useEffect (tanpa useCallback)
  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      try {
        let url = `/api/admin/reports?range=${range}`;
        if (startDate && endDate) {
          url += `&startDate=${startDate}&endDate=${endDate}`;
        }

        const res = await fetch(url);
        const data = await res.json();

        if (res.ok) {
          setSummary(data.summary);
          setSalesData(data.salesData || []);
          setTopProducts(data.topProducts || []);
          setOrderStatus(data.orderStatus);
          setPaymentMethods(data.paymentMethods || []);
        } else {
          showToast("Gagal memuat laporan", "error");
        }
      } catch {
        showToast("Terjadi kesalahan", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [range, startDate, endDate]);

  const getMaxRevenue = () => {
    if (salesData.length === 0) return 1;
    return Math.max(...salesData.map((d) => d.totalRevenue));
  };

  const maxRevenue = getMaxRevenue();

  const summaryCards = [
    {
      title: "Total Pendapatan",
      value: formatRupiah(summary.totalRevenue),
      icon: DollarSign,
      color: "bg-emerald-100 text-emerald-700",
      trend: "+12%",
    },
    {
      title: "Total Pesanan",
      value: summary.totalOrders,
      icon: ShoppingBag,
      color: "bg-blue-100 text-blue-700",
      trend: "+8%",
    },
    {
      title: "Total Pelanggan",
      value: summary.totalCustomers,
      icon: Users,
      color: "bg-purple-100 text-purple-700",
      trend: "+5%",
    },
    {
      title: "Rata-rata per Pesanan",
      value: formatRupiah(summary.avgOrderValue),
      icon: TrendingUp,
      color: "bg-orange-100 text-orange-700",
      trend: "+3%",
    },
  ];

  const ranges = [
    { id: "week", name: "7 Hari Terakhir" },
    { id: "month", name: "30 Hari Terakhir" },
    { id: "year", name: "Tahun Ini" },
    { id: "custom", name: "Custom" },
  ];

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
            <span className="text-[#823b18] cursor-pointer">Laporan</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-[#28180b] mb-1">
            Laporan Penjualan
          </h2>
          <p className="text-sm text-[#54433c] max-w-xl">
            Lihat statistik penjualan, produk terlaris, dan analisis bisnis Anda.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#fbddc7] text-[#54433c] rounded-lg text-sm font-semibold hover:bg-[#ffe3cf] transition-all cursor-pointer">
          <Download className="w-4 h-4" />
          Export Laporan
        </button>
      </div>

      {/* Range Filter */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-[#dac1b8]/10">
        <div className="flex flex-wrap items-center gap-3">
          {ranges.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                setRange(r.id);
                if (r.id !== "custom") {
                  setStartDate("");
                  setEndDate("");
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                range === r.id
                  ? "bg-[#823b18] text-white"
                  : "bg-[#fff1e9] text-[#54433c] hover:bg-[#ffe3cf]"
              }`}
            >
              {r.name}
            </button>
          ))}

          {range === "custom" && (
            <div className="flex items-center gap-2 ml-auto">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white border border-[#dac1b8] rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none"
              />
              <span className="text-[#54433c]">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white border border-[#dac1b8] rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none"
              />
              <button
                onClick={() => {
                  // Trigger re-fetch dengan mengubah state range sementara
                  const newRange = range;
                  setRange("");
                  setTimeout(() => setRange(newRange), 10);
                }}
                className="p-1.5 rounded-lg bg-[#823b18] text-white hover:bg-[#a0522d] transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {summaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-5 rounded-2xl shadow-sm border border-[#dac1b8]/10 hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2.5 rounded-xl ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {card.trend}
                </span>
              </div>
              <p className="text-xs font-semibold tracking-wide text-[#54433c] uppercase">
                {card.title}
              </p>
              <p className="font-serif text-2xl md:text-3xl font-bold text-[#28180b] mt-1">
                {card.value}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-[#dac1b8]/10 p-5">
          <h3 className="font-serif text-xl text-[#28180b] mb-4">
            Grafik Penjualan
          </h3>
          {salesData.length === 0 ? (
            <div className="text-center py-12 text-[#54433c]">
              Belum ada data penjualan
            </div>
          ) : (
            <div className="space-y-2">
              {salesData.map((item, idx) => {
                const barHeight = (item.totalRevenue / maxRevenue) * 100;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-16 text-xs text-[#54433c]">
                      {formatDate(item.date)}
                    </div>
                    <div className="flex-1">
                      <div className="relative h-8 bg-[#fff1e9] rounded-full overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full bg-linear-to-r from-[#823b18] to-[#a0522d] rounded-full transition-all duration-500"
                          style={{ width: `${barHeight}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-24 text-right">
                      <span className="text-xs font-semibold text-[#823b18]">
                        {formatRupiah(item.totalRevenue)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#dac1b8]/10 p-5">
          <h3 className="font-serif text-xl text-[#28180b] mb-4">
            Produk Terlaris
          </h3>
          {topProducts.length === 0 ? (
            <div className="text-center py-12 text-[#54433c]">
              Belum ada data produk
            </div>
          ) : (
            <div className="space-y-4">
              {topProducts.map((product, idx) => {
                const maxSold = topProducts[0]?.totalSold || 1;
                const barWidth = (product.totalSold / maxSold) * 100;
                return (
                  <div key={product.productId}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-[#28180b]">
                        {idx + 1}. {product.productName}
                      </span>
                      <span className="text-[#823b18] font-semibold">
                        {product.totalSold} pcs
                      </span>
                    </div>
                    <div className="h-2 bg-[#fff1e9] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#823b18] rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <p className="text-xs text-[#54433c] mt-1">
                      {formatRupiah(product.totalRevenue)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#dac1b8]/10 p-5">
          <h3 className="font-serif text-xl text-[#28180b] mb-4">
            Status Pesanan
          </h3>
          <div className="space-y-3">
            {Object.entries(orderStatus).map(([status, count]) => {
              if (count === 0) return null;
              const total = Object.values(orderStatus).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#54433c]">{statusLabels[status]}</span>
                    <span className="font-medium text-[#28180b]">{count} pesanan</span>
                  </div>
                  <div className="h-2 bg-[#fff1e9] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${statusColors[status]} rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#dac1b8]/10 p-5">
          <h3 className="font-serif text-xl text-[#28180b] mb-4">
            Metode Pembayaran
          </h3>
          {paymentMethods.length === 0 ? (
            <div className="text-center py-12 text-[#54433c]">
              Belum ada data pembayaran
            </div>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map((method, idx) => {
                const Icon = paymentIcons[method.paymentMethod] || paymentIcons.default;
                const total = paymentMethods.reduce((a, b) => a + b.total, 0);
                const percentage = total > 0 ? (method.total / total) * 100 : 0;
                return (
                  <div key={idx} className="flex items-center justify-between p-3 bg-[#fff1e9] rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                        <Icon className="w-5 h-5 text-[#823b18]" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#28180b]">{method.paymentMethod}</p>
                        <p className="text-xs text-[#54433c]">{method.count} transaksi</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#823b18]">{formatRupiah(method.total)}</p>
                      <p className="text-xs text-[#54433c]">{percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}