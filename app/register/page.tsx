"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Home,
  Store,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: "",
    hasMinLength: false,
    hasNumber: false,
    hasUpperCase: false,
    hasSpecialChar: false,
  });

  // Reset success message setelah beberapa detik
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === "password") {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password: string) => {
    const hasMinLength = password.length >= 6;
    const hasNumber = /\d/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    let score = 0;
    if (hasMinLength) score++;
    if (hasNumber) score++;
    if (hasUpperCase) score++;
    if (hasSpecialChar) score++;

    let message = "";
    if (password.length === 0) message = "";
    else if (score <= 1) message = "Password lemah";
    else if (score === 2) message = "Password sedang";
    else if (score === 3) message = "Password kuat";
    else if (score === 4) message = "Password sangat kuat";

    setPasswordStrength({
      score,
      message,
      hasMinLength,
      hasNumber,
      hasUpperCase,
      hasSpecialChar,
    });
  };

  const getStrengthColor = () => {
    if (passwordStrength.score === 0) return "bg-[#dac1b8] w-0";
    if (passwordStrength.score === 1) return "bg-[#ba1a1a] w-1/4";
    if (passwordStrength.score === 2) return "bg-[#f59e0b] w-1/2";
    if (passwordStrength.score === 3) return "bg-[#496800] w-3/4";
    return "bg-[#496800] w-full";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    if (form.password.length < 6) {
      setError("Password minimal 6 karakter");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage("Pendaftaran berhasil! Mengalihkan ke halaman login...");
        setTimeout(() => {
          router.push("/login?registered=true");
        }, 1500);
      } else {
        setError(data.error || "Registrasi gagal");
      }
    } catch (err) {
      setError("Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  // Variants untuk animasi
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  };

  const imageVariants = {
    hidden: { scale: 1.1, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { duration: 0.8 } },
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#fff8f5]">
      {/* Left Side: Split Image dengan Animasi */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={imageVariants}
        className="hidden md:flex md:w-1/2 lg:w-3/5 relative overflow-hidden bg-[#ffeadc]"
      >
        <div className="absolute inset-0 bg-[#823b18]/10 mix-blend-multiply z-10"></div>
        <Image
          alt="Artisanal bakery"
          fill
          className="object-cover transition-transform duration-700 hover:scale-105"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBxSkgf3S4ukvs2bP9BvP9hsx8Ueya_lZqf2tWo_4SMMc_bQuqMrWVuYbf3sUr2_eCXr7Z0wf1tvSFOvbiQyGkKAqB0FkNjCMlnIPvRH-NyjA9OzmXlrwqFpl_Pv_Sg-PmzQQt2R-ZV36QC6Cq5rIS6g8XriFEegXaFr0HT_JfI41HycdQf_GgHTC6ZB06aWeDR6uk71NpGue8ouLhmfX8d5Pec3ZSWchxF5JZdpQV196inUaXoSAWe0r1LL7ANvzUZC-YqQsWwcbY"
          sizes="50vw"
          priority
        />
        <div className="relative z-20 flex flex-col justify-end p-12 bg-linear-to-t from-[#823b18]/80 to-transparent h-full w-full">
          <h1 className="font-serif text-5xl text-white mb-2">Bergabung dengan Kami</h1>
          <p className="text-lg text-white/90 max-w-md">
            Jadilah bagian dari keluarga Ratan Bakery. Nikmati roti artisanal terbaik setiap hari.
          </p>
          <div className="flex gap-2 mt-6">
            <div className="w-12 h-1 bg-white/60 rounded-full"></div>
            <div className="w-6 h-1 bg-white/30 rounded-full"></div>
            <div className="w-6 h-1 bg-white/30 rounded-full"></div>
          </div>
        </div>
      </motion.div>

      {/* Right Side: Register Form */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full md:w-1/2 lg:w-2/5 flex flex-col justify-center items-center px-4 md:px-8 py-12 bg-[#fff8f5]"
      >
        <div className="w-full max-w-md space-y-6">
          {/* Tombol Kembali */}
          <motion.div variants={itemVariants} className="mb-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-[#54433c] hover:text-[#823b18] transition-colors group cursor-pointer"
            >
              <Home className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Kembali ke Beranda
            </Link>
          </motion.div>

          {/* Branding Header */}
          <motion.div variants={itemVariants} className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#823b18] flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <span className="font-serif text-3xl font-bold text-[#823b18]">Ratan Bakery</span>
            </div>
            <h2 className="font-serif text-4xl text-[#28180b] mb-2">Daftar Akun</h2>
            <p className="text-[#54433c]">Bergabung dengan keluarga artisanal kami</p>
          </motion.div>

          {/* Success Message */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#c8f17a]/20 text-[#496800] p-3 rounded-lg text-sm text-center flex items-center gap-2 justify-center border border-[#c8f17a]/30"
            >
              <CheckCircle className="w-4 h-4" />
              {successMessage}
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#ffdad6] text-[#ba1a1a] p-3 rounded-lg text-sm text-center flex items-center gap-2 justify-center border border-[#ba1a1a]/20"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}

          {/* Google Auth */}
          <motion.button
            variants={itemVariants}
            type="button"
            onClick={() => console.log("Google signup")}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-[#dac1b8] rounded-xl bg-white text-[#28180b] font-semibold text-sm transition-all hover:bg-[#fff1e9] hover:border-[#823b18]/30 hover:shadow-md active:scale-[0.98] cursor-pointer group"
          >
            <svg className="w-5 h-5 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Daftar dengan Google
          </motion.button>

          {/* Divider */}
          <motion.div variants={itemVariants} className="relative flex items-center justify-center">
            <div className="grow border-t border-[#dac1b8]"></div>
            <span className="mx-4 text-[#54433c] font-semibold text-[10px] uppercase tracking-wider">
              atau daftar dengan email
            </span>
            <div className="grow border-t border-[#dac1b8]"></div>
          </motion.div>

          {/* Registration Form */}
          <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-4">
            {/* Nama Lengkap */}
            <div>
              <label className="block font-semibold text-sm text-[#28180b] mb-2">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#87736b]" />
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#fff1e9] border border-[#dac1b8] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] transition-all text-[#28180b] outline-none"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block font-semibold text-sm text-[#28180b] mb-2">Alamat Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#87736b]" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="nama@example.com"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#fff1e9] border border-[#dac1b8] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] transition-all text-[#28180b] outline-none"
                />
              </div>
            </div>

            {/* Nomor WhatsApp */}
            <div>
              <label className="block font-semibold text-sm text-[#28180b] mb-2">Nomor WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#87736b]" />
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="081234567890"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#fff1e9] border border-[#dac1b8] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] transition-all text-[#28180b] outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block font-semibold text-sm text-[#28180b] mb-2">Kata Sandi</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#87736b]" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-12 py-3 rounded-xl bg-[#fff1e9] border border-[#dac1b8] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] transition-all text-[#28180b] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#87736b] hover:text-[#823b18] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {form.password.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="h-1.5 bg-[#dac1b8] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${getStrengthColor()}`} />
                  </div>
                  <p className={`text-xs font-semibold ${
                    passwordStrength.score === 1 ? "text-[#ba1a1a]" :
                    passwordStrength.score === 2 ? "text-[#f59e0b]" : "text-[#496800]"
                  }`}>
                    {passwordStrength.message}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      {passwordStrength.hasMinLength ? (
                        <CheckCircle className="w-3 h-3 text-[#496800]" />
                      ) : (
                        <XCircle className="w-3 h-3 text-[#ba1a1a]" />
                      )}
                      <span className={passwordStrength.hasMinLength ? "text-[#496800]" : "text-[#54433c]"}>
                        Minimal 6 karakter
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {passwordStrength.hasNumber ? (
                        <CheckCircle className="w-3 h-3 text-[#496800]" />
                      ) : (
                        <XCircle className="w-3 h-3 text-[#ba1a1a]" />
                      )}
                      <span className={passwordStrength.hasNumber ? "text-[#496800]" : "text-[#54433c]"}>
                        Mengandung angka
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {passwordStrength.hasUpperCase ? (
                        <CheckCircle className="w-3 h-3 text-[#496800]" />
                      ) : (
                        <XCircle className="w-3 h-3 text-[#ba1a1a]" />
                      )}
                      <span className={passwordStrength.hasUpperCase ? "text-[#496800]" : "text-[#54433c]"}>
                        Huruf besar
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {passwordStrength.hasSpecialChar ? (
                        <CheckCircle className="w-3 h-3 text-[#496800]" />
                      ) : (
                        <XCircle className="w-3 h-3 text-[#ba1a1a]" />
                      )}
                      <span className={passwordStrength.hasSpecialChar ? "text-[#496800]" : "text-[#54433c]"}>
                        Karakter spesial
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-[#823b18] text-white font-semibold py-3.5 rounded-xl shadow-md hover:bg-[#a0522d] hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#823b18] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer group"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  Daftar Sekarang
                </>
              )}
            </motion.button>
          </motion.form>

          {/* Login Link */}
          <motion.p variants={itemVariants} className="text-center text-sm text-[#54433c]">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="text-[#823b18] font-semibold hover:underline transition-all inline-flex items-center gap-1 group cursor-pointer"
            >
              Masuk di sini
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </motion.p>

          {/* Terms */}
          <motion.p variants={itemVariants} className="text-center text-[11px] text-[#54433c]">
            Dengan mendaftar, Anda menyetujui{" "}
            <Link href="#" className="text-[#823b18] font-bold hover:underline transition-colors cursor-pointer">
              Syarat & Ketentuan
            </Link>{" "}
            dan{" "}
            <Link href="#" className="text-[#823b18] font-bold hover:underline transition-colors cursor-pointer">
              Kebijakan Privasi
            </Link>
          </motion.p>

          {/* Footer Info */}
          <motion.div variants={itemVariants} className="pt-4 border-t border-[#dac1b8]/30 text-center">
            <p className="text-[11px] text-[#54433c] opacity-60">© 2025 Ratan Bakery. Dibuat dengan cinta.</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 w-full p-4 flex justify-center items-center bg-[#fff8f5]/90 backdrop-blur-md z-50 border-b border-[#dac1b8]/30">
        <div className="flex items-center gap-2">
          <Store className="w-6 h-6 text-[#823b18]" />
          <span className="font-serif text-2xl font-bold text-[#823b18]">Ratan Bakery</span>
        </div>
      </div>
    </div>
  );
}