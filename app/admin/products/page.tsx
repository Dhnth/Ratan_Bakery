"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  X,
  Save,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  TrendingUp,
  HousePlug as Inventory2,
  Image as ImageIcon,
  Tag,
  Layers,
  DollarSign,
  Box,
  ToggleLeft,
  ToggleRight,
  Upload,
  Loader2,
  ChevronDown,
  AlertCircle,
  Link,
} from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";

// Tipe data produk
type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  maxPerOrder: number;
  category: string; // 'daily' atau 'special'
  createdAt: string;
  updatedAt: string;
};

type ProductFormData = {
  id?: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  maxPerOrder: number;
  isActive: boolean;
  category: string;
};

const defaultFormData: ProductFormData = {
  name: "",
  description: "",
  price: 0,
  stock: 0,
  imageUrl: "",
  maxPerOrder: 10,
  isActive: true,
  category: "daily",
};

const categories = [
  { id: "all", name: "Semua Kategori" },
  { id: "daily", name: "Roti Harian" },
  { id: "special", name: "Spesial Order" },
];

const categoryOptions = [
  { id: "daily", name: "Roti Harian" },
  { id: "special", name: "Spesial Order" },
];

// Opsi sorting
type SortOption = {
  id: string;
  name: string;
  sortBy: keyof Product;
  order: "asc" | "desc";
};

const sortOptions: SortOption[] = [
  { id: "newest", name: "Terbaru", sortBy: "createdAt", order: "desc" },
  { id: "oldest", name: "Terlama", sortBy: "createdAt", order: "asc" },
  { id: "stock_low", name: "Stok Sedikit", sortBy: "stock", order: "asc" },
  { id: "stock_high", name: "Stok Terbanyak", sortBy: "stock", order: "desc" },
  { id: "price_low", name: "Termurah", sortBy: "price", order: "asc" },
  { id: "price_high", name: "Termahal", sortBy: "price", order: "desc" },
];

