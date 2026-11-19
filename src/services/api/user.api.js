import apiClient, { tokenStorage } from './client';

export const userApi = {
  /**
   * Get current user's profile
   * GET /api/v1/users/profile
   */
  async getProfile() {
    const response = await apiClient.get('/users/profile');
    const profile = response.data?.data || response.data;
    // Keep local session user in sync
    if (profile) {
      const currentUser = tokenStorage.getUser() || {};
      tokenStorage.setSession({
        user: {
          ...currentUser,
          id: profile.id,
          fullName: profile.fullName,
          phone: profile.phone,
          email: profile.email,
          role: profile.role?.name || profile.role || currentUser.role,
          bloodGroup: profile.patientProfile?.bloodGroup,
          allergies: profile.patientProfile?.allergies,
          medicalNotes: profile.patientProfile?.medicalNotes,
          patientProfile: profile.patientProfile,
        },
      });
    }
    return profile;
  },

  /**
   * Update current user's profile
   * PUT /api/v1/users/profile
   */
  async updateProfile(profileData) {
    const response = await apiClient.put('/users/profile', profileData);
    const updated = response.data?.data || response.data;
    if (updated) {
      const currentUser = tokenStorage.getUser() || {};
      tokenStorage.setSession({
        user: {
          ...currentUser,
          fullName: updated.fullName ?? currentUser.fullName,
          email: updated.email ?? currentUser.email,
          bloodGroup: updated.patientProfile?.bloodGroup ?? currentUser.bloodGroup,
          allergies: updated.patientProfile?.allergies ?? currentUser.allergies,
          medicalNotes: updated.patientProfile?.medicalNotes ?? currentUser.medicalNotes,
          patientProfile: updated.patientProfile ?? currentUser.patientProfile,
        },
      });
    }
    return updated;
  },

  /**
   * Get user's active saved addresses
   * GET /api/v1/users/addresses
   */
  async getAddresses() {
    const response = await apiClient.get('/users/addresses');
    return response.data?.data || response.data || [];
  },

  /**
   * Add a new saved address
   * POST /api/v1/users/addresses
   */
  async addAddress(addressData) {
    const response = await apiClient.post('/users/addresses', addressData);
    return response.data?.data || response.data;
  },

  /**
   * Update an existing address
   * PUT /api/v1/users/addresses/:id
   */
  async updateAddress(id, addressData) {
    const response = await apiClient.put(`/users/addresses/${id}`, addressData);
    return response.data?.data || response.data;
  },

  /**
   * Delete an existing address (soft delete)
   * DELETE /api/v1/users/addresses/:id
   */
  async deleteAddress(id) {
    const response = await apiClient.delete(`/users/addresses/${id}`);
    return response.data?.data || response.data;
  },
};

export default userApi;
