import CredentialsProvider from "next-auth/providers/credentials";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const LOGIN_PATH = process.env.AUTH_LOGIN_PATH || "/";

// constants
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

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
          const userObj = data?.admin || data?.user || data;

          if (!accessToken) return null;

          // compute expiry from JWT if possible (optional)
          let accessTokenExpires = null;
          try {
            const parts = accessToken.split(".");
            if (parts.length === 3) {
              const decoded = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
              if (decoded?.exp) accessTokenExpires = decoded.exp * 1000;
            }
          } catch (e) {
            // ignore and set fallback below
          }

          // If we couldn't read expiry from token, default to 30 days from now
          if (!accessTokenExpires) {
            accessTokenExpires = Date.now() + THIRTY_DAYS_MS;
          }

          return {
            id: userObj?.id,
            name: userObj?.name,
            email: userObj?.email,
            role: userObj?.role,
            accessToken,
            accessTokenExpires,
          };
        } catch (e) {
          if (process.env.NODE_ENV === "development") {
            console.error("Authorize error:", e);
          }
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;

        token.accessToken = user.accessToken;
        token.accessTokenExpires = user.accessTokenExpires;
        return token;
      }

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
      session.accessTokenExpires = token.accessTokenExpires ?? (Date.now() + THIRTY_DAYS_MS);
      session.error = token.error ?? null;
      return session;
    },
  },

  pages: {
    signIn: "/",
  },
};