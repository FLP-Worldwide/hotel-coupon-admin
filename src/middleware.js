// middleware.js (place at project root)
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const ADMIN_PREFIX = "/admin"; // adjust if needed
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Only protect /admin/*
  if (!pathname.startsWith(ADMIN_PREFIX)) return NextResponse.next();

  try {
    // read token from NextAuth cookie (JWT strategy)
    const token = await getToken({ req, secret: NEXTAUTH_SECRET });

    // Not signed in — redirect to login
    if (!token) {
      const loginUrl = new URL("/", req.url);
      loginUrl.searchParams.set("next", pathname);

      const res = NextResponse.redirect(loginUrl);
      // clear common NextAuth cookies (adjust names if you customized)
      res.cookies.delete("next-auth.session-token");
      res.cookies.delete("__Secure-next-auth.session-token");
      res.cookies.delete("next-auth.csrf-token");
      return res;
    }

    // If access token expiry available and expired -> force re-login
    const now = Date.now();
    if (token.accessTokenExpires && now >= token.accessTokenExpires) {
      const loginUrl = new URL("/", req.url);
      loginUrl.searchParams.set("next", pathname);

      const res = NextResponse.redirect(loginUrl);
      // clear cookies to avoid stale session reuse
      res.cookies.delete("next-auth.session-token");
      res.cookies.delete("__Secure-next-auth.session-token");
      res.cookies.delete("next-auth.csrf-token");
      return res;
    }

    // Role check
    const role = token.role || token?.user?.role || null;
    // if (role !== "admin") {
    //   const unauthorizedUrl = new URL("/unauthorized", req.url);
    //   return NextResponse.redirect(unauthorizedUrl);
    // }

    // allowed roles
    const allowedRoles = ["admin", "agent", "hotel"];

    if (!allowedRoles.includes(role)) {
      const unauthorizedUrl = new URL("/unauthorized", req.url);
      return NextResponse.redirect(unauthorizedUrl);
    }

    // allowed
    return NextResponse.next();
  } catch (err) {
    console.warn("Middleware auth error", err);
    const loginUrl = new URL("/", req.url);
    loginUrl.searchParams.set("next", pathname);

    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete("next-auth.session-token");
    res.cookies.delete("__Secure-next-auth.session-token");
    res.cookies.delete("next-auth.csrf-token");
    return res;
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
