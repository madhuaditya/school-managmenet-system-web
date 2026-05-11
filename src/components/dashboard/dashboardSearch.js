import apiClient from '../../services/apiClient';

export const normalizeSearchText = (value) => String(value ?? '').trim().toLowerCase();

export const matchesSearchText = (query, values = []) => {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return true;
  }

  return values.some((value) => normalizeSearchText(value).includes(normalizedQuery));
};

export const searchSchoolUsers = async (query, limit = 8) => {
  const normalizedQuery = normalizeSearchText(query);

  if (normalizedQuery.length < 3) {
    return [];
  }

  const response = await apiClient.get('/api/profile/search/users', {
    params: {
      q: normalizedQuery,
      limit,
    },
  });

  return Array.isArray(response?.data?.data) ? response.data.data : [];
};