"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ShoppingCart,
  Truck,
  Smartphone,
  Landmark,
  AlertCircle,
  RefreshCw,
  MapPin,
  Phone,
  Clock,
  Store,
  User,
  CheckCircle,
  Upload,
  X,
  Save,
  Coffee,
  Copy,
  QrCode,
  MenuIcon,
  ChevronDown,
  LogOut,
  Settings,
  ChevronLeft,
} from "lucide-react";

const RouteMap = dynamic(() => import("@/components/RouteMap"), { ssr: false });

type CartItem = {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  category?: string;
};

type DeliveryFeeResponse = {
  success: boolean;
  distance: string;
  deliveryFee: number;
  isWithinRadius: boolean;
  canDeliver: boolean;
  message: string;
  storeLocation: { lat: number; lng: number; address: string };
  customerLocation: { lat: number; lng: number; address: string };
};

type PaymentAccount = {
  id: string;
  name: string;
  accountNumber: string;
  holderName: string;
  isActive: boolean;
};

type PaymentSettings = {
  bankAccounts: PaymentAccount[];
  ewalletAccounts: PaymentAccount[];
  qrisEnabled: boolean;
  qrisImageUrl: string;
};

// Jam operasional toko
const STORE_OPEN_HOUR = 8;
const STORE_CLOSE_HOUR = 20;

