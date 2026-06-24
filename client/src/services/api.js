import axios from 'axios';

let baseApiUrl = import.meta.env.VITE_API_URL || '/api';
if (baseApiUrl.endsWith('/')) baseApiUrl = baseApiUrl.slice(0, -1);
if (baseApiUrl.startsWith('http') && !baseApiUrl.endsWith('/api')) {
  baseApiUrl += '/api';
}

const api = axios.create({
  baseURL: baseApiUrl,
  withCredentials: true
});

let isRefreshing = false;
let failedQueue = [];
let logoutCallback = null;

export const setLogoutHandler = (callback) => {
  logoutCallback = callback;
};

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach access token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Expiration and Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error status is 401 and code is TOKEN_EXPIRED
    if (
      error.response &&
      error.response.status === 401 &&
      error.response.data.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh endpoint on server (cookie sent automatically)
        const refreshUrl = `${baseApiUrl}/auth/refresh`;
        const response = await axios.post(refreshUrl, {}, { withCredentials: true });
        const { token } = response.data;
        
        localStorage.setItem('token', token);
        isRefreshing = false;
        processQueue(null, token);

        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);
        
        // If refresh fails, clear auth & trigger logout callback
        localStorage.removeItem('token');
        if (logoutCallback) {
          logoutCallback();
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth Endpoints
export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const registerUser = async (name, email, password) => {
  const response = await api.post('/auth/register', { name, email, password });
  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post('/auth/logout');
  if (logoutCallback) logoutCallback();
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Task Endpoints
export const getTasks = async (params = {}) => {
  const response = await api.get('/tasks', { params });
  return response.data;
};

export const createTask = async (taskData) => {
  const response = await api.post('/tasks', taskData);
  return response.data;
};

export const updateTask = async (id, taskData) => {
  const response = await api.put(`/tasks/${id}`, taskData);
  return response.data;
};

export const deleteTask = async (id) => {
  const response = await api.delete(`/tasks/${id}`);
  return response.data;
};

export default api;
