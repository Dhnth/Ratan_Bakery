// app/customer/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Camera,
} from "lucide-react";
import Image from "next/image";

type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
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
  visible: { y: 0, opacity: 1, transition: { duration: 0.3 } },
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

export default function CustomerSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>({
    id: "",
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [memberSince, setMemberSince] = useState("");

  useEffect(() => {
    // Redirect if not authenticated
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile({
            id: data.id || "",
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
            address: data.address || "",
          });
          
          // Set member since from created date
          if (data.createdAt) {
            const date = new Date(data.createdAt);
            setMemberSince(date.toLocaleDateString("id-ID", {
              month: "long",
              year: "numeric",
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        showToast("Gagal memuat profil", "error");
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchProfile();
    }
  }, [session]);

  const handleChange = (field: keyof UserProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    // Clear messages when user starts typing
    if (successMessage) setSuccessMessage("");
    if (errorMessage) setErrorMessage("");
  };

  const handleAvatarUpload = async (file: File) => {
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("avatar", file);
    
    try {
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (res.ok) {
        setAvatarUrl(data.url);
        showToast("Foto profil berhasil diupload!", "success");
      } else {
        showToast(data.error || "Gagal upload foto", "error");
      }
    } catch {
      showToast("Terjadi kesalahan", "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          address: profile.address,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage("Profil berhasil diperbarui!");
        showToast("Profil berhasil diperbarui!", "success");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrorMessage(data.error || "Gagal memperbarui profil");
        showToast(data.error || "Gagal memperbarui profil", "error");
      }
    } catch {
      setErrorMessage("Terjadi kesalahan");
      showToast("Terjadi kesalahan", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-[#fff8f5] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#823b18] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Get initial avatar from email (menggunakan img biasa untuk menghindari error)
  const getInitialAvatar = () => {
    if (avatarUrl) return avatarUrl;
    const name = profile.name || profile.email?.charAt(0) || "User";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=823b18&color=fff&bold=true&length=2`;
  };

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#823b18]/10 flex items-center justify-center">
              <User className="w-6 h-6 text-[#823b18]" />
            </div>
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl text-[#28180b]">Pengaturan Profil</h1>
              <p className="text-sm text-[#54433c] mt-1">
                Kelola informasi akun dan alamat Anda
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Avatar & Info */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#dac1b8]/10 sticky top-24">
              <div className="flex flex-col items-center text-center">
                {/* Avatar - Menggunakan img biasa untuk external URL */}
                <div className="relative mb-4">
                  <div className="w-32 h-32 rounded-full bg-linear-to-br from-[#823b18] to-[#a0522d] flex items-center justify-center text-white shadow-lg overflow-hidden">
                    {avatarUrl ? (
                      <Image
                        fill
                        src={avatarUrl}
                        alt={profile.name || "User"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={getInitialAvatar()}
                        alt={profile.name || "User"}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md cursor-pointer hover:bg-[#fff1e9] transition-all">
                    <Camera className="w-4 h-4 text-[#823b18]" />
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAvatarUpload(file);
                      }}
                      disabled={uploadingAvatar}
                    />
                  </label>
                </div>
                {uploadingAvatar && (
                  <p className="text-xs text-[#823b18] mt-2 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Mengupload...
                  </p>
                )}

                <h2 className="font-serif text-xl text-[#28180b]">{profile.name || "Pengguna"}</h2>
                <p className="text-sm text-[#54433c]">{profile.email}</p>
                
                <div className="w-full mt-6 pt-6 border-t border-[#dac1b8]/10">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#54433c]">Member sejak</span>
                    <span className="text-[#28180b] font-medium">
                      {memberSince || "Bergabung"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Form */}
          <motion.div
            variants={containerVariants}
            className="lg:col-span-2 space-y-6"
          >
            {/* Success/Error Messages */}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl text-emerald-700 text-sm border border-emerald-200"
              >
                <CheckCircle className="w-4 h-4" />
                {successMessage}
              </motion.div>
            )}
            
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-700 text-sm border border-red-200"
              >
                <AlertCircle className="w-4 h-4" />
                {errorMessage}
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informasi Pribadi */}
              <motion.div
                variants={itemVariants}
                className="bg-white rounded-2xl p-6 shadow-sm border border-[#dac1b8]/10"
              >
                <h2 className="font-serif text-xl text-[#28180b] mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#823b18]" />
                  Informasi Pribadi
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#28180b] mb-1">
                      Nama Lengkap
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#87736b]" />
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        placeholder="Nama lengkap Anda"
                        className="w-full bg-white border border-[#dac1b8] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#28180b] placeholder:text-[#87736b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#28180b] mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#87736b]" />
                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className="w-full bg-[#fff8f5] border border-[#dac1b8] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#87736b] cursor-not-allowed"
                      />
                    </div>
                    <p className="text-xs text-[#87736b] mt-1">Email tidak dapat diubah</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#28180b] mb-1">
                      Nomor WhatsApp
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#87736b]" />
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        placeholder="081234567890"
                        className="w-full bg-white border border-[#dac1b8] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#28180b] placeholder:text-[#87736b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none transition-all"
                      />
                    </div>
                    <p className="text-xs text-[#87736b] mt-1">
                      Format: 081234567890 atau +6281234567890
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Alamat */}
              <motion.div
                variants={itemVariants}
                className="bg-white rounded-2xl p-6 shadow-sm border border-[#dac1b8]/10"
              >
                <h2 className="font-serif text-xl text-[#28180b] mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#823b18]" />
                  Alamat
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#28180b] mb-1">
                      Alamat Lengkap
                    </label>
                    <textarea
                      value={profile.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                      rows={3}
                      placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota, Kode Pos"
                      className="w-full bg-white border border-[#dac1b8] rounded-xl px-4 py-2.5 text-sm text-[#28180b] placeholder:text-[#87736b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none resize-none"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.div variants={itemVariants}>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-linear-to-r from-[#823b18] to-[#a0522d] text-white py-3 rounded-xl font-semibold hover:from-[#a0522d] hover:to-[#823b18] transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </motion.div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}