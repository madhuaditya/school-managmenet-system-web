import apiClient from './apiClient';

export const loginUserApi = async (payload) => {
  const response = await apiClient.post('/api/auth/login', payload);
  return response.data;
};

export const loginSchoolApi = async (payload) => {
  const response = await apiClient.post('/api/auth/school/login', payload);
  return response.data;
};

export const forgotPasswordApi = async (payload) => {
  const response = await apiClient.post('/api/auth/forgot-password', payload);
  return response.data;
};

export const forgotSchoolPasswordApi = async (email) => {
  const response = await apiClient.post('/api/auth/school/forgot-password', { email });
  return response.data;
};

export const logoutUserApi = async (refreshToken) => {
  const response = await apiClient.post('/api/auth/logout', { refreshToken });
  return response.data;
};

export const logoutSchoolApi = async (token) => {
  const response = await apiClient.post('/api/auth/school/logout', { token });
  return response.data;
};

export const resetPasswordApi = async (token, password) => {
  const response = await apiClient.post('/api/auth/reset-password', { token, password });
  return response.data;
};

export const resetPasswordSchoolApi = async (token, password) => {
  const response = await apiClient.post('/api/auth/school/reset-password', { token, password });
  return response.data;
};
