// src/api/axios.ts
import axios, { type InternalAxiosRequestConfig } from 'axios';

export const instance = axios.create({
  baseURL: 'http://localhost:1000/api',
  headers: { 'Content-Type': 'application/json' },
});

type AttachOpts = {
  onLogout?: () => void;                       // optional: cho phép FE dispatch logout
};

// Chỉ gọi MỘT lần trong main.tsx
export function attachInterceptors(opts: AttachOpts = {}) {
  // --- REQUEST: luôn lấy token từ localStorage để tránh lệch Redux sau refresh ---
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem('accessToken');
      if (!config.headers) config.headers = axios.defaults.headers.common as typeof config.headers;
      if (token) {
        (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // --- RESPONSE: auto refresh khi 401 ---
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      if (!error.response || error.response.status !== 401) {
        return Promise.reject(error);
      }

      if (originalRequest._retry) {
        // đã retry rồi mà vẫn 401 ⇒ thoát
        opts.onLogout?.();
        return Promise.reject(error);
      }
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          opts.onLogout?.();
          return Promise.reject(error);
        }

        // Dùng axios RAW để tránh interceptor của instance
        const res = await axios.post<{ accessToken: string }>(
          'http://localhost:1000/api/auth/refresh',
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const newAccessToken = res.data.accessToken;
        // Cập nhật localStorage (request interceptor đọc từ đây)
        localStorage.setItem('accessToken', newAccessToken);

        // Gắn token mới vào request cũ rồi gọi lại qua instance
        if (!originalRequest.headers) originalRequest.headers = new axios.AxiosHeaders();
        (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${newAccessToken}`;

        return instance(originalRequest);
      } catch (err) {
        // refresh fail → đăng xuất
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        opts.onLogout?.();
        return Promise.reject(err);
      }
    }
  );
}

export default instance;
