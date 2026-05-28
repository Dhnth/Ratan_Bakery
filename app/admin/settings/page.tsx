"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Store,
  Clock,
  Truck,
  MapPin,
  Phone,
  Mail,
  Globe,
  DollarSign,
  Ruler,
  Save,
  RefreshCw,
  AlertCircle,
  Box,
  Settings as SettingsIcon,
  CreditCard,
  Landmark,
  Smartphone,
  QrCode,
  Plus,
  Trash2,
  CheckCircle,
  X,
  Upload,
  Eye,
} from "lucide-react";
import { 
  FaInstagram, 
  FaFacebook, 
  FaTwitter, 
  FaYoutube 
} from "react-icons/fa";

type Settings = {
  store_name: string;
  store_description: string;
  hero_title: string;
  hero_subtitle: string;
  whatsapp_number: string;
  email: string;
  instagram: string;
  facebook: string;
  twitter: string;
  youtube: string;
  operational_days: string;
  operational_hours_start: string;
  operational_hours_end: string;
  store_address: string;
  store_latitude: string;
  store_longitude: string;
  delivery_radius_km: string;
  delivery_fee_within_radius: string;
  delivery_fee_outside_radius: string;
  delivery_min_quantity: string;
  max_items_per_order: string;
  max_specials_items_per_order: string;
  max_payment_proof_attempts: string;
  timezone: string;
  bank_accounts: string;
  ewallet_accounts: string;
  qris_enabled: string;
  qris_image_url: string;
  [key: string]: string;
};

type PaymentAccount = {
  id: string;
  name: string;
  accountNumber: string;
  holderName: string;
  isActive: boolean;
};

