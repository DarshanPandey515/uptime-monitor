import axios from 'axios';
import { useAuthStore } from "./authStore";

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/';



export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});


// -------------------- Attach Access Token Automatically -----------------------


api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// -------------------- Attach Access Token Automatically -----------------------





// -------------------- Auto Refresh when 401 -----------------------


api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('auth/refresh')) {

      originalRequest._retry = true;

      try {
        const res = await api.post('auth/refresh/');
        useAuthStore.getState().setAccessToken(res.data.access)
        originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
        return api(originalRequest);
      } catch (err) {
        useAuthStore.getState().logout();
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);




// -------------------- Auto Refresh when 401 -----------------------