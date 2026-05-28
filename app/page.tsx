"use client";

import { AnimatePresence, motion, Variants } from "framer-motion";
import {
  ShoppingCart,
  Menu,
  X,
  ArrowRight,
  Clock,
  MapPin,
  Truck,
  CheckCircle,
  House,
  MessageCircle,
  Camera,
  Mail,
  LogIn,
  Plus,
  UserPlus,
  // Home,
  Wheat,
  Star,
  Award,
  Shield,
  Heart,
  Coffee,
  Croissant,
  BadgeCheck,
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

// Tipe data produk
type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
};

type Settings = {
  store_name?: string;
  store_description?: string;
  hero_title?: string;
  hero_subtitle?: string;
  whatsapp_number?: string;
  operational_days?: string;
  operational_hours_start?: string;
  operational_hours_end?: string;
  store_address?: string;
  delivery_radius_km?: string;
  delivery_fee_within_radius?: string;
  delivery_fee_outside_radius?: string;
  [key: string]: string | undefined;
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
};

// Menu items untuk navbar
const menuItems = [
  { name: "Beranda", href: "#home" },
  { name: "Roti Harian", href: "#daily" },
  { name: "Spesial Order", href: "#special" },
  { name: "Lokasi", href: "#location" },
];

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dailyProducts, setDailyProducts] = useState<Product[]>([]);
  const [specialProducts, setSpecialProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Settings>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("home");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dailyRes, specialRes, settingsRes] = await Promise.all([
          fetch("/api/products?type=daily"),
          fetch("/api/products?type=special"),
          fetch("/api/settings"),
        ]);

        if (dailyRes.ok) setDailyProducts(await dailyRes.json());
        if (specialRes.ok) setSpecialProducts(await specialRes.json());
        if (settingsRes.ok) setSettings(await settingsRes.json());
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Scroll spy untuk aktifkan menu dan navbar style
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["home", "daily", "special", "location"];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section);
            break;
          }
        }
      }
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const renderHeroTitle = (title: string) => {
    if (!title) return null;
    const words = title.split(" ");
    if (words.length <= 1) return title;
    const lastWord = words.pop();
    return (
      <>
        {words.join(" ")} <br />
        <span className="text-[#a0522d] italic">{lastWord}</span>
      </>
    );
  };

  const storeName = settings.store_name || "Ratan Bakery";
  const storeDesc =
    settings.store_description ||
    "Dibuat dengan cinta untuk keluarga Anda. Kualitas artisanal dengan sentuhan kehangatan rumah.";
  const heroTitle = settings.hero_title || "Roti Enak untuk Keluarga";
  const heroSubtitle =
    settings.hero_subtitle ||
    "Dibuat dengan cinta dari dapur kami ke rumah Anda. Menggunakan bahan pilihan untuk kebahagiaan di setiap gigitan.";
  const waNumber = settings.whatsapp_number || "6281234567890";
  const waLink = `https://wa.me/${waNumber}`;

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fff8f5] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#823b18] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="bg-[#fff8f5] text-[#28180b] font-sans selection:bg-[#ffdbcd] selection:text-[#360f00] overflow-x-hidden">
      {/* --- NAVBAR (Fixed / Sticky) --- */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#fff8f5]/95 backdrop-blur-md shadow-md"
            : "bg-[#fff8f5]/90 backdrop-blur-sm"
        } border-b border-[#dac1b8]/30`}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 md:px-8 py-4">
          {/* Logo dengan icon */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => scrollToSection("home")}
          >
            <div className="w-9 h-9 rounded-lg bg-[#823b18] flex items-center justify-center">
              <Croissant className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl md:text-3xl font-bold text-[#823b18] font-serif">
              {storeName}
            </span>
          </motion.div>

          {/* Desktop Menu dengan icon */}
          <div className="hidden md:flex items-center gap-8">
            {menuItems.map((item) => {
              const sectionId = item.href.substring(1);
              const isActive = activeSection === sectionId;
              return (
                <button
                  key={item.name}
                  onClick={() => scrollToSection(sectionId)}
                  className="relative group cursor-pointer flex items-center gap-1.5"
                >
                  <span
                    className={`text-sm font-semibold transition-colors ${
                      isActive
                        ? "text-[#823b18]"
                        : "text-[#54433c] group-hover:text-[#823b18]"
                    }`}
                  >
                    {item.name}
                  </span>
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-[#823b18] transition-all duration-300 ${
                      isActive ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Right Side - Login & Register Buttons */}
          <div className="flex items-center gap-3">
            <button className="relative p-2 hover:bg-[#a0522d]/10 rounded-full transition-all cursor-pointer hidden md:flex">
              <ShoppingCart className="text-[#823b18] w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-[#496800] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                3
              </span>
            </button>

            <Link
              href="/login"
              className="bg-[#823b18] text-white px-5 py-2 rounded-lg font-semibold text-sm transition-all hover:bg-[#a0522d] shadow-sm hidden md:flex items-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" /> Masuk
            </Link>

            <Link
              href="/register"
              className="border border-[#823b18] text-[#823b18] px-5 py-2 rounded-lg font-semibold text-sm transition-all hover:bg-[#823b18]/5 hidden md:flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> Daftar
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 cursor-pointer"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-[#823b18]" />
              ) : (
                <Menu className="w-6 h-6 text-[#823b18]" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu dengan Animasi */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 35,
                duration: 0.3,
              }}
              className="md:hidden bg-[#fff8f5] border-t border-[#dac1b8]/20 overflow-hidden"
            >
              <motion.div
                initial="closed"
                animate="open"
                exit="closed"
                variants={{
                  open: {
                    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
                  },
                  closed: {
                    transition: { staggerChildren: 0.02, staggerDirection: -1 },
                  },
                }}
                className="px-4 py-4 flex flex-col gap-4"
              >
                {menuItems.map((item) => {
                  const sectionId = item.href.substring(1);
                  const isActive = activeSection === sectionId;
                  return (
                    <motion.button
                      key={item.name}
                      variants={{
                        open: { x: 0, opacity: 1 },
                        closed: { x: -20, opacity: 0 },
                      }}
                      onClick={() => scrollToSection(sectionId)}
                      className={`flex items-center gap-3 py-2 text-base font-semibold transition-colors cursor-pointer ${
                        isActive
                          ? "text-[#823b18]"
                          : "text-[#54433c] hover:text-[#823b18]"
                      }`}
                    >
                      {item.name}
                    </motion.button>
                  );
                })}
                <motion.div
                  variants={{
                    open: { x: 0, opacity: 1 },
                    closed: { x: -20, opacity: 0 },
                  }}
                  className="flex gap-3 pt-2"
                >
                  <Link
                    href="/login"
                    className="flex-1 bg-[#823b18] text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" /> Masuk
                  </Link>
                  <Link
                    href="/register"
                    className="flex-1 border border-[#823b18] text-[#823b18] px-4 py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" /> Daftar
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Spacer untuk fixed navbar */}
      <div className="h-[72px]" />

      {/* --- HERO SECTION (id="home") --- */}
      <header
        id="home"
        className="relative overflow-hidden min-h-[90vh] flex items-center"
      >
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(130, 59, 24, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(130, 59, 24, 0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        ></div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center py-20">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="z-10"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-[#c8f17a] text-[#131f00] px-4 py-1.5 rounded-full text-sm font-semibold mb-6 inline-flex items-center gap-2"
            >
              <Award className="w-4 h-4" />
              Freshly Baked Daily
            </motion.span>

            <h1 className="text-5xl md:text-7xl text-[#823b18] leading-tight mb-6 font-serif">
              {renderHeroTitle(heroTitle)}
            </h1>

            <p className="text-lg text-[#54433c] mb-8 max-w-md leading-relaxed">
              {heroSubtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => scrollToSection("daily")}
                className="bg-[#823b18] text-white px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
              >
                Lihat Produk <ArrowRight className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="border border-[#496800] text-[#496800] px-8 py-4 rounded-xl font-semibold hover:bg-[#496800]/5 transition-colors cursor-pointer"
              >
                Tentang Kami
              </motion.button>
            </div>

            {/* Daily Bake - dari mapping product.name */}
            <div className="mt-12 hidden md:block">
              <p className="text-[#496800] text-sm font-semibold uppercase tracking-widest border-b border-[#496800]/20 pb-2 mb-4 w-fit flex items-center gap-2">
                <Coffee className="w-4 h-4" /> Daily Bake
              </p>
              <div className="flex flex-wrap gap-6 opacity-80">
                {dailyProducts.slice(0, 4).map((product) => (
                  <div key={product.id} className="flex items-center gap-2">
                    <CheckCircle className="text-[#823b18] w-4 h-4" />
                    <span className="font-medium text-sm">{product.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden md:block"
          >
            <div className="absolute inset-0 bg-[#ffb596]/20 rounded-full blur-3xl -z-10 transform scale-110" />
            <div className="relative w-full h-[500px] rounded-4xl overflow-hidden shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-700">
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7dL_E3ywIWUHtzJlGxg4RwaizudeOdmrw26WxZ13taWzguIqGa166FD3mGAt6eXHwAbpXq1tLWy7S6UiMPRftr9dum33Pgaf6pKagErIx7gXLiJ9gAe4EtD1vACooFxgu_JL1BvOeZYZi6EXQ9B27Z5k05VT22YuAdoSErIhctLNsGh4CsD3DCBerowUHfbk6g0CLS-Oi9N525jCOmDj8uzgvXrCBv2E2OJvvwIW1m5a5gz2SSInYDK113y5YsA8fdSQsUyDj7sQ"
                alt="Fresh Bread"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="absolute -bottom-6 -left-6 bg-[#fbddc7] p-4 rounded-2xl border border-[#dac1b8]/30 shadow-xl flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-[#c8f17a] flex items-center justify-center text-[#131f00]">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-[#28180b] flex items-center gap-1">
                  <Shield className="w-4 h-4" /> 100% Halal
                </p>
                <p className="text-xs text-[#54433c]">Bahan Alami Pilihan</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </header>

      {/* --- ROTI HARIAN SECTION (id="daily") --- */}
      <section id="daily" className="py-20 bg-[#ffffff]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={containerVariants}
            className="mb-12 text-center"
          >
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 bg-[#ffdbcd] px-4 py-1.5 rounded-full mb-4"
            >
              <Wheat className="w-4 h-4 text-[#823b18]" />
              <span className="text-sm font-semibold text-[#823b18]">
                Menu Favorit
              </span>
            </motion.div>
            <motion.h2
              variants={itemVariants}
              className="text-4xl md:text-5xl text-[#823b18] font-serif"
            >
              Roti Harian
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-[#54433c] mt-2 max-w-xl mx-auto"
            >
              Dibuat segar setiap pagi untuk menjamin kualitas terbaik.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {dailyProducts.map((product) => (
              <motion.div
                key={product.id}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="group bg-[#fff1e9] rounded-2xl p-4 transition-all shadow-sm hover:shadow-xl border border-[#dac1b8]/10 flex flex-col"
              >
                <div className="aspect-square overflow-hidden rounded-xl mb-4 relative">
                  <Image
                    src={product.imageUrl || "/placeholder.png"}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute top-2 left-2 bg-[#c8f17a] text-[#131f00] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" /> Best
                  </div>
                </div>
                <div className="mb-4">
                  <h3 className="font-serif text-xl text-[#28180b]">
                    {product.name}
                  </h3>
                  <p className="text-sm text-[#54433c] mt-1 line-clamp-2 italic">
                    {product.description}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#dac1b8]/10">
                  <div>
                    <p className="text-[#823b18] font-bold text-lg">
                      {formatRupiah(product.price)}
                    </p>
                    <p className="text-[10px] text-[#496800]">
                      Stok: {product.stock}
                    </p>
                  </div>
                  <motion.a
                    href="/login"
                    whileTap={{ scale: 0.9 }}
                    className="bg-[#823b18] text-white p-2 rounded-lg flex items-center gap-2 px-4 font-semibold text-sm hover:bg-[#a0522d] transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Beli
                  </motion.a>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* --- SPESIAL ORDER SECTION (id="special") --- */}
      <section id="special" className="py-20 bg-[#fff8f5]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="mb-12 text-center"
          >
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 bg-[#ffdbcd] px-4 py-1.5 rounded-full mb-4"
            >
              <Star className="w-4 h-4 text-[#823b18]" />
              <span className="text-sm font-semibold text-[#823b18]">
                Pre-order
              </span>
            </motion.div>
            <motion.h2
              variants={itemVariants}
              className="text-4xl md:text-5xl text-[#823b18] font-serif"
            >
              Spesial Order
            </motion.h2>
            <motion.p variants={itemVariants} className="text-[#54433c] mt-2">
              Produk eksklusif yang bisa dipesan terlebih dahulu.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {specialProducts.map((product) => (
              <motion.div
                key={product.id}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="group bg-[#ffeadc] rounded-3xl p-6 transition-all shadow-md hover:shadow-2xl border border-[#823b18]/10 relative overflow-hidden flex flex-col md:flex-row gap-6"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#823b18]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <div className="w-full md:w-1/2 aspect-square md:aspect-auto overflow-hidden rounded-2xl relative h-64">
                  <Image
                    src={product.imageUrl || "/placeholder.png"}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="flex flex-col justify-between w-full md:w-1/2">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <BadgeCheck className="w-5 h-5 text-[#823b18]" />
                      <h3 className="font-serif text-2xl text-[#28180b]">
                        {product.name}
                      </h3>
                    </div>
                    <p className="text-[#54433c] text-sm mb-4 italic">
                      {product.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-4 gap-4">
                    <div>
                      <p className="text-[#823b18] font-bold text-2xl">
                        {formatRupiah(product.price)}
                      </p>
                      <p className="text-[10px] text-[#496800]">
                        Pre-order H-1
                      </p>
                    </div>
                    <motion.a
                      href="/login"
                      whileTap={{ scale: 0.95 }}
                      className="bg-[#823b18] text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg hover:bg-[#a0522d] transition-colors cursor-pointer flex items-center gap-2"
                    >
                      Pesan <ArrowRight className="w-4 h-4" />
                    </motion.a>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* --- INFO & LOCATION SECTION (id="location") --- */}
      <section id="location" className="py-20 bg-[#fff8f5] relative">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "radial-gradient(#823b18 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        ></div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 md:p-12 border border-[#dac1b8]/30 shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="inline-flex items-center gap-2 bg-[#ffdbcd] px-4 py-1.5 rounded-full mb-4">
                  <MapPin className="w-4 h-4 text-[#823b18]" />
                  <span className="text-sm font-semibold text-[#823b18]">
                    Lokasi Kami
                  </span>
                </div>
                <h2 className="text-4xl text-[#823b18] font-serif mb-8">
                  Informasi Toko
                </h2>
                <div className="space-y-6">
                  <div className="flex gap-4 items-start group">
                    <div className="w-12 h-12 rounded-full bg-[#ffdbcd] flex items-center justify-center text-[#823b18] shrink-0 group-hover:scale-110 transition-transform">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#28180b] flex items-center gap-1">
                        <Coffee className="w-4 h-4" /> Jam Operasional
                      </p>
                      <p className="text-[#54433c]">
                        {settings.operational_days || "Senin - Minggu"}:{" "}
                        {settings.operational_hours_start || "08:00"} -{" "}
                        {settings.operational_hours_end || "18:00"} WIB
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start group">
                    <div className="w-12 h-12 rounded-full bg-[#add461] flex items-center justify-center text-[#131f00] shrink-0 group-hover:scale-110 transition-transform">
                      <Truck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#28180b]">
                        Info Pengiriman
                      </p>
                      <p className="text-[#54433c]">
                        Radius {settings.delivery_radius_km || "10"}km. Ongkir
                        Rp {settings.delivery_fee_within_radius || "5000"}{" "}
                        (dalam) / Rp{" "}
                        {settings.delivery_fee_outside_radius || "10000"} (luar
                        radius).
                      </p>
                      <p className="text-xs text-[#496800] mt-1">
                        Minimal pesanan: 10 pcs
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start group">
                    <div className="w-12 h-12 rounded-full bg-[#ffeadc] flex items-center justify-center text-[#823b18] shrink-0 group-hover:scale-110 transition-transform">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#28180b]">Lokasi</p>
                      <p className="text-[#54433c]">
                        {settings.store_address ||
                          "JJ44+73X, Kujangsari, Kec. Langensari, Kota Banjar, Jawa Barat"}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="rounded-2xl overflow-hidden h-96 border border-[#dac1b8]/20 relative shadow-lg"
              >
                <Map />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-[#fff1e9] border-t border-[#dac1b8]/20 py-12 rounded-t-4xl">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#823b18] flex items-center justify-center">
                  <Croissant className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-xl font-bold text-[#823b18] font-serif">
                  {storeName}
                </h4>
              </div>
              <p className="text-[#54433c] text-sm leading-relaxed">
                {storeDesc}
              </p>
            </div>
            <div>
              <h5 className="font-semibold text-[#28180b] mb-4 flex items-center gap-2">
                <Wheat className="w-4 h-4 text-[#823b18]" /> Menu
              </h5>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => scrollToSection("daily")}
                    className="text-[#54433c] hover:text-[#823b18] text-sm transition-all cursor-pointer"
                  >
                    Roti Harian
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("special")}
                    className="text-[#54433c] hover:text-[#823b18] text-sm transition-all cursor-pointer"
                  >
                    Spesial Order
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("location")}
                    className="text-[#54433c] hover:text-[#823b18] text-sm transition-all cursor-pointer"
                  >
                    Lokasi Toko
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-[#28180b] mb-4 flex items-center gap-2">
                <Heart className="w-4 h-4 text-[#823b18]" /> Bantuan
              </h5>
              <ul className="space-y-2">
                <li>
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#54433c] hover:text-[#823b18] text-sm transition-all cursor-pointer flex items-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      className="bi bi-whatsapp text-[#823b18]"
                      viewBox="0 0 16 16"
                    >
                      <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
                    </svg>{" "}
                    WhatsApp Kami
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-[#54433c] hover:text-[#823b18] text-sm transition-all cursor-pointer"
                  >
                    Cara Pemesanan
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-[#28180b] mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-[#823b18]" /> Ikuti Kami
              </h5>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-[#ffeadc] flex items-center justify-center text-[#823b18] hover:bg-[#ffdbcd] hover:scale-110 transition-all cursor-pointer"
                >
                  <Camera className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-[#ffeadc] flex items-center justify-center text-[#823b18] hover:bg-[#ffdbcd] hover:scale-110 transition-all cursor-pointer"
                >
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-[#dac1b8]/10 text-center">
            <p className="text-[#54433c] text-sm">
              © {new Date().getFullYear()} {storeName}. Dibuat dengan{" "}
              <Heart className="w-3 h-3 inline text-[#ba1a1a]" /> untuk keluarga
              Anda.
            </p>
          </div>
        </div>
      </footer>

      {/* --- FLOATING WHATSAPP BUTTON --- */}
      <motion.a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring" }}
        className=" fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 flex items-center gap-2 group cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="26"
          height="26"
          fill="currentColor"
          className="bi bi-whatsapp"
          viewBox="0 0 16 16"
        >
          <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
        </svg>
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 font-semibold text-sm">
          Tanya Kami di WA
        </span>
      </motion.a>
    </main>
  );
}
