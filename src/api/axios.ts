// src/api/axios.ts
import axios, { type InternalAxiosRequestConfig } from 'axios';

export const instance = axios.create({
  baseURL: 'http://localhost:1000/api',
  headers: { 'Content-Type': 'application/json' },
  // Không set withCredentials: true ở đây vì backend chưa config CORS cho credentials
  // App đang dùng Bearer token trong Authorization header, không cần cookies
  // Chỉ thêm withCredentials cho các request cụ thể nếu backend yêu cầu
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
      if (!config.headers) {
        config.headers = {} as typeof config.headers;
      }
      // Luôn set Authorization header nếu có token
      if (token) {
        (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
        // Log để debug (chỉ log một vài request quan trọng)
        if (config.url?.includes('/reservations') && config.method === 'post') {
          console.log('🔑 Request with token:', {
            url: config.url,
            method: config.method,
            hasToken: !!token,
            tokenPreview: token.substring(0, 20) + '...'
          });
        }
      } else {
        // Log warning nếu không có token cho protected endpoints
        if (config.url && !config.url.includes('/auth/')) {
          console.warn('⚠️ Request without token:', config.url, config.method);
        }
      }
      // Đảm bảo Content-Type luôn được set
      if (!config.headers['Content-Type']) {
        (config.headers as Record<string, string>)['Content-Type'] = 'application/json';
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // --- RESPONSE: auto refresh khi 401 ---
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { 
        _retry?: boolean;
        _skipRefresh?: boolean; // Flag để skip refresh cho một số request đặc biệt
      };

      // Bỏ qua nếu không phải 401 hoặc request đã skip refresh
      if (!error.response || error.response.status !== 401 || originalRequest._skipRefresh) {
        return Promise.reject(error);
      }

      // Nếu đã retry rồi mà vẫn 401 ⇒ có thể là lỗi authorization hoặc token refresh failed
      // Không logout ngay, để component xử lý error
      if (originalRequest._retry) {
        console.error('❌ Request still returns 401 after token refresh');
        console.error('❌ Original request URL:', originalRequest.url);
        console.error('❌ Original request method:', originalRequest.method);
        console.error('❌ Error response:', error.response?.data);
        console.error('❌ Error status:', error.response?.status);
        console.error('❌ Error headers:', error.response?.headers);
        console.error('❌ This might be an authorization error, not token expiration');
        
        // Kiểm tra token hiện tại
        const currentToken = localStorage.getItem('accessToken');
        if (currentToken) {
          try {
            const tokenParts = currentToken.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              console.error('🔍 Current token payload:', {
                id: payload.id,
                role: payload.role,
                exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'N/A',
                isExpired: payload.exp ? Date.now() / 1000 > payload.exp : false,
                allFields: Object.keys(payload)
              });
              
              if (!payload.role) {
                console.error('⚠️ Token missing "role" field - backend may require role in token for authorization');
              }
              
              // Kiểm tra xem request có data không và customerId có match với token id không
              if (originalRequest.data) {
                try {
                  const requestData = typeof originalRequest.data === 'string' 
                    ? JSON.parse(originalRequest.data) 
                    : originalRequest.data;
                  console.error('📋 Request data:', requestData);
                  
                  if (requestData.customerId && requestData.customerId !== payload.id) {
                    console.error('⚠️ WARNING: customerId in request does not match token id!', {
                      customerId: requestData.customerId,
                      tokenId: payload.id
                    });
                  }
                } catch {}
              }
            }
          } catch {}
        }
        
        // Kiểm tra request headers được gửi
        const authHeader = originalRequest.headers?.['Authorization'];
        const authHeaderStr = typeof authHeader === 'string' ? authHeader : String(authHeader || '');
        console.error('📋 Request headers sent:', {
          'Authorization': authHeaderStr.substring(0, 50) + '...',
          'Content-Type': originalRequest.headers?.['Content-Type'],
          'All headers': Object.keys(originalRequest.headers || {})
        });
        
        // Kiểm tra response headers từ backend
        console.error('📋 Response headers from backend:', {
          'WWW-Authenticate': error.response?.headers?.['www-authenticate'],
          'Content-Type': error.response?.headers?.['content-type'],
          'All headers': error.response?.headers ? Object.keys(error.response.headers) : []
        });
        
        // Log full error để debug
        console.error('📋 Full error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers
          }
        });
        
        // Không logout ngay - có thể là lỗi authorization (user không có quyền)
        // Chỉ logout nếu refresh token endpoint cũng fail
        return Promise.reject(error);
      }

      // Đánh dấu đang retry để tránh loop
      originalRequest._retry = true;
      console.log('🔄 Attempting to refresh token...');

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          console.error('❌ No refresh token found, logging out...');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          opts.onLogout?.();
          return Promise.reject(error);
        }

        console.log('🔄 Calling refresh token endpoint...');
        // Dùng axios RAW để tránh interceptor của instance (tránh loop)
        // Refresh token endpoint có thể không cần Authorization header
        const res = await axios.post<{ accessToken: string } | { data: { accessToken: string } }>(
          'http://localhost:1000/api/auth/refresh',
          { refreshToken },
          { 
            headers: { 'Content-Type': 'application/json' },
            // Không set withCredentials ở đây vì backend chưa config CORS cho credentials
            // Nếu backend yêu cầu cookies, uncomment dòng dưới và config backend CORS
            // withCredentials: true,
          }
        );

        console.log('✅ Refresh token response:', res.data);
        
        // Hỗ trợ cả 2 format: { accessToken: ... } hoặc { data: { accessToken: ... } }
        const newAccessToken = (res.data as any).accessToken || (res.data as any).data?.accessToken;
        if (!newAccessToken) {
          console.error('❌ No access token in refresh response:', res.data);
          throw new Error('No access token in refresh response');
        }

        // Decode token để kiểm tra (JWT có 3 parts: header.payload.signature)
        try {
          const tokenParts = newAccessToken.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            const oldToken = localStorage.getItem('accessToken');
            let oldPayload: any = null;
            
            // So sánh với token cũ
            if (oldToken && oldToken !== newAccessToken) {
              try {
                const oldTokenParts = oldToken.split('.');
                if (oldTokenParts.length === 3) {
                  oldPayload = JSON.parse(atob(oldTokenParts[1]));
                }
              } catch {}
            }
            
            console.log('✅ Decoded NEW token payload:', {
              id: payload.id,
              userId: payload.userId,
              email: payload.email,
              role: payload.role,
              exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'N/A',
              allFields: Object.keys(payload) // Xem tất cả fields trong token
            });
            
            if (oldPayload) {
              console.log('📊 OLD token payload:', {
                id: oldPayload.id,
                role: oldPayload.role,
                email: oldPayload.email,
                allFields: Object.keys(oldPayload)
              });
              
              // Kiểm tra xem token mới có thiếu fields quan trọng không
              if (oldPayload.role && !payload.role) {
                console.error('⚠️ WARNING: New token missing "role" field! Backend may reject requests.');
              }
              if (oldPayload.email && !payload.email) {
                console.warn('⚠️ New token missing "email" field');
              }
            }
          }
        } catch (decodeErr) {
          console.warn('⚠️ Could not decode token:', decodeErr);
        }

        console.log('✅ New access token received, updating localStorage...');
        console.log('✅ Token preview:', newAccessToken.substring(0, 50) + '...');
        
        // Kiểm tra xem token có thiếu role không
        const tokenParts = newAccessToken.split('.');
        if (tokenParts.length === 3) {
          try {
            const payload = JSON.parse(atob(tokenParts[1]));
            if (!payload.role) {
              console.warn('⚠️ Token từ refresh endpoint không có "role" field');
              console.warn('⚠️ Backend có thể yêu cầu role trong token để authorize');
              
              // Kiểm tra xem có user trong localStorage không để lấy role
              const userStr = localStorage.getItem('user');
              if (userStr) {
                try {
                  const user = JSON.parse(userStr);
                  if (user.role) {
                    console.warn(`⚠️ User có role "${user.role}" trong localStorage nhưng không có trong token`);
                    console.warn('⚠️ Backend refresh token endpoint cần được fix để include role trong token');
                  }
                } catch {}
              }
            }
          } catch {}
        }
        
        // Cập nhật localStorage (request interceptor đọc từ đây)
        localStorage.setItem('accessToken', newAccessToken);
        
        // Cập nhật Redux state nếu có
        // Note: Redux state sẽ được sync từ localStorage khi component re-render

        // Gắn token mới vào request cũ rồi gọi lại qua instance
        if (!originalRequest.headers) {
          originalRequest.headers = {} as typeof originalRequest.headers;
        }
        (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${newAccessToken}`;
        
        // Đảm bảo Content-Type vẫn được set
        if (!originalRequest.headers['Content-Type']) {
          (originalRequest.headers as Record<string, string>)['Content-Type'] = 'application/json';
        }

        // Log chi tiết để debug
        console.log('🔄 Retrying original request with new token...', originalRequest.url);
        console.log('🔑 Authorization header:', `Bearer ${newAccessToken.substring(0, 20)}...`);
        console.log('📋 Request headers:', {
          'Authorization': `Bearer ${newAccessToken.substring(0, 30)}...`,
          'Content-Type': originalRequest.headers['Content-Type'],
          'Method': originalRequest.method,
          'URL': originalRequest.url,
          'Data': originalRequest.data ? JSON.parse(originalRequest.data) : 'No data'
        });
        
        // Decode token để verify một lần nữa
        try {
          const tokenParts = newAccessToken.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log('🔍 Token payload before retry:', {
              id: payload.id,
              role: payload.role,
              exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'N/A',
              isExpired: payload.exp ? Date.now() / 1000 > payload.exp : false
            });
          }
        } catch {}
        
        // Retry request với token mới (giữ nguyên _retry = true để tránh loop)
        // Nếu retry vẫn 401, sẽ reject error để component xử lý (không logout ngay)
        return instance(originalRequest);
      } catch (err: any) {
        // refresh fail → đăng xuất (chỉ khi thực sự là token error, không phải network error)
        const isTokenError = err?.response?.status === 401 || err?.response?.status === 403;
        const isNetworkError = !err?.response; // Network error không có response
        
        console.error('❌ Refresh token catch block:', {
          status: err?.response?.status,
          message: err?.message,
          data: err?.response?.data,
          isNetworkError,
          isTokenError
        });
        
        if (isNetworkError) {
          // Network error - không logout, để user retry
          console.error('❌ Network error during token refresh:', err?.message || err);
          // Reset _retry để có thể thử lại sau
          delete originalRequest._retry;
          return Promise.reject(err);
        }
        
        // Token error (401/403) hoặc các lỗi khác từ server
        console.error('❌ Token refresh error:', err?.response?.status, err?.message || err);
        console.error('❌ Refresh token endpoint response:', err?.response?.data);
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
