import CredentialsProvider from "next-auth/providers/credentials";
import { refreshAccessToken } from "./token"; // updated helper above

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const LOGIN_PATH = process.env.AUTH_LOGIN_PATH || "/auth/login";

export const authOptions = {
  debug: process.env.NODE_ENV === "development",
  session: { strategy: "jwt" },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null;

          const res = await fetch(`${API_BASE}${LOGIN_PATH}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // This endpoint should set HttpOnly refresh cookie
            credentials: "include",
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) {
            if (process.env.NODE_ENV === "development") {
              console.error("Login failed:", res.status, await res.text());
            }
            return null;
          }

          const payload = await res.json();
          const data = payload?.data ?? payload;

          const accessToken = data?.accessToken;
          // we DO NOT expect refreshToken in body because it's set as HttpOnly cookie
          const userObj = data?.admin || data?.user || data;

          if (!accessToken) return null;

          // compute expiry from JWT if possible
          let accessTokenExpires = null;
          try {
            const parts = accessToken.split(".");
            if (parts.length === 3) {
              const decoded = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
              if (decoded?.exp) accessTokenExpires = decoded.exp * 1000;
            }
          } catch (e) {
            accessTokenExpires = Date.now() + 10 * 60 * 1000;
          }

          return {
            id: userObj?.id,
            name: userObj?.name,
            email: userObj?.email,
            role: userObj?.role,
            accessToken,
            // refreshToken not available to JS (HttpOnly cookie) — keep null
            refreshToken: null,
            accessTokenExpires,
          };
        } catch (e) {
          if (process.env.NODE_ENV === "development") {
            console.error("Authorize error:", e);
          }
          return null;
        }
      }
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // initial sign in
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;

        token.accessToken = user.accessToken;
        token.accessTokenExpires = user.accessTokenExpires;
        // refreshToken is cookie-based; keep token.refreshToken as null
        token.refreshToken = null;
        return token;
      }

      // manual update (if used)
      if (trigger === "update" && session?.accessToken) {
        token.accessToken = session.accessToken;
        token.accessTokenExpires = session.accessTokenExpires ?? token.accessTokenExpires;
        return token;
      }

      // return early if token still valid (allow small clock skew)
      const shouldRefresh = Date.now() >= (token.accessTokenExpires || 0) - 15_000;
      if (!shouldRefresh) return token;

      // attempt refresh via helper which sends cookie
      const refreshed = await refreshAccessToken();

      if (refreshed?.error || !refreshed?.accessToken) {
        token.error = "RefreshAccessTokenError";
        return token;
      }

      token.accessToken = refreshed.accessToken;
      token.accessTokenExpires = refreshed.accessTokenExpires;
      // refreshToken remains cookie-based; nothing to set in token
      return token;
    },

    async session({ session, token }) {
      session.user = {
        id: token.id,
        name: token.name,
        email: token.email,
        role: token.role,
      };
      session.accessToken = token.accessToken ?? null;
      session.accessTokenExpires = token.accessTokenExpires ?? null;
      session.error = token.error ?? null;
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
};
