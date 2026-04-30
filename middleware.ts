import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const path = req.nextUrl.pathname;
    const role = req.nextauth.token?.role;
    if (path.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        if (path.startsWith("/admin")) return !!token;
        if (path.startsWith("/profile") || path.startsWith("/checkout") || path.startsWith("/cart")) return !!token;
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/profile/:path*", "/checkout/:path*", "/cart"],
};
