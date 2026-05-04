import { create } from 'zustand';
import { api } from '../utils/api';

export const useAuthStore = create((set, get) => ({
    user: null,           // { id, username, display_name }
    accessToken: null,
    isAuthenticated: false,
    loading: true,

    setAccessToken: (token) => {
        set({ accessToken: token, isAuthenticated: !!token });
    },

    fetchUser: async () => {
        try {
            const res = await api.get('auth/me/');
            set({ user: res.data });
        } catch {
            set({ user: null });
        }
    },

    /** Optimistically update display_name in-store after a successful PATCH */
    setDisplayName: (display_name) => {
        set((state) => ({
            user: state.user ? { ...state.user, display_name } : state.user,
        }));
    },

    /** Persist a fresh access token after password change without full logout */
    setAccessTokenKeepUser: (token) => {
        set({ accessToken: token, isAuthenticated: true });
    },

    login: async (username, password) => {
        try {
            const res = await api.post('auth/login/', { username, password });
            set({ accessToken: res.data.access, isAuthenticated: true });
            await get().fetchUser();
            return true;
        } catch {
            return false;
        }
    },

    logout: async () => {
        try { await api.post('auth/logout/'); } catch { }
        set({ user: null, accessToken: null, isAuthenticated: false });
    },

    refresh: async () => {
        try {
            const res = await api.post('auth/refresh/');
            set({ accessToken: res.data.access, isAuthenticated: true });
            await get().fetchUser();
        } catch {
            set({ user: null, accessToken: null, isAuthenticated: false });
        } finally {
            set({ loading: false });
        }
    },
}));