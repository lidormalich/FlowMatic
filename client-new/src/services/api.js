import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

// Add token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('jwtToken');
  if (token) {
    config.headers.Authorization = token;
  }

  // Debug logging
  if (config.url.includes('register')) {
    console.log('📤 Sending registration request:', {
      url: config.url,
      method: config.method,
      data: config.data
    });
  }

  return config;
});

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    if (response.config.url.includes('register')) {
      console.log('✅ Registration response:', response.data);
    }
    return response;
  },
  error => {
    if (error.config?.url?.includes('register')) {
      console.error('❌ Registration error response:', {
        status: error.response?.status,
        data: error.response?.data
      });
    }

    // Handle 401 Unauthorized globally
    if (error.response?.status === 401) {
      console.log('❌ 401 Unauthorized - logging out');
      localStorage.removeItem('jwtToken');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export const appointmentsApi = {
  getAll: async () => {
    const response = await api.get('/appointments');
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/appointments/stats');
    return response.data;
  },
  getAvailable: async (username, date, duration) => {
    const response = await api.get(`/appointments/available/${username}`, { params: { date, duration } });
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/appointments', data);
    return response.data;
  },
  createPublic: async (username, data) => {
    const response = await api.post(`/appointments/public/${username}`, data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/appointments/${id}`, data);
    return response.data;
  },
  cancel: async (id) => {
    const response = await api.delete(`/appointments/${id}`);
    return response.data;
  },
  createRecurring: async (data) => {
    const response = await api.post('/appointments/recurring', data);
    return response.data;
  },
  cancelRecurring: async (groupId) => {
    const response = await api.delete(`/appointments/recurring/${groupId}`);
    return response.data;
  }
};

export const appointmentTypesApi = {
  getAll: async () => {
    const response = await api.get('/appointment-types');
    return response.data;
  },
  getByUsername: async (username) => {
    const response = await api.get(`/appointment-types/user/${username}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/appointment-types', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/appointment-types/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/appointment-types/${id}`);
    return response.data;
  }
};

export const reportsApi = {
  getRevenue: (params) => api.get('/reports/revenue', { params }),
  getHeatmap: (params) => api.get('/reports/heatmap', { params }),
  exportAppointments: () => api.get('/reports/export/appointments', { responseType: 'blob' }),
  exportClients: () => api.get('/reports/export/clients', { responseType: 'blob' }),
};

export const businessApi = {
  getPublicProfile: (username) => api.get(`/users/public/${username}`),
};

export const clientsApi = {
  getAll: async () => {
    const response = await api.get('/clients');
    return response.data;
  },
  search: async (query) => {
    const response = await api.get(`/clients?search=${query}`);
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/clients/${id}`, data);
    return response.data;
  }
};

export const staffApi = {
  getAll: async () => {
    const response = await api.get('/staff');
    return response.data;
  },
  getByService: async (serviceId) => {
    const response = await api.get(`/staff/by-service/${serviceId}`);
    return response.data;
  },
  getPublic: async (username) => {
    const response = await api.get(`/staff/public/${username}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/staff', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/staff/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/staff/${id}`);
    return response.data;
  }
};

export const inventoryApi = {
  getAll: async () => {
    const response = await api.get('/inventory');
    return response.data;
  },
  getLowStock: async () => {
    const response = await api.get('/inventory/low-stock');
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/inventory', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/inventory/${id}`, data);
    return response.data;
  },
  adjust: async (id, amount) => {
    const response = await api.put(`/inventory/${id}/adjust`, { amount });
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/inventory/${id}`);
    return response.data;
  }
};

export const waitlistApi = {
  getAll: async () => {
    const response = await api.get('/waitlist');
    return response.data;
  },
  joinPublic: async (username, data) => {
    const response = await api.post(`/waitlist/public/${username}`, data);
    return response.data;
  },
  updateStatus: async (id, status) => {
    const response = await api.put(`/waitlist/${id}`, { status });
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/waitlist/${id}`);
    return response.data;
  }
};

export const templatesApi = {
  getAll: async () => {
    const response = await api.get('/templates');
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/templates/${id}`, data);
    return response.data;
  }
};

export const usersApi = {
  // Public endpoints
  getProfile: async (username) => {
    const response = await api.get(`/users/public/${username}`);
    return response.data;
  },
  checkUsername: async (username) => {
    const response = await api.get(`/users/check-username/${username}`);
    return response.data;
  },

  // Admin endpoints (require authentication)
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  search: async (query) => {
    const response = await api.get(`/users?search=${query}`);
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/users/register', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
  suspend: async (id, suspend) => {
    const response = await api.post(`/users/${id}/suspend`, { suspend });
    return response.data;
  },
  updateCredits: async (id, amount) => {
    const response = await api.post(`/users/${id}/credits`, { amount });
    return response.data;
  },
  uploadImage: async (formData) => {
    const response = await api.post('/users/upload-profile-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};

export const authApi = {
  login: async (data) => {
    const response = await api.post('/users/login', data);
    return response.data;
  },
  register: async (data) => {
    const response = await api.post('/users/register', data);
    return response.data;
  },
  forgotPassword: async (data) => {
    const response = await api.post('/auth/forgot-password', data);
    return response.data;
  },
  resetPassword: async (data) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },
  verifyResetToken: async (token) => {
    const response = await api.get(`/auth/verify-reset-token/${token}`);
    return response.data;
  }
};

export default api;
