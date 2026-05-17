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

    // Redirect ke admin jika sudah login dan buka login/register
    if ((path === "/login" || path === "/register") && token) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        // Allow public routes
        if (path === "/login" || path === "/register" || path === "/") return true;
        // Protected routes need token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/orders/:path*",
    "/profile/:path*",
    "/checkout",
    "/login",
    "/register",
  ],
};