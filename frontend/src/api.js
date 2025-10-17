import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

export const dashboard = {
  getStats: () => api.get('/dashboard'),
};

export const nsoTrunks = {
  getAll: () => api.get('/nso-trunks'),
  create: (data) => api.post('/nso-trunks', data),
  update: (id, data) => api.put(`/nso-trunks/${id}`, data),
  delete: (id) => api.delete(`/nso-trunks/${id}`),
};

export const vnoTrunks = {
  getAll: () => api.get('/vno-trunks'),
  create: (data) => api.post('/vno-trunks', data),
  update: (id, data) => api.put(`/vno-trunks/${id}`, data),
  delete: (id) => api.delete(`/vno-trunks/${id}`),
};

export const customers = {
  getAll: () => api.get('/customers'),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

export const trunkMappings = {
  getAll: () => api.get('/trunk-mappings'),
  create: (data) => api.post('/trunk-mappings', data),
  update: (id, data) => api.put(`/trunk-mappings/${id}`, data),
  delete: (id) => api.delete(`/trunk-mappings/${id}`),
};

export const dids = {
  getAll: () => api.get('/dids'),
  create: (data) => api.post('/dids', data),
  update: (id, data) => api.put(`/dids/${id}`, data),
  delete: (id) => api.delete(`/dids/${id}`),
};

export default api;
