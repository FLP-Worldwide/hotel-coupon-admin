// middleware.js (place at project root)
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const ADMIN_PREFIX = '/admin'; // adjust to the prefix you want to protect
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET; // required
export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Only protect paths under ADMIN_PREFIX
  if (!pathname.startsWith(ADMIN_PREFIX)) return NextResponse.next();

  try {
    // getToken reads NextAuth cookies and verifies the token using NEXTAUTH_SECRET
    // It works in middleware (Edge). It returns the decoded token payload or null.
    const token = await getToken({ req, secret: NEXTAUTH_SECRET });


    // Not signed in -> redirect to login with return url
    if (!token) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // token exists. Check role (assumes you put `role` into token/session via callbacks)
    // E.g. token.role === 'admin'
    const role = token.role || token?.user?.role || null;

    if (role !== 'admin') {
      // Signed in but not admin
      const unauthorizedUrl = new URL('/unauthorized', req.url); // or /403
      return NextResponse.redirect(unauthorizedUrl);
    }

    // allowed
    return NextResponse.next();
  } catch (err) {
    console.warn('Middleware auth error', err);
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ['/admin/:path*'], // protect /admin and all subroutes
};
