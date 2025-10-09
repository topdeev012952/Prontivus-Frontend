import { create } from 'zustand';
import { apiClient } from '@/lib/api';
import { useClinicStore } from '@/stores/clinicStore';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  clinic_id: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    try {
      await apiClient.login(email, password);
      const user = await apiClient.request<User>('/users/me');
      set({ user, isAuthenticated: true });
      // Fetch clinics after successful login
      await useClinicStore.getState().fetchClinics();
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    apiClient.logout();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      const user = await apiClient.request<User>('/users/me');
      set({ user, isAuthenticated: true, isLoading: false });
      // Fetch clinics after successful auth check
      await useClinicStore.getState().fetchClinics();
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
