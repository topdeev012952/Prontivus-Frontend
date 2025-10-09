import { create } from 'zustand';
import { apiClient } from '@/lib/api';

interface Clinic {
  id: string;
  name: string;
  logo?: string;
  primaryColor?: string;
}

interface ClinicStore {
  clinics: Clinic[];
  currentClinic: Clinic | null;
  selectedClinic: Clinic | null;
  isLoading: boolean;
  fetchClinics: () => Promise<void>;
  setCurrentClinic: (clinic: Clinic) => void;
}

export const useClinicStore = create<ClinicStore>((set, get) => ({
  clinics: [],
  currentClinic: null,
  selectedClinic: null,
  isLoading: false,

  fetchClinics: async () => {
    // Only fetch clinics if user is authenticated
    const token = localStorage.getItem('access_token');
    if (!token) {
      set({ isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const clinics = await apiClient.request<Clinic[]>('/clinics/');
      const savedClinicId = localStorage.getItem('current_clinic_id');
      const currentClinic = savedClinicId
        ? clinics.find(c => c.id === savedClinicId) || clinics[0]
        : clinics[0];
      
      set({ clinics, currentClinic, selectedClinic: currentClinic, isLoading: false });
    } catch (error) {
      // Fail silently if not authenticated or endpoint not available
      console.debug('Clinics not loaded:', error);
      set({ isLoading: false });
    }
  },

  setCurrentClinic: (clinic: Clinic) => {
    set({ currentClinic: clinic, selectedClinic: clinic });
    localStorage.setItem('current_clinic_id', clinic.id);
    // Trigger data reload
    window.dispatchEvent(new CustomEvent('clinic-changed'));
  },
}));
