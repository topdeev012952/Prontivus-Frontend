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
      // Set loading state
      set({ isLoading: true });
      
      // Perform login and store token
      await apiClient.login(email, password);
      
      // Wait a moment to ensure token is stored
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get user info with the stored token
      const user = await apiClient.request<User>('/users/me');
      
      // Update auth state
      set({ user, isAuthenticated: true, isLoading: false });
      
      // Fetch clinics after successful login
      await useClinicStore.getState().fetchClinics();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    apiClient.logout();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      // Check if token exists in localStorage
      const token = localStorage.getItem('access_token');
      if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      
      // Try to get user info with the token
      const user = await apiClient.request<User>('/users/me');
      set({ user, isAuthenticated: true, isLoading: false });
      
      // Fetch clinics after successful auth check
      await useClinicStore.getState().fetchClinics();
    } catch (error) {
      // Token is invalid or expired, clear it
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
