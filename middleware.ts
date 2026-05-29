// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Proteksi route admin
    if (path.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Customer routes - TAMBAHKAN "/customer/complete-profile" di sini? TIDAK!
    // Karena complete-profile harus bisa diakses meskipun isProfileComplete false
    const customerRoutes = ["/customer", "/cart", "/checkout", "/orders", "/profile"];
    
    // Cek jika profile belum lengkap - PRIORITASKAN INI DULU
    if (path === "/customer/complete-profile") {
      // Jika sudah lengkap, redirect ke customer
      if (token?.isProfileComplete === true) {
        return NextResponse.redirect(new URL("/customer", req.url));
      }
      return NextResponse.next();
    }

    // Proteksi route customer (untuk route selain complete-profile)
    if (customerRoutes.some(route => path.startsWith(route)) && !token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Redirect ke complete profile jika profile belum lengkap DAN mencoba akses route customer lain
    // PERBAIKAN: Jangan redirect jika path sudah /customer/complete-profile
    if (token && token.isProfileComplete === false && path !== "/customer/complete-profile" && customerRoutes.some(route => path.startsWith(route))) {
      return NextResponse.redirect(new URL("/customer/complete-profile", req.url));
    }

    // Redirect ke halaman sesuai role jika sudah login dan buka root
    if (path === "/" && token) {
      if (token?.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.redirect(new URL("/customer", req.url));
    }

    // Redirect ke dashboard sesuai role jika sudah login dan buka login/register
    if ((path === "/login" || path === "/register") && token) {
      if (token?.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.redirect(new URL("/customer", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        
        // Public routes
        const publicRoutes = ["/", "/login", "/register", "/products", "/api/products", "/api/settings"];
        if (publicRoutes.some(route => path === route || path.startsWith(route))) {
          return true;
        }
        
        // Complete profile route - boleh diakses dengan token
        if (path === "/customer/complete-profile") {
          return !!token;
        }
        
        // Protected routes
        const protectedRoutes = ["/admin", "/customer", "/cart", "/checkout", "/orders", "/profile"];
        if (protectedRoutes.some(route => path.startsWith(route))) {
          return !!token;
        }
        
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/customer/:path*",
    "/cart/:path*",
    "/checkout",
    "/orders/:path*",
    "/profile/:path*",
    "/login",
    "/register",
  ],
};