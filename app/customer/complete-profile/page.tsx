// app/customer/complete-profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  Phone,
  Save,
  RefreshCw,
  AlertCircle,
  Coffee,
} from "lucide-react";

export default function CompleteProfilePage() {
  const { status, update } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkAndLoadProfile = async () => {
      if (status !== "authenticated") return;

      try {
        // Cek profile dari database via API
        const res = await fetch("/api/user/check-profile");
        if (res.ok) {
          const data = await res.json();
          // Jika sudah lengkap, redirect ke customer
          if (data.isProfileComplete === true) {
            router.push("/customer");
            return;
          }
        }

        // Ambil data user untuk diisi di form
        const profileRes = await fetch("/api/user/profile");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setName(profileData.name || "");
          setPhone(profileData.phone || "");
        }
      } catch (error) {
        console.error("Error checking profile:", error);
      }
    };

    checkAndLoadProfile();
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Mencegah reload form bawaan HTML
    setIsLoading(true);
    setError("");

    if (!name.trim()) {
      setError("Nama lengkap wajib diisi");
      setIsLoading(false);
      return;
    }

    if (!phone.trim()) {
      setError("Nomor WhatsApp wajib diisi");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/user/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });

      if (res.ok) {
        // Update session - biarkan loading di tombol, jangan trigger full screen loader
        await update({
          isProfileComplete: true,
          name: name.trim(),
          phone: phone.trim(),
        });
        
        // Redirect smooth tanpa refresh
        router.push("/customer");
      } else {
        const data = await res.json();
        setError(data.error || "Gagal menyimpan data");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError("Terjadi kesalahan, silakan coba lagi");
      setIsLoading(false);
    }
  };

  // Hanya loading session awal, tidak untuk redirecting
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#fff8f5] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#823b18] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff8f5] flex items-center justify-center p-4 relative">
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#823b18] flex items-center justify-center mx-auto mb-4">
            <Coffee className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-serif text-2xl text-[#28180b]">Lengkapi Profil</h1>
          <p className="text-[#54433c] text-sm mt-2">
            Silakan lengkapi data diri Anda terlebih dahulu
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-50 rounded-xl text-red-600 text-sm flex items-center gap-2 border border-red-200"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[#28180b] mb-2">
              Nama Lengkap
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#87736b]" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama lengkap Anda"
                className="w-full bg-[#fff1e9] border border-[#dac1b8] rounded-xl pl-11 pr-4 py-3 text-sm text-[#28180b] placeholder:text-[#87736b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none transition-all"
                required
                disabled={isLoading}
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#28180b] mb-2">
              Nomor WhatsApp
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#87736b]" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="081234567890"
                className="w-full bg-[#fff1e9] border border-[#dac1b8] rounded-xl pl-11 pr-4 py-3 text-sm text-[#28180b] placeholder:text-[#87736b] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none transition-all"
                required
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-[#87736b] mt-1">
              Format: 081234567890 atau +6281234567890
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#823b18] text-white py-3 rounded-xl font-semibold hover:bg-[#a0522d] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6 shadow-md hover:shadow-lg"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan & Lanjutkan</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#dac1b8]/30 text-center">
          <p className="text-[11px] text-[#54433c] opacity-60">
            Data Anda akan kami jaga kerahasiaannya
          </p>
        </div>
      </motion.div>
    </div>
  );
}