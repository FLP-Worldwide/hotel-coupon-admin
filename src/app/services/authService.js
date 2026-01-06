import api from "../lib/axios";
export const authService = {
  signup(payload) {
    // payload: { name, email, password }
    return api.post("/admin/register", payload);
  },
  login(payload) {
    return api.post("/admin/login", payload);
  },
  refresh(payload) {
    return api.post("/auth/refresh", payload);
  },
};
