import axios from "axios";

// const BASE_URL = "https://customized-api.adharbattulwar24.workers.dev";
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default api;
