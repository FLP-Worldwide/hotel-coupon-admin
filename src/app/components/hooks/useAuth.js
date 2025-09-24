"use client";

import { useState, useEffect } from "react";
import { authService } from "@/app/services/authService";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import toast from "react-hot-toast";

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const user = session?.user || null;

  // 🚀 Already logged-in user visiting /login → redirect
  useEffect(() => {
    if (status === "authenticated" && pathname === "/") {
      if (user?.role === "admin" || user?.role === "super_admin") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/admin/dashboard");
      }
    }
  }, [status, pathname, user, router]);

  async function login({ email, password }) {
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        toast.error("Invalid email or password");
        return;
      }

      toast.success("Welcome back!");

      // fetch fresh session for role
      const sessionRes = await fetch("/api/auth/session");
      const current = await sessionRes.json();

      if (current?.user?.role === "admin" || current?.user?.role === "super_admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/");
      }
    } catch (err) {
      toast.error(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function signup({ name, email, password }) {
    setLoading(true);
    try {
      await authService.signup({ name, email, password });
      toast.success("Account created. Please log in.");
      router.push("/");
    } catch (err) {
      toast.error(err?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await signOut({ callbackUrl: "/" });
    toast.success("Logged out successfully");
  }

  return {
    login,
    signup,
    logout,
    user,
    loading,
    isAuthenticated: status === "authenticated",
  };
}
