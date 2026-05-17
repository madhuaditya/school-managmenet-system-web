import apiClient from '../apiClient';

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    searchParams.set(key, value);
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

const calendarService = {
  getEvents: async (params = {}) => {
    const response = await apiClient.get(`/api/calendar${buildQueryString(params)}`);
    return response.data;
  },

  getEvent: async (id) => {
    const response = await apiClient.get(`/api/calendar/${id}`);
    return response.data;
  },

  createEvent: async (data) => {
    const response = await apiClient.post('/api/calendar', data);
    return response.data;
  },

  updateEvent: async (id, data) => {
    const response = await apiClient.put(`/api/calendar/${id}`, data);
    return response.data;
  },

  deleteEvent: async (id) => {
    const response = await apiClient.delete(`/api/calendar/${id}`);
    return response.data;
  },

  cleanupExpiredEvents: async () => {
    const response = await apiClient.post('/api/calendar/cleanup/expired');
    return response.data;
  },
};

export default calendarService;