const defaultSettings: Settings = {
  store_name: "Ratan Bakery",
  store_description:
    "Roti rumahan enak dan halal, dibuat dengan cinta untuk keluarga Anda",
  hero_title: "Roti Enak untuk Keluarga",
  hero_subtitle:
    "Dibuat dengan cinta dari dapur kami ke rumah Anda. Menggunakan bahan pilihan untuk kebahagiaan di setiap gigitan.",
  whatsapp_number: "6281234567890",
  email: "ratanbakery@gmail.com",
  instagram: "ratanbakery",
  facebook: "ratanbakery",
  twitter: "ratanbakery",
  youtube: "ratanbakery",
  operational_days: "Senin - Minggu",
  operational_hours_start: "08:00",
  operational_hours_end: "18:00",
  store_address:
    "JJ44+73X, Kujangsari, Kec. Langensari, Kota Banjar, Jawa Barat 46324",
  store_latitude: "-7.3942708",
  store_longitude: "108.6052462",
  delivery_radius_km: "10",
  delivery_fee_within_radius: "5000",
  delivery_fee_outside_radius: "10000",
  delivery_min_quantity: "10",
  max_items_per_order: "30",
  max_specials_items_per_order: "4",
  max_payment_proof_attempts: "3",
  timezone: "Asia/Jakarta",
  bank_accounts: "[]",
  ewallet_accounts: "[]",
  qris_enabled: "false",
  qris_image_url: "",
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

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [uploadingQRIS, setUploadingQRIS] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Payment state
  const [bankAccounts, setBankAccounts] = useState<PaymentAccount[]>([]);
  const [ewalletAccounts, setEwalletAccounts] = useState<PaymentAccount[]>([]);
  const [qrisEnabled, setQrisEnabled] = useState(false);
  const [qrisImageUrl, setQrisImageUrl] = useState("");
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [showAddEwalletModal, setShowAddEwalletModal] = useState(false);
  const [editingBank, setEditingBank] = useState<PaymentAccount | null>(null);
  const [editingEwallet, setEditingEwallet] = useState<PaymentAccount | null>(null);
  
  // New account form
  const [newBankAccount, setNewBankAccount] = useState({
    name: "",
    accountNumber: "",
    holderName: "",
  });
  const [newEwalletAccount, setNewEwalletAccount] = useState({
    name: "",
    accountNumber: "",
    holderName: "",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings");
        const data = await res.json();
        if (res.ok) {
          setSettings({ ...defaultSettings, ...data });
          
          // Parse payment data
          if (data.bank_accounts) {
            try {
              setBankAccounts(JSON.parse(data.bank_accounts));
            } catch (e) {
              console.error("Error parsing bank accounts:", e);
            }
          }
          if (data.ewallet_accounts) {
            try {
              setEwalletAccounts(JSON.parse(data.ewallet_accounts));
            } catch (e) {
              console.error("Error parsing ewallet accounts:", e);
            }
          }
          setQrisEnabled(data.qris_enabled === "true");
          setQrisImageUrl(data.qris_image_url || "");
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        showToast("Gagal memuat pengaturan", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Save all settings at once
  const saveAllSettings = async () => {
    setIsSaving(true);
    try {
      const settingsToSave = {
        ...settings,
        bank_accounts: JSON.stringify(bankAccounts),
        ewallet_accounts: JSON.stringify(ewalletAccounts),
        qris_enabled: String(qrisEnabled),
        qris_image_url: qrisImageUrl,
      };
      
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: settingsToSave }),
      });

      if (res.ok) {
        showToast("Pengaturan berhasil disimpan!", "success");
        return true;
      } else {
        const errorData = await res.json();
        showToast(errorData.error || "Gagal menyimpan pengaturan", "error");
        return false;
      }
    } catch (error) {
      console.error("Save error:", error);
      showToast("Terjadi kesalahan", "error");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Save only payment settings (bank, ewallet, qris)
  const savePaymentSettings = async () => {
    try {
      const settingsToSave = {
        bank_accounts: JSON.stringify(bankAccounts),
        ewallet_accounts: JSON.stringify(ewalletAccounts),
        qris_enabled: String(qrisEnabled),
        qris_image_url: qrisImageUrl,
      };
      
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: settingsToSave }),
      });

      if (res.ok) {
        showToast("Metode pembayaran berhasil diperbarui!", "success");
        return true;
      } else {
        showToast("Gagal menyimpan metode pembayaran", "error");
        return false;
      }
    } catch {
      showToast("Terjadi kesalahan", "error");
      return false;
    }
  };

  // Upload QRIS Image
  const handleUploadQRIS = async (file: File) => {
    setUploadingQRIS(true);
    const formData = new FormData();
    formData.append("qris", file);
    
    try {
      const res = await fetch("/api/admin/settings/qris", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (res.ok) {
        setQrisImageUrl(data.url);
        // Save after upload
        await savePaymentSettings();
        showToast("QR Code berhasil diupload!", "success");
      } else {
        showToast(data.error || "Gagal upload QR Code", "error");
      }
    } catch {
      showToast("Terjadi kesalahan saat upload", "error");
    } finally {
      setUploadingQRIS(false);
    }
  };

  const handleDeleteQRIS = async () => {
    setQrisImageUrl("");
    await savePaymentSettings();
    showToast("QR Code dihapus", "success");
  };

  const toggleQris = async () => {
    const newValue = !qrisEnabled;
    setQrisEnabled(newValue);
    await savePaymentSettings();
  };

  // Bank Account Functions
  const addBankAccount = async () => {
    if (!newBankAccount.name || !newBankAccount.accountNumber || !newBankAccount.holderName) {
      showToast("Isi semua field bank", "error");
      return;
    }
    const newAccount: PaymentAccount = {
      id: crypto.randomUUID(),
      ...newBankAccount,
      isActive: true,
    };
    const updated = [...bankAccounts, newAccount];
    setBankAccounts(updated);
    await savePaymentSettings();
    setNewBankAccount({ name: "", accountNumber: "", holderName: "" });
    setShowAddBankModal(false);
  };

  const updateBankAccount = async () => {
    if (!editingBank) return;
    const updated = bankAccounts.map(acc => 
      acc.id === editingBank.id ? editingBank : acc
    );
    setBankAccounts(updated);
    await savePaymentSettings();
    setEditingBank(null);
  };

  const toggleBankActive = async (id: string) => {
    const updated = bankAccounts.map(acc =>
      acc.id === id ? { ...acc, isActive: !acc.isActive } : acc
    );
    setBankAccounts(updated);
    await savePaymentSettings();
  };

  const deleteBankAccount = async (id: string) => {
    const updated = bankAccounts.filter(acc => acc.id !== id);
    setBankAccounts(updated);
    await savePaymentSettings();
  };

  // E-Wallet Functions
  const addEwalletAccount = async () => {
    if (!newEwalletAccount.name || !newEwalletAccount.accountNumber || !newEwalletAccount.holderName) {
      showToast("Isi semua field e-wallet", "error");
      return;
    }
    const newAccount: PaymentAccount = {
      id: crypto.randomUUID(),
      ...newEwalletAccount,
      isActive: true,
    };
    const updated = [...ewalletAccounts, newAccount];
    setEwalletAccounts(updated);
    await savePaymentSettings();
    setNewEwalletAccount({ name: "", accountNumber: "", holderName: "" });
    setShowAddEwalletModal(false);
  };

  const updateEwalletAccount = async () => {
    if (!editingEwallet) return;
    const updated = ewalletAccounts.map(acc => 
      acc.id === editingEwallet.id ? editingEwallet : acc
    );
    setEwalletAccounts(updated);
    await savePaymentSettings();
    setEditingEwallet(null);
  };

  const toggleEwalletActive = async (id: string) => {
    const updated = ewalletAccounts.map(acc =>
      acc.id === id ? { ...acc, isActive: !acc.isActive } : acc
    );
    setEwalletAccounts(updated);
    await savePaymentSettings();
  };

  const deleteEwalletAccount = async (id: string) => {
    const updated = ewalletAccounts.filter(acc => acc.id !== id);
    setEwalletAccounts(updated);
    await savePaymentSettings();
  };

  const handleSave = async () => {
    await saveAllSettings();
  };

  const tabs = [
    { id: "general", name: "Umum", icon: Store },
    { id: "operational", name: "Operasional", icon: Clock },
    { id: "delivery", name: "Pengiriman", icon: Truck },
    { id: "location", name: "Lokasi", icon: MapPin },
    { id: "social", name: "Sosial Media", icon: FaInstagram },
    { id: "payment", name: "Pembayaran", icon: CreditCard },
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
            <span className="text-[#823b18] cursor-pointer">Pengaturan</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-[#28180b] mb-1">
            Pengaturan Toko
          </h2>
          <p className="text-sm text-[#54433c] max-w-xl">
            Kelola informasi toko, jam operasional, ongkos kirim, dan lainnya.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#823b18] text-white rounded-xl text-sm font-semibold hover:bg-[#a0522d] transition-all shadow-md disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Simpan Pengaturan
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#dac1b8]/20 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-[#823b18] text-white shadow-md"
                  : "bg-white text-[#54433c] hover:bg-[#fff1e9] border border-[#dac1b8]/20"
              }`}
            >
              {typeof Icon === "function" ? <Icon className="w-4 h-4" /> : <SettingsIcon className="w-4 h-4" />}
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl shadow-sm border border-[#dac1b8]/10 overflow-hidden"
      >
        <div className="p-6 space-y-6">
          {/* Tab: General */}
          {activeTab === "general" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-[#28180b] mb-1 flex items-center gap-2">
                    <Store className="w-4 h-4 text-[#823b18]" />
                    Nama Toko
                  </label>
                  <input
                    type="text"
                    value={settings.store_name}
                    onChange={(e) => handleChange("store_name", e.target.value)}
                    className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm text-[#28180b] placeholder:text-[#87736b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#28180b] mb-1 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#823b18]" />
                    Nomor WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={settings.whatsapp_number}
                    onChange={(e) => handleChange("whatsapp_number", e.target.value)}
                    placeholder="6281234567890"
                    className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm text-[#28180b] placeholder:text-[#87736b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#28180b] mb-1 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#823b18]" />
                    Email Toko
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="ratanbakery@gmail.com"
                    className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm text-[#28180b] placeholder:text-[#87736b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#28180b] mb-1 flex items-center gap-2">
                    <Box className="w-4 h-4 text-[#823b18]" />
                    Maksimal Spesial Order per Pesanan
                  </label>
                  <input
                    type="number"
                    value={settings.max_specials_items_per_order}
                    onChange={(e) => handleChange("max_specials_items_per_order", e.target.value)}
                    min="1"
                    className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm text-[#28180b] placeholder:text-[#87736b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none"
                  />
                  <p className="text-[10px] text-[#54433c] mt-1">
                    Maksimal item spesial order yang bisa dipesan dalam satu transaksi
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-[#28180b] mb-1 flex items-center gap-2">
                    <Store className="w-4 h-4 text-[#823b18]" />
                    Deskripsi Toko
                  </label>
                  <textarea
                    value={settings.store_description}
                    onChange={(e) => handleChange("store_description", e.target.value)}
                    rows={3}
                    className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm text-[#28180b] placeholder:text-[#87736b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none resize-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-[#28180b] mb-1 flex items-center gap-2">
                    <Store className="w-4 h-4 text-[#823b18]" />
                    Hero Title (Judul Utama)
                  </label>
                  <input
                    type="text"
                    value={settings.hero_title}
                    onChange={(e) => handleChange("hero_title", e.target.value)}
                    className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm text-[#28180b] placeholder:text-[#87736b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-[#28180b] mb-1 flex items-center gap-2">
                    <Store className="w-4 h-4 text-[#823b18]" />
                    Hero Subtitle
                  </label>
                  <textarea
                    value={settings.hero_subtitle}
                    onChange={(e) => handleChange("hero_subtitle", e.target.value)}
                    rows={2}
                    className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm text-[#28180b] placeholder:text-[#87736b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab: Operational */}
          {activeTab === "operational" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-[#28180b] mb-1 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#823b18]" />
                    Hari Operasional
                  </label>
                  <input
                    type="text"
                    value={settings.operational_days}
                    onChange={(e) => handleChange("operational_days", e.target.value)}
                    placeholder="Senin - Minggu"
                    className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm text-[#28180b] placeholder:text-[#87736b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#28180b] mb-1 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#823b18]" />
                    Jam Buka
                  </label>
                  <input
                    type="time"
                    value={settings.operational_hours_start}
                    onChange={(e) => handleChange("operational_hours_start", e.target.value)}
                    className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm text-[#28180b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#28180b] mb-1 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#823b18]" />
                    Jam Tutup
                  </label>
                  <input
                    type="time"
                    value={settings.operational_hours_end}
                    onChange={(e) => handleChange("operational_hours_end", e.target.value)}
                    className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm text-[#28180b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#28180b] mb-1 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#823b18]" />
                    Zona Waktu
                  </label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => handleChange("timezone", e.target.value)}
                    className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm text-[#28180b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none cursor-pointer"
                  >
                    <option value="Asia/Jakarta">WIB (Asia/Jakarta)</option>
                    <option value="Asia/Makassar">WITA (Asia/Makassar)</option>
                    <option value="Asia/Jayapura">WIT (Asia/Jayapura)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Delivery */}
          {activeTab === "delivery" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-[#28180b] mb-1 flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-[#823b18]" />
                    Radius Pengiriman (km)
                  </label>
                  <input
                    type="number"
                    value={settings.delivery_radius_km}
                    onChange={(e) => handleChange("delivery_radius_km", e.target.value)}
                    min="0"
                    className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm text-[#28180b] placeholder:text-[#87736b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none"
                  />
                  <p className="text-[10px] text-[#54433c] mt-1">
                    Jarak maksimal untuk layanan antar
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#28180b] mb-1 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#823b18]" />
                    Ongkir Dalam Radius (Rp)
                  </label>
                  <input
                    type="number"
                    value={settings.delivery_fee_within_radius}
                    onChange={(e) => handleChange("delivery_fee_within_radius", e.target.value)}
                    min="0"
                    className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm text-[#28180b] placeholder:text-[#87736b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#28180b] mb-1 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#823b18]" />
                    Ongkir Luar Radius (Rp)
                  </label>
                  <input
                    type="number"
                    value={settings.delivery_fee_outside_radius}
                    onChange={(e) => handleChange("delivery_fee_outside_radius", e.target.value)}
                    min="0"
                    className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm text-[#28180b] placeholder:text-[#87736b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#28180b] mb-1 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#823b18]" />
                    Minimal Item untuk Antar
                  </label>
                  <input
                    type="number"
                    value={settings.delivery_min_quantity}
                    onChange={(e) => handleChange("delivery_min_quantity", e.target.value)}
                    min="1"
                    className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm text-[#28180b] placeholder:text-[#87736b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#28180b] mb-1 flex items-center gap-2">
                    <Box className="w-4 h-4 text-[#823b18]" />
                    Maksimal Item per Pesanan
                  </label>
                  <input
                    type="number"
                    value={settings.max_items_per_order}
                    onChange={(e) => handleChange("max_items_per_order", e.target.value)}
                    min="1"
                    className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm text-[#28180b] placeholder:text-[#87736b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#28180b] mb-1 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[#823b18]" />
                    Maksimal Upload Bukti Transfer
                  </label>
                  <input
                    type="number"
                    value={settings.max_payment_proof_attempts}
                    onChange={(e) => handleChange("max_payment_proof_attempts", e.target.value)}
                    min="1"
                    max="5"
                    className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm text-[#28180b] placeholder:text-[#87736b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab: Location */}
          {activeTab === "location" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-[#28180b] mb-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#823b18]" />
                    Alamat Toko
                  </label>
                  <textarea
                    value={settings.store_address}
                    onChange={(e) => handleChange("store_address", e.target.value)}
                    rows={3}
                    className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm text-[#28180b] placeholder:text-[#87736b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-[#28180b] mb-1 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#823b18]" />
                      Latitude
                    </label>
                    <input
                      type="text"
                      value={settings.store_latitude}
                      onChange={(e) => handleChange("store_latitude", e.target.value)}
                      placeholder="-7.3942708"
                      className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm text-[#28180b] placeholder:text-[#87736b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none"
                    />
                    <p className="text-[10px] text-[#54433c] mt-1">
                      Koordinat lintang (dari Google Maps)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#28180b] mb-1 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#823b18]" />
                      Longitude
                    </label>
                    <input
                      type="text"
                      value={settings.store_longitude}
                      onChange={(e) => handleChange("store_longitude", e.target.value)}
                      placeholder="108.6052462"
                      className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm text-[#28180b] placeholder:text-[#87736b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none"
                    />
                    <p className="text-[10px] text-[#54433c] mt-1">
                      Koordinat bujur (dari Google Maps)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Social Media */}
          {activeTab === "social" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-[#28180b] mb-1 flex items-center gap-2">
                    <FaInstagram className="w-4 h-4 text-[#823b18]" />
                    Instagram
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#87736b] text-sm">
                      @
                    </span>
                    <input
                      type="text"
                      value={settings.instagram}
                      onChange={(e) => handleChange("instagram", e.target.value)}
                      placeholder="ratanbakery"
                      className="w-full bg-white border border-[#dac1b8] rounded-xl pl-7 pr-4 py-2.5 text-sm text-[#28180b] placeholder:text-[#87736b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#28180b] mb-1 flex items-center gap-2">
                    <FaFacebook className="w-4 h-4 text-[#823b18]" />
                    Facebook
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#87736b] text-sm">
                      fb.com/
                    </span>
                    <input
                      type="text"
                      value={settings.facebook}
                      onChange={(e) => handleChange("facebook", e.target.value)}
                      placeholder="ratanbakery"
                      className="w-full bg-white border border-[#dac1b8] rounded-xl pl-16 pr-4 py-2.5 text-sm text-[#28180b] placeholder:text-[#87736b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#28180b] mb-1 flex items-center gap-2">
                    <FaTwitter className="w-4 h-4 text-[#823b18]" />
                    Twitter / X
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#87736b] text-sm">
                      @
                    </span>
                    <input
                      type="text"
                      value={settings.twitter}
                      onChange={(e) => handleChange("twitter", e.target.value)}
                      placeholder="ratanbakery"
                      className="w-full bg-white border border-[#dac1b8] rounded-xl pl-7 pr-4 py-2.5 text-sm text-[#28180b] placeholder:text-[#87736b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#28180b] mb-1 flex items-center gap-2">
                    <FaYoutube className="w-4 h-4 text-[#823b18]" />
                    YouTube
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#87736b] text-sm">
                      youtube.com/@
                    </span>
                    <input
                      type="text"
                      value={settings.youtube}
                      onChange={(e) => handleChange("youtube", e.target.value)}
                      placeholder="ratanbakery"
                      className="w-full bg-white border border-[#dac1b8] rounded-xl pl-28 pr-4 py-2.5 text-sm text-[#28180b] placeholder:text-[#87736b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Payment */}
          {activeTab === "payment" && (
            <div className="space-y-8">
              {/* Bank Accounts Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-[#823b18]" />
                    <h3 className="font-serif text-xl text-[#28180b]">Rekening Bank</h3>
                  </div>
                  <button
                    onClick={() => setShowAddBankModal(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#823b18] text-white rounded-lg text-sm font-semibold hover:bg-[#a0522d] transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Bank
                  </button>
                </div>
                <div className="space-y-3">
                  {bankAccounts.length === 0 ? (
                    <div className="text-center py-8 bg-[#fff8f5] rounded-xl border border-[#dac1b8]/10">
                      <Landmark className="w-12 h-12 text-[#dac1b8] mx-auto mb-2" />
                      <p className="text-[#54433c] text-sm">Belum ada rekening bank</p>
                      <p className="text-xs text-[#87736b]">Tambah rekening bank untuk metode pembayaran transfer</p>
                    </div>
                  ) : (
                    bankAccounts.map((account) => (
                      <div
                        key={account.id}
                        className="flex items-center justify-between p-4 bg-[#fff8f5] rounded-xl border border-[#dac1b8]/10 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#ffeadc] flex items-center justify-center">
                            <Landmark className="w-5 h-5 text-[#823b18]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-[#28180b]">{account.name}</p>
                              {account.isActive ? (
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Aktif</span>
                              ) : (
                                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Nonaktif</span>
                              )}
                            </div>
                            <p className="text-sm text-[#54433c]">{account.accountNumber}</p>
                            <p className="text-xs text-[#87736b]">a.n. {account.holderName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleBankActive(account.id)}
                            className={`p-2 rounded-lg transition-all cursor-pointer ${account.isActive ? "text-emerald-600 hover:bg-emerald-50" : "text-gray-400 hover:bg-gray-100"}`}
                            title={account.isActive ? "Nonaktifkan" : "Aktifkan"}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingBank(account)}
                            className="p-2 rounded-lg text-[#823b18] hover:bg-[#823b18]/10 transition-all cursor-pointer"
                            title="Edit"
                          >
                            <SettingsIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteBankAccount(account.id)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* E-Wallet Accounts Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-[#823b18]" />
                    <h3 className="font-serif text-xl text-[#28180b]">E-Wallet</h3>
                  </div>
                  <button
                    onClick={() => setShowAddEwalletModal(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#823b18] text-white rounded-lg text-sm font-semibold hover:bg-[#a0522d] transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah E-Wallet
                  </button>
                </div>
                <div className="space-y-3">
                  {ewalletAccounts.length === 0 ? (
                    <div className="text-center py-8 bg-[#fff8f5] rounded-xl border border-[#dac1b8]/10">
                      <Smartphone className="w-12 h-12 text-[#dac1b8] mx-auto mb-2" />
                      <p className="text-[#54433c] text-sm">Belum ada e-wallet</p>
                      <p className="text-xs text-[#87736b]">Tambah e-wallet untuk metode pembayaran digital</p>
                    </div>
                  ) : (
                    ewalletAccounts.map((account) => (
                      <div
                        key={account.id}
                        className="flex items-center justify-between p-4 bg-[#fff8f5] rounded-xl border border-[#dac1b8]/10 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#ffeadc] flex items-center justify-center">
                            <Smartphone className="w-5 h-5 text-[#823b18]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-[#28180b]">{account.name}</p>
                              {account.isActive ? (
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Aktif</span>
                              ) : (
                                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Nonaktif</span>
                              )}
                            </div>
                            <p className="text-sm text-[#54433c]">{account.accountNumber}</p>
                            <p className="text-xs text-[#87736b]">a.n. {account.holderName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleEwalletActive(account.id)}
                            className={`p-2 rounded-lg transition-all cursor-pointer ${account.isActive ? "text-emerald-600 hover:bg-emerald-50" : "text-gray-400 hover:bg-gray-100"}`}
                            title={account.isActive ? "Nonaktifkan" : "Aktifkan"}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingEwallet(account)}
                            className="p-2 rounded-lg text-[#823b18] hover:bg-[#823b18]/10 transition-all cursor-pointer"
                            title="Edit"
                          >
                            <SettingsIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteEwalletAccount(account.id)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* QRIS Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-[#823b18]" />
                    <h3 className="font-serif text-xl text-[#28180b]">QRIS</h3>
                  </div>
                  <button
                    onClick={toggleQris}
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 cursor-pointer ${
                      qrisEnabled ? "bg-emerald-500" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${
                        qrisEnabled ? "right-1" : "left-1"
                      }`}
                    />
                  </button>
                </div>
                
                {qrisEnabled && (
                  <div className="p-4 bg-[#fff8f5] rounded-xl border border-[#dac1b8]/10">
                    <div className="flex flex-col items-center gap-4">
                      {qrisImageUrl ? (
                        <div className="relative">
                          <div className="w-48 h-48 relative rounded-lg overflow-hidden bg-white border border-[#dac1b8]">
                            <Image
                              src={qrisImageUrl}
                              alt="QRIS Code"
                              fill
                              className="object-contain p-2"
                            />
                          </div>
                          <button
                            onClick={handleDeleteQRIS}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="w-48 h-48 border-2 border-dashed border-[#dac1b8] rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#823b18] transition-all bg-white"
                        >
                          <Upload className="w-8 h-8 text-[#87736b]" />
                          <p className="text-xs text-[#54433c] text-center">
                            Klik untuk upload<br />QR Code
                          </p>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadQRIS(file);
                        }}
                      />
                      {uploadingQRIS && (
                        <div className="flex items-center gap-2 text-[#823b18]">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Mengupload...</span>
                        </div>
                      )}
                      <p className="text-sm text-[#54433c] text-center">
                        Upload gambar QRIS Anda. Customer akan memindai QR code ini untuk melakukan pembayaran.
                      </p>
                    </div>
                  </div>
                )}
                
                {!qrisEnabled && (
                  <div className="p-4 bg-[#fff8f5] rounded-xl border border-[#dac1b8]/10">
                    <p className="text-sm text-[#54433c] text-center">
                      Nyalakan QRIS untuk mengaktifkan metode pembayaran via QRIS.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Add Bank Modal */}
      <AnimatePresence>
        {showAddBankModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full"
            >
              <div className="p-5 border-b border-[#dac1b8]/10 flex justify-between items-center">
                <h3 className="font-serif text-xl text-[#28180b]">Tambah Rekening Bank</h3>
                <button
                  onClick={() => setShowAddBankModal(false)}
                  className="p-1 rounded-lg hover:bg-[#ffdad6] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-[#54433c]" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#28180b] mb-1">Nama Bank</label>
                  <input
                    type="text"
                    value={newBankAccount.name}
                    onChange={(e) => setNewBankAccount({ ...newBankAccount, name: e.target.value })}
                    placeholder="BCA, Mandiri, BRI, BNI, dll"
                    className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none text-[#54433c]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#28180b] mb-1">Nomor Rekening</label>
                  <input
                    type="text"
                    value={newBankAccount.accountNumber}
                    onChange={(e) => setNewBankAccount({ ...newBankAccount, accountNumber: e.target.value })}
                    placeholder="1234567890"
                    className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none text-[#54433c]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#28180b] mb-1">Atas Nama</label>
                  <input
                    type="text"
                    value={newBankAccount.holderName}
                    onChange={(e) => setNewBankAccount({ ...newBankAccount, holderName: e.target.value })}
                    placeholder="Nama pemilik rekening"
                    className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none text-[#54433c]"
                  />
                </div>
              </div>
              <div className="flex gap-3 p-5 pt-0">
                <button
                  onClick={() => setShowAddBankModal(false)}
                  className="flex-1 px-4 py-2.5 border border-[#dac1b8] text-[#54433c] rounded-xl text-sm font-semibold hover:bg-[#fff1e9] transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={addBankAccount}
                  className="flex-1 bg-[#823b18] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#a0522d] transition-all cursor-pointer"
                >
                  Tambah
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add E-Wallet Modal */}
      <AnimatePresence>
        {showAddEwalletModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full"
            >
              <div className="p-5 border-b border-[#dac1b8]/10 flex justify-between items-center">
                <h3 className="font-serif text-xl text-[#28180b]">Tambah E-Wallet</h3>
                <button
                  onClick={() => setShowAddEwalletModal(false)}
                  className="p-1 rounded-lg hover:bg-[#ffdad6] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-[#54433c]" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#28180b] mb-1">Nama E-Wallet</label>
                  <input
                    type="text"
                    value={newEwalletAccount.name}
                    onChange={(e) => setNewEwalletAccount({ ...newEwalletAccount, name: e.target.value })}
                    placeholder="DANA, OVO, GoPay, ShopeePay, dll"
                    className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none text-[#54433c]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#28180b] mb-1">Nomor Akun / ID</label>
                  <input
                    type="text"
                    value={newEwalletAccount.accountNumber}
                    onChange={(e) => setNewEwalletAccount({ ...newEwalletAccount, accountNumber: e.target.value })}
                    placeholder="081234567890"
                    className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none text-[#54433c]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#28180b] mb-1">Atas Nama</label>
                  <input
                    type="text"
                    value={newEwalletAccount.holderName}
                    onChange={(e) => setNewEwalletAccount({ ...newEwalletAccount, holderName: e.target.value })}
                    placeholder="Nama pemilik akun"
                    className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none text-[#54433c]"
                  />
                </div>
              </div>
              <div className="flex gap-3 p-5 pt-0">
                <button
                  onClick={() => setShowAddEwalletModal(false)}
                  className="flex-1 px-4 py-2.5 border border-[#dac1b8] text-[#54433c] rounded-xl text-sm font-semibold hover:bg-[#fff1e9] transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={addEwalletAccount}
                  className="flex-1 bg-[#823b18] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#a0522d] transition-all cursor-pointer"
                >
                  Tambah
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Bank Modal */}
      <AnimatePresence>
        {editingBank && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full"
            >
              <div className="p-5 border-b border-[#dac1b8]/10 flex justify-between items-center">
                <h3 className="font-serif text-xl text-[#28180b]">Edit Rekening Bank</h3>
                <button
                  onClick={() => setEditingBank(null)}
                  className="p-1 rounded-lg hover:bg-[#ffdad6] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#28180b] mb-1">Nama Bank</label>
                  <input
                    type="text"
                    value={editingBank.name}
                    onChange={(e) => setEditingBank({ ...editingBank, name: e.target.value })}
                    className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#28180b] mb-1">Nomor Rekening</label>
                  <input
                    type="text"
                    value={editingBank.accountNumber}
                    onChange={(e) => setEditingBank({ ...editingBank, accountNumber: e.target.value })}
                    className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#28180b] mb-1">Atas Nama</label>
                  <input
                    type="text"
                    value={editingBank.holderName}
                    onChange={(e) => setEditingBank({ ...editingBank, holderName: e.target.value })}
                    className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 p-5 pt-0">
                <button
                  onClick={() => setEditingBank(null)}
                  className="flex-1 px-4 py-2.5 border border-[#dac1b8] text-[#54433c] rounded-xl text-sm font-semibold hover:bg-[#fff1e9] transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={updateBankAccount}
                  className="flex-1 bg-[#823b18] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#a0522d] transition-all cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit E-Wallet Modal */}
      <AnimatePresence>
        {editingEwallet && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full"
            >
              <div className="p-5 border-b border-[#dac1b8]/10 flex justify-between items-center">
                <h3 className="font-serif text-xl text-[#28180b]">Edit E-Wallet</h3>
                <button
                  onClick={() => setEditingEwallet(null)}
                  className="p-1 rounded-lg hover:bg-[#ffdad6] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#28180b] mb-1">Nama E-Wallet</label>
                  <input
                    type="text"
                    value={editingEwallet.name}
                    onChange={(e) => setEditingEwallet({ ...editingEwallet, name: e.target.value })}
                    className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#28180b] mb-1">Nomor Akun / ID</label>
                  <input
                    type="text"
                    value={editingEwallet.accountNumber}
                    onChange={(e) => setEditingEwallet({ ...editingEwallet, accountNumber: e.target.value })}
                    className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#28180b] mb-1">Atas Nama</label>
                  <input
                    type="text"
                    value={editingEwallet.holderName}
                    onChange={(e) => setEditingEwallet({ ...editingEwallet, holderName: e.target.value })}
                    className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 p-5 pt-0">
                <button
                  onClick={() => setEditingEwallet(null)}
                  className="flex-1 px-4 py-2.5 border border-[#dac1b8] text-[#54433c] rounded-xl text-sm font-semibold hover:bg-[#fff1e9] transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={updateEwalletAccount}
                  className="flex-1 bg-[#823b18] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#a0522d] transition-all cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}