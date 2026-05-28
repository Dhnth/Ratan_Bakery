"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  User,
  Settings,
  LogOut,
  Info,
  Search,
  Coffee,
  X,
  Menu,
  AlertTriangle,
  ChevronDown,
  MinusIcon,
  PlusIcon,
  Phone,
} from "lucide-react";

// Tipe data
type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  category: string;
};

type CartItem = {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  category?: string;
};

type Settings = {
  maxItemsPerOrder: number;
  maxSpecialsItemsPerOrder: number;
  whatsappNumber: string;
  deliveryMinQuantity: number;
};

export default function CustomerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [dailyProducts, setDailyProducts] = useState<Product[]>([]);
  const [specialProducts, setSpecialProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    maxItemsPerOrder: 30,
    maxSpecialsItemsPerOrder: 4,
    whatsappNumber: "6281234567890",
    deliveryMinQuantity: 10,
  });
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [showExceedModal, setShowExceedModal] = useState(false);
  const [exceedProductName, setExceedProductName] = useState("");

  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [maxItemsRes, maxSpecialsItemsRes, whatsappRes, minQuantityRes] = await Promise.all([
          fetch("/api/settings?key=max_items_per_order"),
          fetch("/api/settings?key=max_specials_items_per_order"),
          fetch("/api/settings?key=whatsapp_number"),
          fetch("/api/settings?key=delivery_min_quantity"),
        ]);
        
        const maxItems = await maxItemsRes.json();
        const maxSpecialsItems = await maxSpecialsItemsRes.json();
        const whatsapp = await whatsappRes.json();
        const minQuantity = await minQuantityRes.json();
        
        setSettings({
          maxItemsPerOrder: maxItems.value ? parseInt(maxItems.value) : 30,
          maxSpecialsItemsPerOrder: maxSpecialsItems.value ? parseInt(maxSpecialsItems.value) : 4,
          whatsappNumber: whatsapp.value || "6281234567890",
          deliveryMinQuantity: minQuantity.value ? parseInt(minQuantity.value) : 10,
        });
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [dailyRes, specialRes] = await Promise.all([
          fetch("/api/products?type=daily"),
          fetch("/api/products?type=special"),
        ]);
        const daily = await dailyRes.json();
        const special = await specialRes.json();
        setDailyProducts(daily);
        setSpecialProducts(special);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Fetch cart
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await fetch("/api/cart");
        const data = await res.json();
        const items = data.items || [];
        const itemsWithCategory = items.map((item: CartItem) => ({
          ...item,
          category: item.price >= 20000 ? "special" : "daily",
        }));
        setCart(itemsWithCategory);
        const total = itemsWithCategory.reduce(
          (sum: number, item: CartItem) => sum + item.quantity,
          0,
        );
        setCartCount(total);
      } catch (error) {
        console.error("Error fetching cart:", error);
      }
    };
    if (session) {
      fetchCart();
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
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
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

  // Hitung maksimal pembelian per produk
  const getMaxPurchasePerProduct = (product: Product) => {
    if (product.category === "special") {
      // Spesial Order: batas per item sama dengan total batas (4 pcs)
      return settings.maxSpecialsItemsPerOrder;
    }
    // Daily Product: 30% dari stok atau maxItemsPerOrder (30), ambil yang lebih kecil
    const maxFromStock = Math.floor(product.stock * 0.3);
    return Math.min(maxFromStock, settings.maxItemsPerOrder);
  };

  const addToCart = async (product: Product) => {
    // Cek stok untuk daily product
    if (product.category === "daily" && product.stock <= 0) {
      return;
    }

    // Cek batas maksimal pembelian per produk
    const maxPurchase = getMaxPurchasePerProduct(product);
    const currentItemInCart = cart.find(item => item.productId === product.id);
    const currentQuantity = currentItemInCart?.quantity || 0;
    
    if (currentQuantity >= maxPurchase) {
      setExceedProductName(product.name);
      setShowExceedModal(true);
      return;
    }

    // Cek batas maksimal TOTAL spesial order (maks 4 item dari semua spesial order)
    if (product.category === "special") {
      const currentSpecialCount = cart
        .filter(item => item.category === "special")
        .reduce((sum, item) => sum + item.quantity, 0);
      
      if (currentSpecialCount >= settings.maxSpecialsItemsPerOrder) {
        setShowLimitWarning(true);
        setTimeout(() => setShowLimitWarning(false), 3000);
        return;
      }
    }

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          quantity: 1,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const itemsWithCategory = (data.items || []).map((item: CartItem) => ({
          ...item,
          category: item.price >= 20000 ? "special" : "daily",
        }));
        setCart(itemsWithCategory);
        const total = itemsWithCategory.reduce(
          (sum: number, item: CartItem) => sum + item.quantity,
          0,
        );
        setCartCount(total);
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const updateCartQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    // Cek batas maksimal untuk spesial order
    const item = cart.find(i => i.productId === productId);
    if (!item) return;
    
    // Cari produk asli untuk cek batas maksimal
    const allProducts = [...dailyProducts, ...specialProducts];
    const product = allProducts.find(p => p.id === productId);
    
    if (product) {
      const maxPurchase = getMaxPurchasePerProduct(product);
      if (newQuantity > maxPurchase) {
        setExceedProductName(product.name);
        setShowExceedModal(true);
        return;
      }
    }
    
    // Cek batas TOTAL spesial order
    if (item?.category === "special") {
      const currentSpecialCount = cart
        .filter(i => i.category === "special")
        .reduce((sum, i) => sum + i.quantity, 0);
      
      const newSpecialCount = currentSpecialCount + (newQuantity - item.quantity);
      
      if (newSpecialCount > settings.maxSpecialsItemsPerOrder) {
        setShowLimitWarning(true);
        setTimeout(() => setShowLimitWarning(false), 3000);
        return;
      }
    }

    try {
      const res = await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: newQuantity }),
      });
      const data = await res.json();
      if (res.ok) {
        const itemsWithCategory = (data.items || []).map((item: CartItem) => ({
          ...item,
          category: item.price >= 20000 ? "special" : "daily",
        }));
        setCart(itemsWithCategory);
        const total = itemsWithCategory.reduce(
          (sum: number, item: CartItem) => sum + item.quantity,
          0,
        );
        setCartCount(total);
      }
    } catch (error) {
      console.error("Error updating cart:", error);
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      const res = await fetch(`/api/cart?productId=${productId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        const itemsWithCategory = (data.items || []).map((item: CartItem) => ({
          ...item,
          category: item.price >= 20000 ? "special" : "daily",
        }));
        setCart(itemsWithCategory);
        const total = itemsWithCategory.reduce(
          (sum: number, item: CartItem) => sum + item.quantity,
          0,
        );
        setCartCount(total);
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  };

  const filteredDailyProducts = dailyProducts.filter((product) =>
    product.name.toLowerCase().includes(debouncedSearch.toLowerCase()),
  );

  const filteredSpecialProducts = specialProducts.filter((product) =>
    product.name.toLowerCase().includes(debouncedSearch.toLowerCase()),
  );

  // Hitung statistik keranjang untuk modal
  const dailyTotal = cart
    .filter((item) => item.category === "daily")
    .reduce((sum, item) => sum + item.quantity, 0);

  const specialTotal = cart
    .filter((item) => item.category === "special")
    .reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const hasSpecialInCart = specialTotal > 0;

  const handleCheckout = () => {
    // Cek batas maksimal spesial order sebelum checkout
    if (specialTotal > settings.maxSpecialsItemsPerOrder) {
      const whatsappUrl = `https://wa.me/${settings.whatsappNumber}?text=Halo%20Ratan%20Bakery,%20saya%20ingin%20memesan%20Spesial%20Order%20lebih%20dari%20${settings.maxSpecialsItemsPerOrder}%20item.%20Apakah%20bisa%20diproses?`;
      window.open(whatsappUrl, "_blank");
      return;
    }
    
    setIsCheckoutModalOpen(true);
  };

  const proceedToCheckout = () => {
    setIsCheckoutModalOpen(false);
    router.push("/customer/checkout");
  };

  const handleContactSeller = () => {
    const whatsappUrl = `https://wa.me/${settings.whatsappNumber}?text=Halo%20Ratan%20Bakery,%20saya%20ingin%20memesan%20${exceedProductName}%20lebih%20banyak.%20Apakah%20bisa%20diproses?`;
    window.open(whatsappUrl, "_blank");
    setShowExceedModal(false);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-[#fff8f5] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#823b18] border-t-transparent rounded-full animate-spin cursor-pointer" />
      </div>
    );
  }

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
      <div className="flex min-h-[calc(100vh-73px)] relative">
        <main
          className={`flex-1 transition-all duration-300 w-full px-4 sm:px-6 py-6 sm:py-8 ${
            isCartOpen ? "lg:pr-[416px]" : ""
          }`}
        >
          <div className="max-w-7xl mx-auto">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-[#ffdbcd] to-[#fbddc7] rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#823b18] flex items-center justify-center">
                  <Coffee className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-serif text-xl sm:text-2xl text-[#28180b]">
                    Selamat datang, {session?.user?.name?.split(" ")[0]}
                  </h1>
                  <p className="text-[#54433c] text-xs sm:text-sm mt-1">
                    Nikmati roti artisanal terbaik dari dapur kami.
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
                placeholder="Cari produk favoritmu..."
                className="w-full bg-white border border-[#dac1b8] rounded-xl pl-10 pr-4 py-2.5 sm:py-3 text-sm text-[#28180b] placeholder:text-[#87736b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none transition-all shadow-sm cursor-pointer"
              />
            </div>

            {/* Roti Harian Section */}
            <div className="mb-10 sm:mb-12">
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-5 sm:h-6 bg-[#823b18] rounded-full" />
                  <h2 className="font-serif text-2xl sm:text-3xl text-[#823b18]">
                    Roti Harian
                  </h2>
                </div>
                <p className="text-[#54433c] text-xs sm:text-sm ml-3">
                  Dibuat segar setiap pagi untuk menjamin kualitas terbaik.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
                {filteredDailyProducts.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ y: -5 }}
                    className="group bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3 shadow-sm border border-[#dac1b8]/10 hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
                  >
                    <div className="aspect-square overflow-hidden rounded-lg sm:rounded-xl mb-2 sm:mb-3 relative bg-[#ffeadc]">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-3xl sm:text-4xl">🥐</span>
                        </div>
                      )}
                      {product.stock <= 0 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                          <span className="text-white text-xs font-bold px-2 py-1 bg-red-600 rounded-full">
                            Habis
                          </span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-serif text-sm sm:text-base font-semibold text-[#28180b] line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-[#54433c] mt-0.5 sm:mt-1 line-clamp-2 flex-1">
                      {product.description}
                    </p>
                    <div className="flex flex-col gap-1 mt-2 sm:mt-3 pt-1.5 sm:pt-2 border-t border-[#dac1b8]/10">
                      <div className="flex items-center justify-between">
                        <span className="text-[#823b18] font-bold text-xs sm:text-sm">
                          {formatRupiah(product.price)}
                        </span>
                        <button
                          onClick={() => addToCart(product)}
                          disabled={product.stock <= 0}
                          className={`bg-[#823b18] text-white px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition-all flex items-center gap-1 shadow-sm ${
                            product.stock <= 0
                              ? "opacity-50 cursor-not-allowed bg-gray-400"
                              : "hover:bg-[#a0522d] hover:shadow-md cursor-pointer"
                          }`}
                        >
                          <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          Tambah
                        </button>
                      </div>
                      <p className="text-[9px] text-[#54433c]/60">
                        Stok: {product.stock} pcs
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
              {filteredDailyProducts.length === 0 && (
                <div className="text-center py-10 sm:py-12 text-[#54433c] bg-white rounded-2xl border border-[#dac1b8]/10">
                  <Search className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-[#dac1b8]" />
                  <p className="text-sm">Tidak ada produk yang ditemukan</p>
                </div>
              )}
            </div>

            {/* Spesial Order Section */}
            <div>
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-5 sm:h-6 bg-[#823b18] rounded-full" />
                  <h2 className="font-serif text-2xl sm:text-3xl text-[#823b18]">
                    Spesial Order
                  </h2>
                </div>
                <p className="text-[#54433c] text-xs sm:text-sm ml-3">
                  Produk eksklusif yang bisa dipesan terlebih dahulu. Maksimal {settings.maxSpecialsItemsPerOrder} item per pesanan.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
                {filteredSpecialProducts.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ y: -5 }}
                    className="group bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3 shadow-sm border border-[#dac1b8]/10 hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
                  >
                    <div className="aspect-square overflow-hidden rounded-lg sm:rounded-xl mb-2 sm:mb-3 relative bg-[#ffeadc]">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-3xl sm:text-4xl">🍰</span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-[#823b18]/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Pre-order
                      </div>
                    </div>
                    <h3 className="font-serif text-sm sm:text-base font-semibold text-[#28180b] line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-[#54433c] mt-0.5 sm:mt-1 line-clamp-2 flex-1">
                      {product.description}
                    </p>
                    <div className="flex flex-col gap-1 mt-2 sm:mt-3 pt-1.5 sm:pt-2 border-t border-[#dac1b8]/10">
                      <div className="flex items-center justify-between">
                        <span className="text-[#823b18] font-bold text-xs sm:text-sm">
                          {formatRupiah(product.price)}
                        </span>
                        <button
                          onClick={() => addToCart(product)}
                          className="bg-[#823b18] text-white px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition-all flex items-center gap-1 shadow-sm hover:bg-[#a0522d] hover:shadow-md cursor-pointer"
                        >
                          <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          Pesan
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              {filteredSpecialProducts.length === 0 && (
                <div className="text-center py-10 sm:py-12 text-[#54433c] bg-white rounded-2xl border border-[#dac1b8]/10">
                  <Search className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-[#dac1b8]" />
                  <p className="text-sm">
                    Tidak ada produk spesial yang ditemukan
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Limit Warning Toast */}
        <AnimatePresence>
          {showLimitWarning && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-4 py-2 rounded-xl shadow-lg text-sm"
            >
              Maksimal pesanan Spesial Order {settings.maxSpecialsItemsPerOrder} item
            </motion.div>
          )}
        </AnimatePresence>

        {/* Exceed Limit Modal */}
        <AnimatePresence>
          {showExceedModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
              >
                <div className="p-5 border-b border-[#dac1b8]/10 bg-gradient-to-r from-[#ffdbcd]/20 to-transparent">
                  <h3 className="font-serif text-xl text-[#823b18]">
                    Batas Pembelian
                  </h3>
                </div>
                <div className="p-5 space-y-4">
                  <div className="bg-amber-50 rounded-xl p-4 flex items-start gap-3 border border-amber-200">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">
                        Anda telah mencapai batas maksimal pembelian
                      </p>
                      <p className="text-sm text-amber-700 mt-1">
                        Produk <strong>{exceedProductName}</strong> memiliki batas maksimal pembelian.
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-[#54433c]">
                    Jika Anda ingin memesan dalam jumlah lebih banyak, silakan hubungi kami langsung.
                  </p>
                </div>
                <div className="flex gap-3 p-5 pt-0">
                  <button
                    onClick={() => setShowExceedModal(false)}
                    className="flex-1 px-4 py-2.5 border border-[#dac1b8] text-[#54433c] rounded-xl text-sm font-semibold hover:bg-[#fff1e9] transition-all cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    onClick={handleContactSeller}
                    className="flex-1 bg-[#823b18] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#a0522d] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Hubungi Penjual
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* DESKTOP: Bookmark-style Cart Trigger */}
        <motion.div
          className="hidden lg:block fixed right-0 top-2/5 -translate-y-1/2 z-45"
          animate={{ x: isCartOpen ? -384 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <motion.button
            onClick={() => setIsCartOpen(!isCartOpen)}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="relative flex items-center gap-2 bg-[#823b18] text-white shadow-lg cursor-pointer"
            style={{
              padding: "16px 12px",
              borderTopLeftRadius: "40px",
              borderBottomLeftRadius: "40px",
              borderTopRightRadius: "0",
              borderBottomRightRadius: "0",
            }}
            animate={{
              paddingRight: isHovered ? "24px" : "8px",
            }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-2 -right-0 bg-[#496800] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-md"
                >
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
            <ShoppingCart className="w-5 h-5" />
            <motion.span
              className="text-sm font-semibold whitespace-nowrap overflow-hidden"
              animate={{
                width: isHovered ? "auto" : 0,
                opacity: isHovered ? 1 : 0,
                marginLeft: isHovered ? 4 : 0,
              }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              style={{ display: "inline-block" }}
            >
              Keranjang
            </motion.span>
          </motion.button>
        </motion.div>

        {/* MOBILE: Floating Action Button */}
        <motion.div
          className="lg:hidden fixed bottom-6 right-6 z-45"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <motion.button
            onClick={() => setIsCartOpen(!isCartOpen)}
            className="relative bg-[#823b18] text-white p-4 rounded-full shadow-lg cursor-pointer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-2 -right-2 bg-[#496800] text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-md"
                >
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
            <ShoppingCart className="w-6 h-6" />
          </motion.button>
        </motion.div>

        {/* Right Sidebar - Cart */}
        <aside
          className={`fixed right-0 top-[73px] bottom-0 z-40 w-80 sm:w-96 bg-white border-l border-[#dac1b8]/20 shadow-xl flex flex-col transition-transform duration-300 ${
            isCartOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="p-4 sm:p-5 border-b border-[#dac1b8]/20 bg-gradient-to-r from-[#ffdbcd]/20 to-transparent">
            <div className="flex justify-between items-center">
              <h3 className="font-serif text-lg sm:text-xl text-[#823b18] flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Keranjang Saya
                {cartCount > 0 && (
                  <span className="bg-[#823b18] text-white text-xs px-2 py-0.5 rounded-full">
                    {cartCount} item
                  </span>
                )}
              </h3>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 text-[#823b18] hover:bg-[#ffdad6] rounded-lg transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-10 sm:py-16 text-[#54433c]">
                <ShoppingCart className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-[#dac1b8]" />
                <p className="font-medium">Keranjang kosong</p>
                <p className="text-xs sm:text-sm mt-1">
                  Yuk, belanja roti favoritmu!
                </p>
              </div>
            ) : (
              <>
                {/* Roti Harian Section */}
                {cart.some(item => item.category === "daily") && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1 h-4 bg-[#823b18] rounded-full" />
                      <p className="text-xs font-semibold text-[#823b18] uppercase tracking-wider">
                        Roti Harian
                      </p>
                    </div>
                    <div className="space-y-3">
                      {cart
                        .filter(item => item.category === "daily")
                        .map((item) => (
                          <div
                            key={item.productId}
                            className="flex gap-3 group bg-[#fff8f5] p-3 rounded-xl hover:shadow-md transition-all"
                          >
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-[#ffeadc] shrink-0 relative">
                              {item.imageUrl ? (
                                <Image
                                  src={item.imageUrl}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="text-2xl">🥐</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-[#28180b] text-xs sm:text-sm">
                                {item.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <button
                                  onClick={() =>
                                    updateCartQuantity(item.productId, item.quantity - 1)
                                  }
                                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#fff1e9] flex items-center justify-center hover:bg-[#ffe3cf] transition-all cursor-pointer text-xs font-bold"
                                >
                                  <MinusIcon className="size-4 text-[#823b18]" />
                                </button>
                                <span className="text-xs sm:text-sm w-5 sm:w-6 text-center font-medium text-[#28180b]">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    updateCartQuantity(item.productId, item.quantity + 1)
                                  }
                                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#fff1e9] flex items-center justify-center hover:bg-[#ffe3cf] transition-all cursor-pointer text-xs font-bold"
                                >
                                  <PlusIcon className="size-4 text-[#823b18]" />
                                </button>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-[#823b18] text-sm">
                                {formatRupiah(item.price * item.quantity)}
                              </p>
                              <p className="text-[10px] text-[#54433c]">
                                {item.quantity} x {formatRupiah(item.price)}
                              </p>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.productId)}
                              className="text-[#54433c] hover:text-[#ba1a1a] opacity-0 group-hover:opacity-100 transition-all p-1 cursor-pointer self-start"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Spesial Order Section */}
                {cart.some(item => item.category === "special") && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1 h-4 bg-[#823b18] rounded-full" />
                      <p className="text-xs font-semibold text-[#823b18] uppercase tracking-wider">
                        Spesial Order
                      </p>
                    </div>
                    <div className="space-y-3">
                      {cart
                        .filter(item => item.category === "special")
                        .map((item) => (
                          <div
                            key={item.productId}
                            className="flex gap-3 group bg-[#fff8f5] p-3 rounded-xl hover:shadow-md transition-all"
                          >
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-[#ffeadc] shrink-0 relative">
                              {item.imageUrl ? (
                                <Image
                                  src={item.imageUrl}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="text-2xl">🍰</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-[#28180b] text-xs sm:text-sm">
                                {item.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <button
                                  onClick={() =>
                                    updateCartQuantity(item.productId, item.quantity - 1)
                                  }
                                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#fff1e9] flex items-center justify-center hover:bg-[#ffe3cf] transition-all cursor-pointer text-xs font-bold"
                                >
                                  <MinusIcon className="size-4 text-[#823b18]" />
                                </button>
                                <span className="text-xs sm:text-sm w-5 sm:w-6 text-center font-medium text-[#28180b]">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    updateCartQuantity(item.productId, item.quantity + 1)
                                  }
                                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#fff1e9] flex items-center justify-center hover:bg-[#ffe3cf] transition-all cursor-pointer text-xs font-bold"
                                >
                                  <PlusIcon className="size-4 text-[#823b18]" />
                                </button>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-[#823b18] text-sm">
                                {formatRupiah(item.price * item.quantity)}
                              </p>
                              <p className="text-[10px] text-[#54433c]">
                                {item.quantity} x {formatRupiah(item.price)}
                              </p>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.productId)}
                              className="text-[#54433c] hover:text-[#ba1a1a] opacity-0 group-hover:opacity-100 transition-all p-1 cursor-pointer self-start"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-[#dac1b8]/20 bg-gradient-to-t from-[#fff8f5] to-white">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs">
                  <span className="text-[#54433c]">Subtotal</span>
                  <span className="font-medium text-[#28180b]">
                    {formatRupiah(subtotal)}
                  </span>
                </div>
                
                <div className="border-t border-[#dac1b8]/10 pt-2">
                  <p className="text-[10px] text-[#54433c] uppercase tracking-wider mb-2 font-semibold">
                    Detail Item
                  </p>
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[10px] py-1">
                      <span className="text-[#54433c]">
                        {item.name} <span className="font-medium">x{item.quantity}</span>
                      </span>
                      <span className="font-medium text-[#28180b]">
                        {formatRupiah(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="pt-2 border-t border-[#dac1b8]/20 flex justify-between">
                  <span className="font-bold text-[#28180b] text-sm">Total</span>
                  <span className="font-bold text-[#823b18] text-base sm:text-xl">
                    {formatRupiah(subtotal)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-gradient-to-r from-[#823b18] to-[#a0522d] text-white py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base text-center hover:shadow-lg transition-all transform hover:scale-[1.02] cursor-pointer"
              >
                Checkout Sekarang
              </button>
              <p className="text-[9px] sm:text-[10px] text-center text-[#54433c] mt-2">
                Pajak sudah termasuk dalam harga
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* Overlay untuk mobile saat cart terbuka */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden cursor-pointer"
            onClick={() => setIsCartOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Modal Checkout Peringatan */}
      <AnimatePresence>
        {isCheckoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
            >
              <div className="p-5 border-b border-[#dac1b8]/10 bg-gradient-to-r from-[#ffdbcd]/20 to-transparent">
                <h3 className="font-serif text-xl text-[#823b18]">
                  Konfirmasi Checkout
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="bg-[#fff1e9] rounded-xl p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#54433c]">Roti Harian:</span>
                    <span className="font-semibold text-[#54433c]">
                      {dailyTotal} pcs
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#54433c]">Spesial Order:</span>
                    <span className="font-semibold text-[#54433c]">
                      {specialTotal} pcs
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[#dac1b8]/20">
                    <span className="text-[#54433c]">Subtotal:</span>
                    <span className="font-bold text-[#823b18]">
                      {formatRupiah(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#54433c]">Ongkir:</span>
                    <span className="font-semibold text-[#496800]">
                      Akan dihitung di checkout
                    </span>
                  </div>
                </div>

                {hasSpecialInCart && (
                  <div className="bg-red-50 rounded-xl p-3 flex items-start gap-2 border border-red-200">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-red-800">
                        Perhatian!
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        Anda memesan <strong>Spesial Order</strong>. Seluruh
                        pesanan akan diproses dan siap diambil/diantar pada{" "}
                        <strong className="font-semibold">H+1 (besok)</strong>.
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 rounded-xl p-3 flex items-start gap-2 border border-blue-200">
                  <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-blue-700">
                      <strong className="font-semibold">
                        Syarat pengantaran:
                      </strong>
                      <br />• Minimal {settings.deliveryMinQuantity} Roti Harian <strong>ATAU</strong>
                      <br />
                      • Minimal belanja Rp 50.000
                      <br />
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 p-5 pt-0">
                <button
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-[#dac1b8] text-[#54433c] rounded-xl text-sm font-semibold hover:bg-[#fff1e9] transition-all cursor-pointer"
                >
                  Kembali
                </button>
                <button
                  onClick={proceedToCheckout}
                  className="flex-1 bg-[#823b18] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#a0522d] transition-all cursor-pointer"
                >
                  Lanjutkan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}