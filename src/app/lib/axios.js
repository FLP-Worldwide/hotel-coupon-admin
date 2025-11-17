// lib/axios.js
import axios from "axios";
import { getSession, signOut } from "next-auth/react";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  timeout: 15000,
});

// ---- Attach access token
api.interceptors.request.use(async (config) => {
  try {
    const session = await getSession();
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
  } catch (err) {
    console.warn("Failed to load session for axios:", err);
  }
  return config;
});

console.log("API Base URL:", process.env.NEXT_PUBLIC_API_URL);


export default api;