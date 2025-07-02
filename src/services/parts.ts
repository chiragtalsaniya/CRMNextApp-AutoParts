import api from './api';

export async function fetchParts(search: string = '') {
  const response = await api.get('/parts', { params: { search } });
  return response.data.parts || [];
}