// Generate jam options (08:00 - 20:00 dengan interval 30 menit)
const generateTimeOptions = () => {
  const options = [];
  for (let hour = STORE_OPEN_HOUR; hour <= STORE_CLOSE_HOUR; hour++) {
    for (const minute of [0, 30]) {
      if (hour === STORE_CLOSE_HOUR && minute > 0) continue;
      const hourStr = hour.toString().padStart(2, "0");
      const minuteStr = minute.toString().padStart(2, "0");
      options.push(`${hourStr}:${minuteStr}`);
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryFeeResponse | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("BANK");
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [selectedEwalletId, setSelectedEwalletId] = useState<string>("");
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isCheckingAddress, setIsCheckingAddress] = useState(false);
  const [isCalculatingOngkir, setIsCalculatingOngkir] = useState(false);
  const [selectedTime, setSelectedTime] = useState(TIME_OPTIONS[0]);
  const [showSaveLocationModal, setShowSaveLocationModal] = useState(false);
  const [tempLocation, setTempLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    bankAccounts: [],
    ewalletAccounts: [],
    qrisEnabled: false,
    qrisImageUrl: "",
  });
  const [copiedText, setCopiedText] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch payment settings
  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        const res = await fetch("/api/settings/payment");
        if (res.ok) {
          const data = await res.json();
          setPaymentSettings({
            bankAccounts: data.bankAccounts || [],
            ewalletAccounts: data.ewalletAccounts || [],
            qrisEnabled: data.qrisEnabled === "true",
            qrisImageUrl: data.qrisImageUrl || "",
          });
        }
      } catch (error) {
        console.error("Error fetching payment settings:", error);
      }
    };
    fetchPaymentSettings();
  }, []);

  // Ambil data keranjang
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
      } catch (error) {
        console.error("Error fetching cart:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (session) {
      fetchCart();
    }
  }, [session]);

  // Ambil profil user untuk nomor telepon dan alamat tersimpan
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          if (data.phone) setCustomerPhone(data.phone);
          if (data.address && !deliveryAddress) setDeliveryAddress(data.address);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };
    if (session) {
      fetchUserProfile();
    }
  }, [session, deliveryAddress]);

  const activeBankAccounts = paymentSettings.bankAccounts.filter(acc => acc.isActive);
  const activeEwalletAccounts = paymentSettings.ewalletAccounts.filter(acc => acc.isActive);

  // Default values (tanpa setState di useEffect)
  const defaultBankId = paymentMethod === "BANK" && activeBankAccounts.length > 0 ? activeBankAccounts[0].id : "";
  const defaultEwalletId = paymentMethod === "EWALLET" && activeEwalletAccounts.length > 0 ? activeEwalletAccounts[0].id : "";

  // Gunakan default jika belum dipilih
  const bankIdToUse = selectedBankId || defaultBankId;
  const ewalletIdToUse = selectedEwalletId || defaultEwalletId;

  // Handle ganti metode pembayaran (event-driven)
  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
    
    if (method === "BANK" && activeBankAccounts.length > 0) {
      setSelectedBankId(activeBankAccounts[0].id);
    } else if (method === "EWALLET" && activeEwalletAccounts.length > 0) {
      setSelectedEwalletId(activeEwalletAccounts[0].id);
    }
  };

  // Hitung statistik keranjang
  const dailyTotal = cart
    .filter((item) => item.category === "daily")
    .reduce((sum, item) => sum + item.quantity, 0);
  const specialTotal = cart
    .filter((item) => item.category === "special")
    .reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const hasSpecialInCart = specialTotal > 0;
  
  // Syarat bisa diantar: (min 10 roti harian ATAU total >= 50000)
  const canDelivery = (dailyTotal >= 10 || subtotal >= 50000);

  // Info pesanan akan diproses besok jika ada spesial order
  const isNextDayDelivery = hasSpecialInCart;

  // Geocode alamat ke koordinat
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&accept-language=id`);
      const data = await res.json();
      if (data && data[0]) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
      return null;
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  };

  // Hitung ongkir dengan lokasi
  const calculateDeliveryFee = useCallback(async (address: string, lat: number, lng: number) => {
    setIsCalculatingOngkir(true);
    setError("");
    
    try {
      const url = `/api/checkout/delivery-fee?lat=${lat}&lng=${lng}&address=${encodeURIComponent(address)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setDeliveryInfo(data);
      } else {
        setError(data.error || "Gagal menghitung ongkir");
      }
    } catch {
      setError("Gagal menghitung ongkir");
    } finally {
      setIsCalculatingOngkir(false);
    }
  }, []);

  // Cek lokasi dari alamat manual
  const checkLocationFromAddress = useCallback(async () => {
    if (!deliveryAddress.trim()) {
      setError("Masukkan alamat terlebih dahulu");
      return;
    }

    setIsCheckingAddress(true);
    setError("");
    
    try {
      const coords = await geocodeAddress(deliveryAddress);
      if (!coords) {
        setError("Tidak dapat menemukan lokasi dari alamat yang dimasukkan");
        return;
      }
      
      await calculateDeliveryFee(deliveryAddress, coords.lat, coords.lng);
    } catch {
      setError("Gagal memproses alamat");
    } finally {
      setIsCheckingAddress(false);
    }
  }, [deliveryAddress, calculateDeliveryFee]);

  // Handle get current location
  const handleGetCurrentLocation = useCallback(() => {
    setIsGettingLocation(true);
    setError("");
    
    if (!navigator.geolocation) {
      setError("Browser tidak mendukung geolocation");
      setIsGettingLocation(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=id`);
          const geoData = await geoRes.json();
          const addressText = geoData.display_name || `Lokasi saat ini (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          
          setDeliveryAddress(addressText);
          await calculateDeliveryFee(addressText, latitude, longitude);
          setTempLocation({ lat: latitude, lng: longitude, address: addressText });
        } catch {
          const addressText = `Lokasi saat ini (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          setDeliveryAddress(addressText);
          await calculateDeliveryFee(addressText, latitude, longitude);
          setTempLocation({ lat: latitude, lng: longitude, address: addressText });
        }
        setIsGettingLocation(false);
      },
      (err) => {
        setError("Gagal mendapatkan lokasi: " + err.message);
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [calculateDeliveryFee]);

  // Handle upload bukti pembayaran
  const handlePaymentProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentProof(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(""), 2000);
  };

  // Redirect jika belum login atau keranjang kosong
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (!isLoading && cart.length === 0) {
      router.push("/customer");
    }
  }, [status, isLoading, cart.length, router]);

  // Hitung tanggal pengambilan (H+1 jika ada spesial order)
  const getPickupDate = () => {
    const date = new Date();
    if (isNextDayDelivery) {
      date.setDate(date.getDate() + 1);
    }
    return date.toISOString().split("T")[0];
  };

  const total = subtotal + (deliveryMethod === "DELIVERY" ? (deliveryInfo?.deliveryFee || 0) : 0);
  const canProceedCheckout = deliveryMethod === "PICKUP" || (deliveryInfo?.canDeliver !== false && canDelivery);

  const formatRupiah = (amount: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Simpan lokasi ke profil
  const saveLocationToProfile = async () => {
    if (!tempLocation || !pendingOrderId) return;
    
    try {
      await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: tempLocation.address,
          latitude: tempLocation.lat,
          longitude: tempLocation.lng,
        }),
      });
    } catch (error) {
      console.error("Error saving location:", error);
    }
    
    setShowSaveLocationModal(false);
    router.push(`/customer/orders/${pendingOrderId}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    if (!customerPhone) {
      setError("Nomor WhatsApp wajib diisi");
      setIsSubmitting(false);
      return;
    }

    if (deliveryMethod === "DELIVERY" && !deliveryInfo) {
      setError("Silakan cek lokasi terlebih dahulu");
      setIsSubmitting(false);
      return;
    }

    // Upload bukti transfer
    let paymentProofUrl = "";
    if (paymentProof) {
      const formData = new FormData();
      formData.append("proof", paymentProof);
      const uploadRes = await fetch("/api/upload/proof", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (uploadRes.ok) {
        paymentProofUrl = uploadData.url;
      }
    }

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupDate: getPickupDate(),
          pickupTime: selectedTime,
          deliveryMethod,
          deliveryAddress: deliveryMethod === "DELIVERY" ? deliveryAddress : null,
          notes,
          paymentMethod,
          selectedBankId: paymentMethod === "BANK" ? bankIdToUse : null,
          selectedEwalletId: paymentMethod === "EWALLET" ? ewalletIdToUse : null,
          paymentProofUrl,
          customerPhone,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setPendingOrderId(data.orderId);
        if (tempLocation) {
          setShowSaveLocationModal(true);
        } else {
          router.push(`/customer/orders/${data.orderId}`);
        }
      } else {
        setError(data.error || "Gagal memproses pesanan");
      }
    } catch {
      setError("Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-[#fff8f5] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#823b18] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff8f5] relative paper-grain">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl text-[#823b18] mb-2">Selesaikan Pesanan</h1>
          <p className="text-[#54433c] italic">Lengkapi detail untuk menikmati kehangatan roti artisan kami langsung di rumah Anda.</p>
        </div>

        {/* Info Peringatan Spesial Order */}
        {hasSpecialInCart && (
          <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Informasi Spesial Order</p>
                <p className="text-sm text-amber-700 mt-1">
                  Anda memesan Spesial Order. Pesanan akan diproses dan siap diambil/diantar pada <strong>H+1 (besok)</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator untuk ongkir */}
        {isCalculatingOngkir && (
          <div className="mb-4 p-3 bg-blue-50 rounded-xl text-blue-700 text-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Menghitung ongkos kirim...
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Sections */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Lokasi & Alamat */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-[#dac1b8]/10">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-[#823b18] text-white flex items-center justify-center font-bold text-sm">1</span>
                <h2 className="font-serif text-xl text-[#28180b]">Detail Lokasi &amp; Alamat</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="font-semibold text-sm text-[#28180b] mb-1 block">Alamat Lengkap Pengiriman</label>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    rows={3}
                    placeholder="Contoh: Jalan. Siliwangi No. 123, Kel. Purwaharja, Kec. Purwaharja, Kota Banjar"
                    className="w-full bg-[#fff1e9] border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm text-[#28180b] placeholder:text-[#87736b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none resize-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={checkLocationFromAddress}
                    disabled={isCheckingAddress}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[#ffdbcd] text-[#823b18] rounded-lg text-sm font-semibold hover:bg-[#fbddc7] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isCheckingAddress ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <MapPin className="w-4 h-4" />
                    )}
                    Cek Lokasi & Ongkir
                  </button>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={isGettingLocation}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[#823b18]/10 text-[#823b18] rounded-lg text-sm font-semibold hover:bg-[#823b18]/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isGettingLocation ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <MapPin className="w-4 h-4" />
                    )}
                    Gunakan Lokasi Saya
                  </button>
                </div>

                {/* Map & Ongkir Info */}
                {deliveryInfo && (
                  <div className="space-y-4">
                    <RouteMap
                      storeLocation={deliveryInfo.storeLocation}
                      customerLocation={deliveryInfo.customerLocation}
                      distance={parseFloat(deliveryInfo.distance)}
                    />
                    
                    <div className={`rounded-xl p-4 ${
                      deliveryInfo.canDeliver ? "bg-[#fff1e9]" : "bg-amber-50 border border-amber-200"
                    }`}>
                      <div className="flex items-start gap-3">
                        {deliveryInfo.canDeliver ? (
                          <CheckCircle className="w-5 h-5 text-[#496800] shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className={`text-sm font-semibold ${deliveryInfo.canDeliver ? "text-[#496800]" : "text-amber-800"}`}>
                            {deliveryInfo.canDeliver ? "Dapat Diantar" : "Tidak Dapat Diantar"}
                          </p>
                          <p className="text-sm text-[#54433c] mt-1">{deliveryInfo.message}</p>
                          {!deliveryInfo.canDeliver && (
                            <div className="mt-3 pt-3 border-t border-amber-200">
                              <p className="text-xs text-amber-700">
                                Silakan hubungi kami di WhatsApp untuk bantuan lebih lanjut.
                              </p>
                              <a
                                href="https://wa.me/6281234567890"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 mt-2 text-[#823b18] text-sm font-semibold hover:underline"
                              >
                                <Phone className="w-4 h-4" />
                                Hubungi Admin
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="font-semibold text-sm text-[#28180b] mb-1 block">Metode Penerimaan</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod("PICKUP")}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        deliveryMethod === "PICKUP"
                          ? "border-[#823b18] bg-[#823b18]/5"
                          : "border-[#dac1b8] hover:border-[#823b18]/50"
                      }`}
                    >
                      <Store className="w-6 h-6 mx-auto mb-2 text-[#823b18]" />
                      <p className="font-semibold text-[#28180b]">Ambil Sendiri</p>
                      <p className="text-xs text-[#54433c] mt-1">Gratis</p>
                      <p className="text-xs text-[#496800] mt-2">Jam: {STORE_OPEN_HOUR}:00 - {STORE_CLOSE_HOUR}:00 WIB</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (canDelivery && deliveryInfo?.canDeliver !== false) {
                          setDeliveryMethod("DELIVERY");
                        }
                      }}
                      disabled={!canDelivery || deliveryInfo?.canDeliver === false}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        deliveryMethod === "DELIVERY"
                          ? "border-[#823b18] bg-[#823b18]/5"
                          : "border-[#dac1b8] hover:border-[#823b18]/50"
                      } ${(!canDelivery || deliveryInfo?.canDeliver === false) ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <Truck className="w-6 h-6 mx-auto mb-2 text-[#823b18]" />
                      <p className="font-semibold text-[#28180b]">Diantar</p>
                      <p className="text-xs text-[#54433c] mt-1">
                        Minimal 10 Roti Harian atau total ≥ Rp 50.000
                      </p>
                      <p className="text-xs text-[#496800] mt-2">Jam: {STORE_OPEN_HOUR}:00 - {STORE_CLOSE_HOUR}:00 WIB</p>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Step 2: Waktu & Kontak */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-[#dac1b8]/10">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-[#823b18] text-white flex items-center justify-center font-bold text-sm">2</span>
                <h2 className="font-serif text-xl text-[#28180b]">Waktu &amp; Kontak</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-sm text-[#28180b] mb-1 block">
                    {deliveryMethod === "PICKUP" ? "Jam Pengambilan" : "Jam Pengantaran"}
                    {isNextDayDelivery && <span className="text-xs text-amber-600 ml-2">(H+1 / Besok)</span>}
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#87736b]" />
                    <select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full bg-[#fff1e9] border border-[#dac1b8] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#28180b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none"
                    >
                      {TIME_OPTIONS.map((time) => (
                        <option key={time} value={time}>
                          {time} WIB
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-[#54433c] mt-1">
                    Jam operasional: {STORE_OPEN_HOUR}:00 - {STORE_CLOSE_HOUR}:00 WIB
                  </p>
                </div>
                <div>
                  <label className="font-semibold text-sm text-[#28180b] mb-1 block">Nomor WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#87736b]" />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="081234567890"
                      required
                      className="w-full bg-[#fff1e9] border border-[#dac1b8] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#28180b] placeholder:text-[#87736b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Step 3: Pembayaran */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-[#dac1b8]/10">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-[#823b18] text-white flex items-center justify-center font-bold text-sm">3</span>
                <h2 className="font-serif text-xl text-[#28180b]">Metode Pembayaran</h2>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {/* Transfer Bank */}
                <button
                  type="button"
                  onClick={() => handlePaymentMethodChange("BANK")}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    paymentMethod === "BANK"
                      ? "border-[#823b18] bg-[#823b18]/5"
                      : "border-[#dac1b8] hover:border-[#823b18]/50"
                  }`}
                >
                  <Landmark className="w-6 h-6 mx-auto mb-2 text-[#823b18]" />
                  <p className="font-semibold text-sm text-[#28180b]">Transfer Bank</p>
                </button>

                {/* E-Wallet */}
                <button
                  type="button"
                  onClick={() => handlePaymentMethodChange("EWALLET")}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    paymentMethod === "EWALLET"
                      ? "border-[#823b18] bg-[#823b18]/5"
                      : "border-[#dac1b8] hover:border-[#823b18]/50"
                  }`}
                >
                  <Smartphone className="w-6 h-6 mx-auto mb-2 text-[#823b18]" />
                  <p className="font-semibold text-sm text-[#28180b]">E-Wallet</p>
                </button>

                {/* QRIS */}
                <button
                  type="button"
                  onClick={() => handlePaymentMethodChange("QRIS")}
                  disabled={!paymentSettings.qrisEnabled}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    paymentMethod === "QRIS"
                      ? "border-[#823b18] bg-[#823b18]/5"
                      : "border-[#dac1b8] hover:border-[#823b18]/50"
                  } ${!paymentSettings.qrisEnabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <QrCode className="w-6 h-6 mx-auto mb-2 text-[#823b18]" />
                  <p className="font-semibold text-sm text-[#28180b]">QRIS</p>
                </button>
              </div>

              {/* Transfer Bank Details */}
              {paymentMethod === "BANK" && (
                <div className="mt-4 pt-4 border-t border-[#dac1b8]/10">
                  <label className="font-semibold text-sm text-[#28180b] mb-3 block">Pilih Rekening Bank</label>
                  {activeBankAccounts.length === 0 ? (
                    <div className="p-4 bg-amber-50 rounded-xl text-center">
                      <p className="text-sm text-amber-700">Belum ada rekening bank yang tersedia</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeBankAccounts.map((bank) => (
                        <div
                          key={bank.id}
                          onClick={() => setSelectedBankId(bank.id)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            bankIdToUse === bank.id
                              ? "border-[#823b18] bg-[#823b18]/5"
                              : "border-[#dac1b8] hover:border-[#823b18]/50"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-[#28180b]">{bank.name}</p>
                              <p className="text-sm text-[#54433c] mt-1">{bank.accountNumber}</p>
                              <p className="text-xs text-[#87736b]">a.n. {bank.holderName}</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(bank.accountNumber, "bank");
                              }}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-[#fff1e9] rounded-lg hover:bg-[#ffe3cf] transition-all"
                            >
                              <Copy className="w-3 h-3" />
                              {copiedText === "bank" ? "Copied!" : "Salin"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* E-Wallet Details */}
              {paymentMethod === "EWALLET" && (
                <div className="mt-4 pt-4 border-t border-[#dac1b8]/10">
                  <label className="font-semibold text-sm text-[#28180b] mb-3 block">Pilih E-Wallet</label>
                  {activeEwalletAccounts.length === 0 ? (
                    <div className="p-4 bg-amber-50 rounded-xl text-center">
                      <p className="text-sm text-amber-700">Belum ada e-wallet yang tersedia</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeEwalletAccounts.map((ewallet) => (
                        <div
                          key={ewallet.id}
                          onClick={() => setSelectedEwalletId(ewallet.id)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            ewalletIdToUse === ewallet.id
                              ? "border-[#823b18] bg-[#823b18]/5"
                              : "border-[#dac1b8] hover:border-[#823b18]/50"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-[#28180b]">{ewallet.name}</p>
                              <p className="text-sm text-[#54433c] mt-1">{ewallet.accountNumber}</p>
                              <p className="text-xs text-[#87736b]">a.n. {ewallet.holderName}</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(ewallet.accountNumber, "ewallet");
                              }}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-[#fff1e9] rounded-lg hover:bg-[#ffe3cf] transition-all"
                            >
                              <Copy className="w-3 h-3" />
                              {copiedText === "ewallet" ? "Copied!" : "Salin"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* QRIS Details */}
              {paymentMethod === "QRIS" && paymentSettings.qrisEnabled && (
                <div className="mt-4 pt-4 border-t border-[#dac1b8]/10">
                  <label className="font-semibold text-sm text-[#28180b] mb-3 block">Scan QRIS</label>
                  <div className="flex flex-col items-center p-4 bg-white rounded-xl border border-[#dac1b8]/10">
                    {paymentSettings.qrisImageUrl ? (
                      <>
                        <div className="w-48 h-48 relative rounded-lg overflow-hidden bg-white">
                          <Image
                            src={paymentSettings.qrisImageUrl}
                            alt="QRIS Code"
                            fill
                            className="object-contain p-2"
                          />
                        </div>
                        <p className="text-sm text-[#54433c] mt-3 text-center">
                          Scan QR Code di atas menggunakan aplikasi mobile banking atau e-wallet Anda.
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-amber-700 text-center">
                        QRIS sedang tidak tersedia
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Upload Bukti Pembayaran */}
              <div className="mt-4 pt-4 border-t border-[#dac1b8]/10">
                <label className="font-semibold text-sm text-[#28180b] mb-2 block">Upload Bukti Pembayaran</label>
                <div className="flex flex-col items-center justify-center w-full">
                  {paymentProofPreview ? (
                    <div className="relative w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={paymentProofPreview} alt="Bukti Pembayaran" className="max-h-48 mx-auto rounded-lg border border-[#dac1b8]" />
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentProof(null);
                          setPaymentProofPreview("");
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#dac1b8] rounded-xl cursor-pointer hover:border-[#823b18] transition-all bg-[#fff8f5]">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 text-[#87736b] mb-2" />
                        <p className="text-sm text-[#54433c]">Klik untuk upload bukti transfer</p>
                        <p className="text-xs text-[#87736b]">JPG, PNG, atau WEBP (Max 2MB)</p>
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePaymentProofUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </section>

            {/* Catatan */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-[#dac1b8]/10">
              <h2 className="font-serif text-lg text-[#823b18] mb-3">Catatan (Opsional)</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Tambahkan catatan untuk pesanan Anda..."
                className="w-full bg-[#fff1e9] border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm text-[#28180b] placeholder:text-[#87736b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none resize-none"
              />
            </section>

            {error && (
              <div className="bg-red-50 rounded-xl p-3 text-red-600 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <aside className="lg:col-span-5">
            <div className="sticky top-24 space-y-4">
              <div className="bg-[#ffe3cf] p-6 rounded-xl shadow-md border border-[#823b18]/10">
                <h3 className="font-serif text-xl text-[#823b18] mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Ringkasan Pesanan
                </h3>
                <div className="space-y-3 border-b border-[#dac1b8] pb-4 mb-4">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-[#ffeadc] overflow-hidden relative shrink-0">
                        {item.imageUrl ? (
                          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xl">🥐</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-[#28180b] text-sm">{item.name}</p>
                        <p className="text-xs text-[#54433c]">Kuantitas: {item.quantity}</p>
                      </div>
                      <div className="font-bold text-[#823b18] text-sm">
                        {formatRupiah(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-[#54433c]">
                    <span>Subtotal</span>
                    <span className="font-semibold text-[#28180b]">{formatRupiah(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#54433c]">
                    <span>Biaya Pengiriman</span>
                    <span className="font-semibold text-[#823b18]">
                      {deliveryMethod === "DELIVERY" && deliveryInfo ? formatRupiah(deliveryInfo.deliveryFee) : "Rp 0"}
                    </span>
                  </div>
                </div>
                <div className="pt-3 mt-3 border-t-2 border-[#823b18]/20 flex justify-between items-center">
                  <span className="font-serif text-xl text-[#28180b]">Total</span>
                  <span className="font-serif text-2xl font-bold text-[#823b18]">{formatRupiah(total)}</span>
                </div>
                
                {/* Payment Method Info */}
                <div className="mt-4 p-3 bg-[#fff8f5] rounded-lg text-sm">
                  <p className="text-[#54433c]">Metode Pembayaran:</p>
                  <p className="font-semibold text-[#28180b]">
                    {paymentMethod === "BANK" ? "Transfer Bank" : paymentMethod === "EWALLET" ? "E-Wallet" : "QRIS"}
                  </p>
                  {paymentMethod === "BANK" && bankIdToUse && (
                    <p className="text-xs text-[#54433c] mt-1">
                      Transfer ke rekening yang dipilih
                    </p>
                  )}
                  {paymentMethod === "EWALLET" && ewalletIdToUse && (
                    <p className="text-xs text-[#54433c] mt-1">
                      Pembayaran via e-wallet yang dipilih
                    </p>
                  )}
                  {paymentMethod === "QRIS" && paymentSettings.qrisEnabled && (
                    <p className="text-xs text-[#54433c] mt-1">
                      Scan QRIS untuk melakukan pembayaran
                    </p>
                  )}
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !canProceedCheckout || (deliveryMethod === "DELIVERY" && !deliveryInfo) || !paymentProof}
                  className="w-full bg-[#823b18] text-white py-3 rounded-xl font-semibold mt-4 hover:bg-[#a0522d] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      Konfirmasi Pesanan
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </>
                  )}
                </button>
                <p className="text-center text-[10px] text-[#54433c] mt-3">
                  Pemesanan ini merupakan bentuk dukungan Anda bagi tradisi roti artisan lokal.
                </p>
              </div>

              <div className="flex items-center gap-3 p-3 bg-[#c8f17a]/20 rounded-lg border border-[#496800]/20">
                <CheckCircle className="w-5 h-5 text-[#496800]" />
                <span className="text-xs text-[#131f00] font-medium leading-tight">
                  Jaminan Kesegaran: Roti dipanggang setiap pagi hari H pengambilan/pengantaran.
                </span>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Modal Simpan Lokasi */}
      <AnimatePresence>
        {showSaveLocationModal && tempLocation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
            >
              <div className="p-5 border-b border-[#dac1b8]/10">
                <h3 className="font-serif text-xl text-[#823b18]">Simpan Lokasi?</h3>
              </div>
              <div className="p-5">
                <div className="bg-[#fff1e9] rounded-xl p-3 mb-4">
                  <p className="text-sm text-[#54433c] mb-1">Alamat:</p>
                  <p className="text-sm font-medium text-[#28180b]">{tempLocation.address.substring(0, 100)}...</p>
                </div>
                <p className="text-sm text-[#54433c]">
                  Apakah Anda ingin menyimpan alamat ini ke profil Anda untuk memudahkan pemesanan berikutnya?
                </p>
              </div>
              <div className="flex gap-3 p-5 pt-0">
                <button
                  onClick={() => {
                    setShowSaveLocationModal(false);
                    if (pendingOrderId) router.push(`/customer/orders/${pendingOrderId}`);
                  }}
                  className="flex-1 px-4 py-2.5 border border-[#dac1b8] text-[#54433c] rounded-xl text-sm font-semibold hover:bg-[#fff1e9] transition-all cursor-pointer"
                >
                  Tidak
                </button>
                <button
                  onClick={saveLocationToProfile}
                  className="flex-1 bg-[#823b18] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#a0522d] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Ya, Simpan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .paper-grain {
          position: relative;
        }
        .paper-grain::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuA1vSp5KooROZZIPMh6rzicTlWmkcSqYYlNJKGALsIwbaexzS4u6fa-qv-8yTFDh4prXtXBHI5AMpYVim7dlwLd_li27o6LHwCEzSBIPDfFg1b7ov7ArWElNR961iV4fMzXyTG7wQjdLNCPZHjzB8R8GTSWEEUSrLOENVnoQuGs05TBo_O5506-Z5YjoU3COrZKZjpAY8zAPN2KbqjnPskJvAQjY18lwoL5Le-PZ76uzGl_Pq23H57aRvdkkenf0S2HilVwCl79G0");
          opacity: 0.04;
          pointer-events: none;
          z-index: -1;
        }
      `}</style>
    </div>
  );
}