import api from './api';

export async function fetchRetailers(search: string = '') {
  const response = await api.get('/retailers', { params: { search } });
  return response.data.retailers || [];
}
