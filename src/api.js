import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "https://nkg-catalog-backend-1.onrender.com/api",
});

api.interceptors.request.use((config) => {
  const adminUnlocked =
    localStorage.getItem("nkg_admin_unlocked") === "yes";

  if (adminUnlocked) {
    config.headers["X-Admin-Key"] =
      import.meta.env.VITE_ADMIN_API_KEY;
  }

  return config;
});

export default api;