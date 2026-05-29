// app/customer/layout.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Settings,
  LogOut,
  Coffee,
  Menu,
  X,
  ChevronDown,
  AlertTriangle,
  LogOut as LogOutIcon,
  Notebook,
  ArrowLeft,
} from "lucide-react";

type LayoutProps = {
  children: React.ReactNode;
};

type MobileMenuOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
  pathname: string;
};

type LogoutModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
};

type UserData = {
  name: string;
  email: string;
  phone: string;
  address: string;
  avatar: string | null;
};

// Konfigurasi halaman yang membutuhkan navbar khusus
const CHECKOUT_PATH = "/customer/checkout";
const ORDER_DETAIL_PATTERN = /^\/customer\/orders\/[^\/]+$/;
const SETTINGS_PATH = "/customer/settings";

// Animation variants
const underlineVariants = {
  hidden: { width: "0%", opacity: 0 },
  visible: { width: "100%", opacity: 1 },
};

// Mobile Menu Overlay Component
const MobileMenuOverlay = ({
  isOpen,
  onClose,
  pathname,
}: MobileMenuOverlayProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          />
          
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="
              lg:hidden
              fixed
              top-[73px]
              left-0
              right-0
              z-50
              bg-white
              rounded-b-2xl
              shadow-xl
              border-b border-[#dac1b8]/20
              overflow-hidden
            "
          >
            <div className="px-5 py-4 bg-linear-to-r from-[#ffdbcd]/20 to-transparent border-b border-[#dac1b8]/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#823b18] to-[#a0522d] flex items-center justify-center text-white shadow-sm">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#28180b]">Menu Navigasi</p>
                  <p className="text-xs text-[#54433c]">Pilih halaman yang dituju</p>
                </div>
              </div>
            </div>
            
            <div className="p-3 space-y-1">
              <Link
                href="/customer"
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer
                  ${pathname === "/customer"
                    ? "bg-[#823b18]/10 text-[#823b18] font-semibold"
                    : "text-[#54433c] hover:bg-[#fff1e9] hover:translate-x-1"
                  }
                `}
              >
                <Coffee className="w-5 h-5" />
                <span>Produk</span>
                {pathname === "/customer" && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-[#823b18]"
                  />
                )}
              </Link>
              <Link
                href="/customer/orders"
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer
                  ${pathname === "/customer/orders"
                    ? "bg-[#823b18]/10 text-[#823b18] font-semibold"
                    : "text-[#54433c] hover:bg-[#fff1e9] hover:translate-x-1"
                  }
                `}
              >
                <Notebook className="w-5 h-5" />
                <span>Pesanan Saya</span>
                {pathname === "/customer/orders" && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-[#823b18]"
                  />
                )}
              </Link>
              <Link
                href="/customer/settings"
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer
                  ${pathname === "/customer/settings"
                    ? "bg-[#823b18]/10 text-[#823b18] font-semibold"
                    : "text-[#54433c] hover:bg-[#fff1e9] hover:translate-x-1"
                  }
                `}
              >
                <Settings className="w-5 h-5" />
                <span>Pengaturan</span>
                {pathname === "/customer/settings" && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-[#823b18]"
                  />
                )}
              </Link>
            </div>
            
            <div className="p-3 border-t border-[#dac1b8]/10 bg-[#fff8f5]">
              <button
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-[#54433c] hover:bg-[#fff1e9] transition-all duration-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
                Tutup Menu
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Logout Modal Component
const LogoutModal = ({
  isOpen,
  onClose,
  onConfirm,
  userName,
}: LogoutModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
          >
            <div className="p-6 bg-linear-to-r from-red-50 to-transparent border-b border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="font-serif text-xl text-[#28180b]">
                  Konfirmasi Keluar
                </h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-[#54433c]">
                Apakah Anda yakin ingin keluar dari akun{" "}
                <strong>{userName}</strong>?
              </p>
              <p className="text-xs text-[#87736b] mt-2">
                Anda akan diarahkan ke halaman utama dan perlu login kembali
                untuk mengakses akun.
              </p>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-[#dac1b8] text-[#54433c] rounded-xl text-sm font-semibold hover:bg-[#fff1e9] transition-all cursor-pointer"
              >
                Batal
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onConfirm}
                className="flex-1 bg-linear-to-r from-red-500 to-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:from-red-600 hover:to-red-700 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
              >
                <LogOutIcon className="w-4 h-4" />
                Keluar
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default function CustomerLayout({ children }: LayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const isCheckoutPage = pathname === CHECKOUT_PATH;
  const isOrderDetailPage = ORDER_DETAIL_PATTERN.test(pathname || "");
  const isSettingsPage = pathname === SETTINGS_PATH;
  const needsBackButton = isCheckoutPage || isOrderDetailPage || isSettingsPage;

  // Ambil data user dari database (termasuk avatar)
  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user?.id) return;
      
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          setUserData(data);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [session?.user?.id]);

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

  // Close mobile menu when window resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    setShowLogoutModal(false);
    signOut({ callbackUrl: "/" });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#fff8f5] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#823b18] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  // Nama dan avatar dari database
  const displayName = userData?.name || session?.user?.name || "";
  const displayEmail = userData?.email || session?.user?.email || "";
  const avatarUrl = userData?.avatar || null;
  
  // Avatar fallback: gunakan UI Avatars jika belum upload gambar
  const getAvatarUrl = () => {
    if (avatarUrl) return avatarUrl;
    const name = displayName || "User";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=823b18&color=fff&bold=true&length=2`;
  };

  const getBackUrl = () => {
    if (isCheckoutPage) return "/customer";
    if (isOrderDetailPage) return "/customer/orders";
    if (isSettingsPage) return "/customer";
    return "/customer";
  };

  // Navbar dengan tombol back
  if (needsBackButton) {
    return (
      <div className="min-h-screen bg-[#fff8f5] relative">
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

        <nav className="bg-[#fff8f5]/90 backdrop-blur-md sticky top-0 z-50 border-b border-[#dac1b8]/30 shadow-sm">
          <div className="px-4 md:px-6 py-4 flex justify-between items-center">
            <Link
              href={getBackUrl()}
              className="flex items-center gap-2 p-2 -ml-2 rounded-lg hover:bg-[#823b18]/10 transition-all cursor-pointer group"
            >
              <motion.div whileHover={{ x: -4 }} transition={{ duration: 0.2 }}>
                <ArrowLeft className="w-5 h-5 text-[#823b18]" />
              </motion.div>
              <span className="hidden sm:inline text-sm text-[#54433c] group-hover:text-[#823b18] transition-colors">
                Kembali
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#823b18] flex items-center justify-center">
                <Coffee className="w-4 h-4 text-white" />
              </div>
              <Link
                href="/"
                className="font-serif text-xl md:text-2xl font-bold text-[#823b18] cursor-pointer hover:opacity-80 transition-opacity"
              >
                Ratan Bakery
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-[#823b18]/10 rounded-full transition-all text-[#823b18] cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="relative" ref={profileDropdownRef}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 p-2 hover:bg-[#823b18]/10 rounded-full transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#823b18] to-[#a0522d] flex items-center justify-center text-white shadow-sm overflow-hidden">
                    <img
                      src={getAvatarUrl()}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="hidden md:inline text-sm text-[#54433c]">
                    {displayName}
                  </span>
                  <motion.div
                    animate={{ rotate: isProfileDropdownOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-[#54433c]" />
                  </motion.div>
                </motion.button>

                <AnimatePresence>
                  {isProfileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-[#dac1b8]/20 overflow-hidden z-50"
                    >
                      <Link
                        href="/customer/settings"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-[#54433c] hover:bg-[#fff1e9] transition-colors cursor-pointer"
                      >
                        <Settings className="w-4 h-4" />
                        Pengaturan
                      </Link>
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          setShowLogoutModal(true);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer border-t border-[#dac1b8]/20"
                      >
                        <LogOut className="w-4 h-4" />
                        Keluar
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </nav>

        <MobileMenuOverlay
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          pathname={pathname || ""}
        />

        {children}

        <LogoutModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={handleLogout}
          userName={displayName}
        />
      </div>
    );
  }

  // Navbar untuk halaman customer biasa
  return (
    <div className="min-h-screen bg-[#fff8f5] relative">
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

      <nav className="bg-[#fff8f5]/90 backdrop-blur-md sticky top-0 z-50 border-b border-[#dac1b8]/30 shadow-sm">
        <div className="px-4 md:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-[#823b18]/10 rounded-full transition-all text-[#823b18] cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#823b18] flex items-center justify-center">
                <Coffee className="w-4 h-4 text-white" />
              </div>
              <Link
                href="/"
                className="font-serif text-xl md:text-2xl font-bold text-[#823b18] cursor-pointer hover:opacity-80 transition-opacity"
              >
                Ratan Bakery
              </Link>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            <Link
              href="/customer"
              className="relative text-sm cursor-pointer group"
            >
              <span
                className={`${pathname === "/customer" ? "text-[#823b18]" : "text-[#54433c] group-hover:text-[#823b18]"} transition-colors duration-300`}
              >
                Produk
              </span>
              <motion.div
                className="absolute -bottom-1 left-0 h-0.5 bg-[#823b18] rounded-full"
                variants={underlineVariants}
                initial="hidden"
                animate={pathname === "/customer" ? "visible" : "hidden"}
                transition={{ duration: 0.3 }}
              />
            </Link>
            <Link
              href="/customer/orders"
              className="relative text-sm cursor-pointer group"
            >
              <span
                className={`${pathname === "/customer/orders" ? "text-[#823b18]" : "text-[#54433c] group-hover:text-[#823b18]"} transition-colors duration-300`}
              >
                Pesanan Saya
              </span>
              <motion.div
                className="absolute -bottom-1 left-0 h-0.5 bg-[#823b18] rounded-full"
                variants={underlineVariants}
                initial="hidden"
                animate={pathname === "/customer/orders" ? "visible" : "hidden"}
                transition={{ duration: 0.3 }}
              />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative" ref={profileDropdownRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2 p-2 hover:bg-[#823b18]/10 rounded-full transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#823b18] to-[#a0522d] flex items-center justify-center text-white shadow-sm overflow-hidden">
                  <img
                    src={getAvatarUrl()}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="hidden md:inline text-sm text-[#54433c]">
                  {displayName}
                </span>
                <motion.div
                  animate={{ rotate: isProfileDropdownOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 text-[#54433c]" />
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {isProfileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-[#dac1b8]/20 overflow-hidden z-50"
                  >
                    <Link
                      href="/customer/settings"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-[#54433c] hover:bg-[#fff1e9] transition-colors cursor-pointer"
                    >
                      <Settings className="w-4 h-4" />
                      Pengaturan
                    </Link>
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setShowLogoutModal(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer border-t border-[#dac1b8]/20"
                    >
                      <LogOut className="w-4 h-4" />
                      Keluar
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      <MobileMenuOverlay
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        pathname={pathname || ""}
      />

      {children}

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        userName={displayName}
      />
    </div>
  );
}