// Toast notification
const showToast = (message: string, type: "success" | "error" = "success") => {
  const toast = document.createElement("div");
  toast.className = `fixed top-20 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-right-5 ${
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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSort, setSelectedSort] = useState<SortOption>(sortOptions[0]);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(defaultFormData);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch products
  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      try {
        const res = await fetch(
          `/api/admin/products?search=${encodeURIComponent(debouncedSearch)}`,
        );
        const data = await res.json();
        if (res.ok && isMounted) {
          setProducts(data);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [debouncedSearch]);

  // Filter dan sort products
  const filteredProducts = products
    .filter((product) => {
      if (selectedCategory === "daily") return product.category === "daily";
      if (selectedCategory === "special") return product.category === "special";
      return true;
    })
    .sort((a, b) => {
      const { sortBy, order } = selectedSort;

      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === "createdAt") {
        valA = new Date(valA as string).getTime();
        valB = new Date(valB as string).getTime();
      }

      // fallback kalau null / undefined
      const safeValA = valA ?? "";
      const safeValB = valB ?? "";

      if (order === "asc") {
        return safeValA < safeValB ? -1 : safeValA > safeValB ? 1 : 0;
      } else {
        return safeValA > safeValB ? -1 : safeValA < safeValB ? 1 : 0;
      }
    });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStockPercentage = (stock: number) => {
    const maxStock = 100;
    return Math.min((stock / maxStock) * 100, 100);
  };

  const getStockColor = (stock: number) => {
    if (stock <= 10) return "bg-red-500";
    if (stock <= 30) return "bg-yellow-500";
    return "bg-emerald-500";
  };

  const getCategoryLabel = (category: string) => {
    return category === "daily" ? "Roti Harian" : "Spesial Order";
  };

  const getCategoryClass = (category: string) => {
    return category === "daily"
      ? "bg-[#e4e4cc] text-[#4f513f]"
      : "bg-[#ffdbcd] text-[#823b18]";
  };

  const refreshProducts = async () => {
    try {
      const res = await fetch(
        `/api/admin/products?search=${encodeURIComponent(debouncedSearch)}`,
      );
      const data = await res.json();
      if (res.ok) {
        setProducts(data);
      }
    } catch (err) {
      console.error("Error refreshing products:", err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setFormError("");

    const formDataUpload = new FormData();
    formDataUpload.append("image", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formDataUpload,
      });

      const data = await res.json();

      if (res.ok) {
        setFormData((prev) => ({ ...prev, imageUrl: data.url }));
        setImagePreview(data.url);
        showToast("Gambar berhasil diupload!", "success");
      } else {
        showToast(data.error || "Gagal upload gambar", "error");
      }
    } catch {
      showToast("Terjadi kesalahan saat upload", "error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        id: product.id,
        name: product.name,
        description: product.description || "",
        price: product.price,
        stock: product.stock,
        imageUrl: product.imageUrl || "",
        maxPerOrder: product.maxPerOrder,
        isActive: product.isActive,
        category: product.category,
      });
      setImagePreview(product.imageUrl || "");
    } else {
      setEditingProduct(null);
      setFormData(defaultFormData);
      setImagePreview("");
    }
    setFormError("");
    setFormSuccess("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData(defaultFormData);
    setImagePreview("");
    setFormError("");
    setFormSuccess("");
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "price" || name === "stock" || name === "maxPerOrder"
            ? parseInt(value) || 0
            : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");
    setFormSuccess("");

    if (!formData.name || formData.price <= 0) {
      showToast("Nama dan harga wajib diisi dengan benar", "error");
      setIsSubmitting(false);
      return;
    }

    if (!formData.category) {
      showToast("Kategori wajib dipilih", "error");
      setIsSubmitting(false);
      return;
    }

    try {
      const url = "/api/admin/products";
      const method = editingProduct ? "PUT" : "POST";
      const body = editingProduct
        ? { ...formData, id: editingProduct.id }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        showToast(
          editingProduct
            ? "Produk berhasil diupdate!"
            : "Produk berhasil ditambahkan!",
          "success",
        );
        closeModal();
        await refreshProducts();
      } else {
        showToast(data.error || "Terjadi kesalahan", "error");
      }
    } catch {
      showToast("Gagal menyimpan produk", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setProductToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      const res = await fetch(`/api/admin/products?id=${productToDelete}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("Produk berhasil dihapus!", "success");
        await refreshProducts();
      } else {
        showToast("Gagal menghapus produk", "error");
      }
    } catch {
      showToast("Terjadi kesalahan", "error");
    } finally {
      setProductToDelete(null);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    try {
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...product,
          isActive: !currentStatus,
        }),
      });

      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, isActive: !currentStatus } : p,
          ),
        );
        showToast(
          !currentStatus ? "Produk diaktifkan" : "Produk dinonaktifkan",
          "success",
        );
      }
    } catch {
      showToast("Gagal mengubah status", "error");
    }
  };

  const getLowStockCount = () => {
    return products.filter((p) => p.stock <= 10 && p.isActive).length;
  };

  const getTopPerformer = () => {
    if (products.length === 0) return null;
    return [...products].sort((a, b) => b.stock - a.stock)[0];
  };

  const selectedProduct = products.find((p) => p.id === productToDelete);
  const topPerformer = getTopPerformer();

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
            <span className="text-[#823b18] cursor-pointer">Produk</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-[#28180b] mb-1">
            Kelola Produk
          </h2>
          <p className="text-sm text-[#54433c] max-w-xl">
            Kelola pilihan roti Anda, update tingkat inventaris, dan atur rotasi
            pesanan spesial.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-[#823b18] text-white rounded-lg text-sm font-semibold hover:bg-[#a0522d] transition-all shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Produk
        </button>
      </div>

      {/* Filter & Search & Sort */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-[#dac1b8]/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#54433c]" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-white border border-[#dac1b8] rounded-lg py-2 pl-10 pr-4 text-sm text-[#28180b] appearance-none cursor-pointer hover:border-[#823b18] focus:border-[#823b18] focus:ring-1 focus:ring-[#823b18] outline-none transition-all"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#54433c]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari produk..."
              className="w-full bg-white border border-[#dac1b8] rounded-lg py-2 pl-10 pr-4 text-sm text-[#28180b] placeholder:text-[#87736b] focus:border-[#823b18] focus:ring-1 focus:ring-[#823b18] outline-none transition-all"
            />
          </div>
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#dac1b8] rounded-lg text-sm text-[#28180b] hover:border-[#823b18] transition-all cursor-pointer"
          >
            <span>Urutkan: {selectedSort.name}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isSortDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {isSortDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-48 bg-white border border-[#dac1b8] rounded-xl shadow-lg overflow-hidden z-20"
              >
                {sortOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setSelectedSort(option);
                      setIsSortDropdownOpen(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${
                      selectedSort.id === option.id
                        ? "bg-[#ffdbcd] text-[#823b18] font-semibold"
                        : "text-[#54433c] hover:bg-[#fff1e9]"
                    }`}
                  >
                    {option.name}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-[#dac1b8]/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#fff1e9]">
              <tr>
                <th className="p-4 text-xs font-semibold text-[#54433c] uppercase tracking-wider w-16 text-center">
                  Preview
                </th>
                <th className="p-4 text-xs font-semibold text-[#54433c] uppercase tracking-wider">
                  Info Produk
                </th>
                <th className="p-4 text-xs font-semibold text-[#54433c] uppercase tracking-wider">
                  Kategori
                </th>
                <th className="p-4 text-xs font-semibold text-[#54433c] uppercase tracking-wider">
                  Harga
                </th>
                <th className="p-4 text-xs font-semibold text-[#54433c] uppercase tracking-wider">
                  Stok
                </th>
                <th className="p-4 text-xs font-semibold text-[#54433c] uppercase tracking-wider text-center">
                  Status
                </th>
                <th className="p-4 text-xs font-semibold text-[#54433c] uppercase tracking-wider text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dac1b8]/5">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-[#54433c]"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Package className="w-12 h-12 text-[#dac1b8]" />
                      <p>Belum ada produk</p>
                      <button
                        onClick={() => openModal()}
                        className="mt-2 text-[#823b18] text-sm font-semibold hover:underline cursor-pointer"
                      >
                        Tambah produk pertama
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => {
                  const stockPercentage = getStockPercentage(product.stock);
                  const stockColor = getStockColor(product.stock);
                  const isLowStock = product.stock <= 10;
                  const categoryLabel = getCategoryLabel(product.category);
                  const categoryClass = getCategoryClass(product.category);

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-[#fff8f5] transition-colors group"
                    >
                      <td className="p-4">
                        <div className="w-14 h-14 rounded-lg overflow-hidden border border-[#dac1b8]/20 shadow-sm bg-[#ffeadc] relative">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-[#87736b]" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-serif text-base font-semibold text-[#28180b]">
                            {product.name}
                          </span>
                          <span className="text-xs text-[#54433c]/60">
                            SKU: {product.id.slice(0, 8).toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-bold ${categoryClass}`}
                        >
                          {categoryLabel}
                        </span>
                      </td>
                      {/* Harga */}
                      <td className="p-4">
                        <span className="font-semibold text-sm text-[#823b18]">
                          {formatRupiah(product.price)}
                        </span>
                      </td>

                      {/* Stok - Khusus untuk Special Order */}
                      <td className="p-4">
                        {product.category === "special" ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-[#823b18]">
                              Pre-order
                            </span>
                            <span className="text-[10px] text-[#54433c]">
                              Pesan H-1
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="flex-1 w-24 h-1.5 bg-[#dac1b8]/30 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${stockColor}`}
                                style={{ width: `${stockPercentage}%` }}
                              />
                            </div>
                            <span
                              className={`text-xs font-medium ${isLowStock ? "text-red-500" : "text-[#28180b]"}`}
                            >
                              {product.stock} pcs
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="p-4">
                        <div className="flex justify-center">
                          <button
                            onClick={() =>
                              handleToggleActive(product.id, product.isActive)
                            }
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                              product.isActive ? "bg-[#496800]" : "bg-[#dac1b8]"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                product.isActive
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="p-4">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => openModal(product)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#87736b] hover:bg-[#ffdbcd] hover:text-[#823b18] transition-all cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(product.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#87736b] hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-[#fff1e9] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#dac1b8]/10">
            <span className="text-xs text-[#54433c]">
              Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{" "}
              {Math.min(currentPage * itemsPerPage, filteredProducts.length)}{" "}
              dari {filteredProducts.length} produk
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
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#54433c] hover:bg-white disabled:opacity-50 transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-[#a0522d] text-[#ffe1d6] p-6 rounded-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="font-serif text-2xl mb-2">
              Cek Kesehatan Inventaris
            </h3>
            <p className="text-sm opacity-90 max-w-md mb-4">
              {getLowStockCount()} item saat ini hampir habis. Pertimbangkan
              untuk menjadwalkan pemanggangan ulang.
            </p>
            <button className="bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-white/30 transition-all cursor-pointer">
              Generate Daftar Restock
            </button>
          </div>
          <div className="absolute right-0 top-0 w-1/3 h-full bg-white/10 skew-x-12 translate-x-1/4" />
          <Inventory2 className="absolute right-4 bottom-4 w-24 h-24 opacity-10" />
        </div>

        <div className="bg-[#ffeadc] p-6 rounded-2xl border border-[#823b18]/10">
          <div className="flex justify-between items-start">
            <TrendingUp className="w-8 h-8 text-[#496800]" />
            <span className="px-2 py-1 rounded bg-[#c8f17a]/20 text-[#496800] text-[10px] font-bold">
              +12%
            </span>
          </div>
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-[#54433c] uppercase tracking-wider mb-1">
              Produk Terlaris
            </h4>
            <p className="font-serif text-xl text-[#28180b] leading-tight">
              {topPerformer?.name || "-"}
            </p>
            <p className="text-xs text-[#54433c]/60 mt-1">
              {topPerformer?.stock || 0} unit tersedia
            </p>
          </div>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setProductToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Hapus Produk"
        message="Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        productName={selectedProduct?.name}
        productSku={
          productToDelete
            ? productToDelete.slice(0, 8).toUpperCase()
            : undefined
        }
        productCategory={
          selectedProduct?.category
            ? getCategoryLabel(selectedProduct.category)
            : undefined
        }
        productPrice={
          selectedProduct?.price !== undefined
            ? formatRupiah(selectedProduct.price)
            : undefined
        }
      />

      {/* Modal Tambah/Edit Produk */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-[#dac1b8]/10 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#823b18]/10 flex items-center justify-center">
                    {editingProduct ? (
                      <Edit className="w-5 h-5 text-[#823b18]" />
                    ) : (
                      <Plus className="w-5 h-5 text-[#823b18]" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl text-[#823b18]">
                      {editingProduct ? "Edit Produk" : "Tambah Produk Baru"}
                    </h3>
                    <p className="text-xs text-[#54433c]">
                      {editingProduct
                        ? "Ubah informasi produk"
                        : "Isi formulir untuk menambah produk"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-lg hover:bg-[#ffdad6] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-[#54433c]" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {formError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Nama Produk */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-[#28180b] mb-1 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-[#823b18]" />
                      Nama Produk <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Contoh: Roti Coklat Lumer"
                      className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm text-[#28180b] placeholder:text-[#87736b] focus:border-[#823b18] focus:ring-2 focus:ring-[#823b18]/20 outline-none transition-all"
                    />
                  </div>

                  {/* Deskripsi */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-[#28180b] mb-1 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#823b18]" />
                      Deskripsi
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Deskripsikan produk roti Anda..."
                      className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm text-[#28180b] placeholder:text-[#87736b] focus:border-[#823b18] focus:ring-2 focus:ring-[#823b18]/20 outline-none resize-none"
                    />
                  </div>

                  {/* Harga */}
                  <div>
                    <label className="block text-sm font-semibold text-[#28180b] mb-1 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-[#823b18]" />
                      Harga (Rp) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price || ""}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="1000"
                      placeholder="0"
                      className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm text-[#28180b] placeholder:text-[#87736b] focus:border-[#823b18] focus:ring-2 focus:ring-[#823b18]/20 outline-none transition-all"
                    />
                  </div>

                  {/* Stok */}
                  <div>
                    <label className="block text-sm font-semibold text-[#28180b] mb-1 flex items-center gap-2">
                      <Box className="w-4 h-4 text-[#823b18]" />
                      Stok
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock || ""}
                      onChange={handleInputChange}
                      min="0"
                      placeholder="0"
                      className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm text-[#28180b] placeholder:text-[#87736b] focus:border-[#823b18] focus:ring-2 focus:ring-[#823b18]/20 outline-none transition-all"
                    />
                    <p className="text-[10px] text-[#54433c] mt-1">
                      Sisa stok produk saat ini
                    </p>
                  </div>

                  {/* Max Per Order */}
                  <div>
                    <label className="block text-sm font-semibold text-[#28180b] mb-1 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#823b18]" />
                      Max Per Order
                    </label>
                    <input
                      type="number"
                      name="maxPerOrder"
                      value={formData.maxPerOrder || ""}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm text-[#28180b] placeholder:text-[#87736b] focus:border-[#823b18] focus:ring-2 focus:ring-[#823b18]/20 outline-none transition-all"
                    />
                    <p className="text-[10px] text-[#54433c] mt-1">
                      Maksimal pembelian per pelanggan
                    </p>
                  </div>

                  {/* Kategori */}
                  <div>
                    <label className="block text-sm font-semibold text-[#28180b] mb-1 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#823b18]" />
                      Kategori <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm text-[#28180b] focus:border-[#823b18] focus:ring-2 focus:ring-[#823b18]/20 outline-none transition-all cursor-pointer"
                    >
                      {categoryOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Aktif */}
                  <div>
                    <label className="block text-sm font-semibold text-[#28180b] mb-1 flex items-center gap-2">
                      {formData.isActive ? (
                        <ToggleRight className="w-4 h-4 text-[#496800]" />
                      ) : (
                        <ToggleLeft className="w-4 h-4 text-[#dac1b8]" />
                      )}
                      Status Produk
                    </label>
                    <div className="flex items-center gap-3 h-11">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            isActive: !prev.isActive,
                          }))
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                          formData.isActive ? "bg-[#496800]" : "bg-[#dac1b8]"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            formData.isActive
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                      <span className="text-sm text-[#54433c]">
                        {formData.isActive
                          ? "Aktif (tampil di toko)"
                          : "Nonaktif (tersembunyi)"}
                      </span>
                    </div>
                  </div>

                  {/* Upload Gambar */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-[#28180b] mb-2 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-[#823b18]" />
                      Upload Gambar
                    </label>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="imageUpload"
                        />
                        <label
                          htmlFor="imageUpload"
                          className={`flex items-center gap-2 px-4 py-2 bg-[#fff1e9] border border-[#dac1b8] rounded-xl text-sm text-[#28180b] hover:bg-[#ffe3cf] transition-all cursor-pointer ${
                            isUploading ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Mengupload...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              Pilih Gambar
                            </>
                          )}
                        </label>
                        <span className="text-xs text-[#54433c]">
                          Max 2MB (JPG, PNG, WEBP)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-[#28180b] mb-2">
                        Preview Gambar
                      </label>
                      <div className="relative w-32 h-32 rounded-xl overflow-hidden bg-[#fff1e9] border-2 border-[#dac1b8] shadow-sm">
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, imageUrl: "" }));
                            setImagePreview("");
                          }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-[#dac1b8]/10">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2.5 border border-[#dac1b8] text-[#54433c] rounded-xl text-sm font-semibold hover:bg-[#fff1e9] transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-[#823b18] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#a0522d] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {isSubmitting
                      ? "Menyimpan..."
                      : editingProduct
                        ? "Update Produk"
                        : "Simpan Produk"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
