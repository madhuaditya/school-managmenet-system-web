import apiClient from '../apiClient';

export const profileService = {
  getBasicProfile: async (id) => {
    const response = await apiClient.get(`/api/profile/${id}`);
    return response.data;
  },
};

export default profileService;