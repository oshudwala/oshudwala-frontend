import apiClient from './api';
import { pharmaciesData } from '../data/pharmaciesData';

export const pharmacyService = {
  async getPharmacies() {
    try {
      const response = await apiClient.get('/pharmacies');
      return response.data;
    } catch {
      return { pharmacies: pharmaciesData, isMock: true };
    }
  },

  async getPharmacyById(id) {
    try {
      const response = await apiClient.get(`/pharmacies/${id}`);
      return response.data;
    } catch {
      const pharm = pharmaciesData.find(p => p.id === id) || pharmaciesData[0];
      return { pharmacy: pharm, isMock: true };
    }
  }
};
