// src/redux/slices/authSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { AxiosError } from 'axios';
import axios from '../../api/axios';

// ==== Types ====
// Tuỳ API của bạn, có thể bổ sung field cho User
export type User = {
  id: string;
  username: string;
  email: string;
  role?: string;
  [k: string]: unknown;
};

export type LoginPayload = {
  usernameOrEmail: string;
  password: string;
};

export type LoginResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
};

// ==== Helpers ====
function safeJSONParse<T>(value: string | null): T | null {
  try {
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

// ---- Bootstrap từ localStorage (giữ nguyên flow cũ)
const accessTokenLS = localStorage.getItem('accessToken');
const refreshTokenLS = localStorage.getItem('refreshToken');
const userStr = localStorage.getItem('user');

const initialState: AuthState = {
  user: safeJSONParse<User>(userStr),
  accessToken: accessTokenLS || null,
  refreshToken: refreshTokenLS || null,
  loading: false,
  error: null,
};

// ---- Login thường (username/email + password)
export const loginUser = createAsyncThunk<
  LoginResponse,             // Return type khi fulfilled
  LoginPayload,              // Arg type khi dispatch
  { rejectValue: string }    // Type cho rejectWithValue
>(
  'auth/loginUser',
  async ({ usernameOrEmail, password }, thunkAPI) => {
    try {
      const res = await axios.post<LoginResponse>('/auth/login', { usernameOrEmail, password });
      // API trả { user, accessToken, refreshToken }
      return res.data;
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Đăng nhập thất bại';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // ---- Dùng cho Google OAuth (Cách 2):
    // Nhận { user, accessToken, refreshToken } từ /auth/callback
    authLoginSuccess: (state, action: PayloadAction<LoginResponse>) => {
      const { user, accessToken, refreshToken } = action.payload;
      state.user = user ?? null;
      state.accessToken = accessToken ?? null;
      state.refreshToken = refreshToken ?? null;
      state.error = null;

      if (user) localStorage.setItem('user', JSON.stringify(user));
      if (accessToken) localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    },

    // ---- Logout local + dọn localStorage
    logout: (state) => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.error = null;
    },

    // ---- Set lại thủ công khi cần (giữ key đúng là accessToken)
    setCredentials: (
      state,
      action: PayloadAction<{
        user?: User;
        accessToken?: string;
        refreshToken?: string;
      }>
    ) => {
      const { user, accessToken, refreshToken } = action.payload || {};
      if (user) {
        state.user = user;
        localStorage.setItem('user', JSON.stringify(user));
      }
      if (accessToken) {
        state.accessToken = accessToken;
        localStorage.setItem('accessToken', accessToken);
      }
      if (refreshToken) {
        state.refreshToken = refreshToken;
        localStorage.setItem('refreshToken', refreshToken);
      }
    },

    // ---- Khi /refresh trả accessToken mới
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      localStorage.setItem('accessToken', action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Login thường
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;

        localStorage.setItem('accessToken', action.payload.accessToken);
        localStorage.setItem('refreshToken', action.payload.refreshToken);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Đăng nhập thất bại';
      });
  },
});

export const { authLoginSuccess, logout, setCredentials, setAccessToken } = authSlice.actions;
export default authSlice.reducer;
