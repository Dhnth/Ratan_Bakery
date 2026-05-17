"use client";

import { useState, useEffect, useCallback } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  LogIn,
  Home,
  Store,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Cek apakah baru register - pindahkan logic ke dalam useEffect dengan aman
  useEffect(() => {
    const registered = searchParams.get("registered");
    if (registered === "true") {
      // Gunakan setTimeout untuk menghindari warning setState sync dalam effect
      const timer = setTimeout(() => {
        setSuccessMessage("Pendaftaran berhasil! Silakan masuk dengan akun Anda.");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(result.error === "CredentialsSignin" ? "Email atau password salah" : result.error);
      setLoading(false);
    } else {
      router.push("/admin");
      router.refresh();
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
          alt="Artisanal chocolate bun"
          fill
          className="object-cover transition-transform duration-700 hover:scale-105"
          src="https://lh3.googleusercontent.com/aida/ADBb0uhCp8YNeU_0fQ283uoVtnckdDcQihvWCgb0_ko3XnIq_poa2blAkiNiddO9Qgixlfa9SgY2m0MviUpJiT8LcmWW5axTWPZM0uKlHlsivi12Qgp637TCsnnPFwlgPW-Ri_iFWK0-2u6FmOAZ02HKiXpVUZ37rAZCpLkE2hFwJHgWwvED3vxWd5n_gMC8uo-k42ppsw_MByBCNU8axehGKox43qbioEPoin64NIzf1xpKXkbMuX5WbDqhfw"
          sizes="50vw"
          priority
        />
        <div className="relative z-20 flex flex-col justify-end p-12 bg-linear-to-t from-[#823b18]/80 to-transparent h-full w-full">
          <h1 className="font-serif text-5xl text-white mb-2">Jantungnya Roti Artisanal</h1>
          <p className="text-lg text-white/90 max-w-md">
            Rasakan kehangatan roti artisanal yang baru dipanggang, dibuat dengan cinta dan tradisi setiap pagi.
          </p>
          <div className="flex gap-2 mt-6">
            <div className="w-12 h-1 bg-white/60 rounded-full"></div>
            <div className="w-6 h-1 bg-white/30 rounded-full"></div>
            <div className="w-6 h-1 bg-white/30 rounded-full"></div>
          </div>
        </div>
      </motion.div>

      {/* Right Side: Login Form */}
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
            <h2 className="font-serif text-4xl text-[#28180b] mb-2">Selamat Datang</h2>
            <p className="text-[#54433c]">Masuk ke akun Anda untuk melanjutkan</p>
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
            onClick={() => signIn("google", { callbackUrl: "/admin" })}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-[#dac1b8] rounded-xl bg-white text-[#28180b] font-semibold text-sm transition-all hover:bg-[#fff1e9] hover:border-[#823b18]/30 hover:shadow-md active:scale-[0.98] cursor-pointer group"
          >
            <svg className="w-5 h-5 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Lanjutkan dengan Google
          </motion.button>

          {/* Divider */}
          <motion.div variants={itemVariants} className="relative flex items-center justify-center">
            <div className="grow border-t border-[#dac1b8]"></div>
            <span className="mx-4 text-[#54433c] font-semibold text-[10px] uppercase tracking-wider">
              atau masuk dengan email
            </span>
            <div className="grow border-t border-[#dac1b8]"></div>
          </motion.div>

          {/* Credentials Form */}
          <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block font-semibold text-sm text-[#28180b] mb-2" htmlFor="email">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#87736b]" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@example.com"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#fff1e9] border border-[#dac1b8] focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] transition-all text-[#28180b] outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block font-semibold text-sm text-[#28180b]" htmlFor="password">
                  Kata Sandi
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-[#823b18] hover:underline transition-all cursor-pointer"
                >
                  Lupa kata sandi?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#87736b]" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-[#dac1b8] text-[#823b18] focus:ring-[#823b18] focus:ring-offset-0 bg-[#fff1e9] cursor-pointer"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-[#54433c] cursor-pointer">
                Ingat saya
              </label>
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
                  <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  Masuk
                </>
              )}
            </motion.button>
          </motion.form>

          {/* Register Link */}
          <motion.p variants={itemVariants} className="text-center text-sm text-[#54433c]">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="text-[#823b18] font-semibold hover:underline transition-all inline-flex items-center gap-1 group cursor-pointer"
            >
              Daftar di sini
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </motion.p>

          {/* Footer Info */}
          <motion.div variants={itemVariants} className="pt-6 border-t border-[#dac1b8]/30 text-center md:text-left">
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