"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Search,
  Bell,
  HelpCircle,
  User,
  Plus,
  Menu,
  X,
  type LucideIcon,
  Newspaper,
} from "lucide-react";

// Tipe untuk menu item
type MenuItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

const menuItems: MenuItem[] = [
  { name: "Ringkasan", href: "/admin", icon: LayoutDashboard },
  { name: "Produk", href: "/admin/products", icon: ShoppingBag },
  { name: "Pesanan", href: "/admin/orders", icon: ShoppingCart },
  { name: "Pelanggan", href: "/admin/customers", icon: Users },
  { name: "Pengaturan", href: "/admin/settings", icon: Settings },
  { name: "Laporan", href: "/admin/reports", icon: Newspaper },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [status, session, router]);

  // Detect scroll for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobileMenuOpen]);

  // Show loading while checking auth
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#fff8f5] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-[#823b18] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // Don't render if not admin
  if (session?.user?.role !== "ADMIN") {
    return null;
  }

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  const getInitials = (name: string | null | undefined): string => {
    if (!name) return "A";
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#fff8f5]" style={{ backgroundImage: "radial-gradient(#823b1805 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
      
      {/* Mobile Menu Button - hanya tampil di mobile */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white rounded-xl shadow-md border border-[#dac1b8]/20"
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5 text-[#823b18]" />
        ) : (
          <Menu className="w-5 h-5 text-[#823b18]" />
        )}
      </button>

      {/* Sidebar - Desktop selalu terlihat, mobile muncul saat toggle */}
      <aside
        className={`
          fixed left-0 top-0 z-40 h-screen w-64 bg-[#fff1e9] shadow-xl flex flex-col py-6 px-3
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#823b18] to-[#a0522d] flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-xl">RB</span>
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#823b18] leading-tight">Ratan Bakery</h1>
            <p className="text-[11px] font-semibold tracking-wider text-[#54433c] opacity-70">Admin Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group ${
                  isActive
                    ? "bg-linear-to-r from-[#fbddc7] to-[#ffdbcd] text-[#823b18] font-bold shadow-sm"
                    : "text-[#54433c] hover:bg-[#fbddc7] hover:text-[#823b18]"
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 ${!isActive && "group-hover:scale-110"}`} />
                <span className="text-sm font-semibold tracking-wide">{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#823b18]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="mt-auto space-y-3 pt-4 border-t border-[#dac1b8]/20">
          <div className="p-3 bg-white/50 backdrop-blur-sm rounded-xl flex items-center gap-3 border border-[#dac1b8]/20">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#823b18] to-[#a0522d] flex items-center justify-center text-white shadow-sm">
              <User className="w-5 h-5" />
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-semibold text-[#28180b] truncate">{session?.user?.name || "Admin User"}</p>
              <p className="text-[10px] text-[#54433c] truncate uppercase tracking-wider">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#ba1a1a] hover:bg-[#ffdad6] transition-all duration-200 cursor-pointer group"
          >
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            <span className="text-sm font-semibold tracking-wide">Keluar</span>
          </button>
        </div>
      </aside>

      {/* Overlay untuk mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden cursor-pointer"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Top Navbar */}
      <header
        className={`
          fixed top-0 right-0 z-30 h-16 bg-[#fff8f5]/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6
          transition-all duration-300
          ${isScrolled ? "shadow-md border-b border-[#dac1b8]/20" : "shadow-sm"}
          left-0 lg:left-64
        `}
      >
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#87736b]" />
            <input
              type="text"
              placeholder="Cari pesanan, produk..."
              className="w-full bg-[#fff1e9] border border-[#dac1b8]/30 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#823b18]/20 focus:border-[#823b18] outline-none transition-all text-[#28180b]"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 ml-auto">
          <button className="relative text-[#54433c] hover:text-[#823b18] transition-colors cursor-pointer p-2 rounded-lg hover:bg-[#823b18]/5">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#ba1a1a] rounded-full" />
          </button>
          <button className="text-[#54433c] hover:text-[#823b18] transition-colors cursor-pointer hidden md:flex p-2 rounded-lg hover:bg-[#823b18]/5">
            <HelpCircle className="w-5 h-5" />
          </button>
          <div className="h-8 w-px bg-[#dac1b8]/30 hidden md:block"></div>
          <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#823b18] to-[#a0522d] flex items-center justify-center text-white shadow-md cursor-pointer">
            <span className="text-sm font-bold">
              {getInitials(session?.user?.name)}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className={`
          transition-all duration-300
          pt-20 px-4 md:px-6 pb-6
          lg:ml-64
        `}
      >
        {children}
      </main>

      {/* FAB Button */}
      <button className="fixed bottom-6 right-6 w-14 h-14 bg-linear-to-br from-[#823b18] to-[#a0522d] text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 z-40 cursor-pointer group">
        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </div>
  );
}