import apiClient from './apiClient';

export const submitContact = async (payload) => {
  const response = await apiClient.post('/api/feedback/public/contact', payload);
  return response.data;
};

export const submitFeedback = async (payload) => {
  const response = await apiClient.post('/api/feedback/public/review', payload);
  return response.data;
};
