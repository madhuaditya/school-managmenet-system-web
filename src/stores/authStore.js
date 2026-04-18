import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  loginSchoolApi,
  loginUserApi,
  logoutSchoolApi,
  logoutUserApi,
} from '../services/authService';

const storage = createJSONStorage(() => localStorage);
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

const getNextAuthExpiry = () => Date.now() + ONE_MONTH_MS;

const isAuthExpired = (expiresAt) => {
  const expiry = Number(expiresAt || 0);
  return !Number.isFinite(expiry) || expiry <= Date.now();
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      profile: null,
      authType: null,
      accessToken: null,
      refreshToken: null,
      authExpiresAt: null,
      isAuthenticated: false,
      isLoading: false,

      loginUser: async ({ username, password }) => {
        set({ isLoading: true });
        try {
          const result = await loginUserApi({ username, password });
          if (!result?.success || !result?.data?.accessToken) {
            throw new Error(result?.msg || 'Login failed');
          }

          set({
            profile: {
              _id: result.data._id,
              name: result.data.name,
              email: result.data.email,
              phone: result.data.phone,
              role: result.data.role?.role || result.data.role || 'user',
              school: result.data.school || null,
            },
            authType: 'user',
            accessToken: result.data.accessToken,
            refreshToken: result.data.refreshToken,
            authExpiresAt: getNextAuthExpiry(),
            isAuthenticated: true,
            isLoading: false,
          });

          return result;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      loginSchool: async ({ email, password }) => {
        set({ isLoading: true });
        try {
          const result = await loginSchoolApi({ email, password });
          if (!result?.success || !result?.data?.token) {
            throw new Error(result?.msg || 'School login failed');
          }

          set({
            profile: {
              _id: result.data.school?._id,
              name: result.data.school?.schoolName,
              email: result.data.school?.email,
              role: result.data.school?.role?.role || 'admin',
              school: result.data.school || null,
            },
            authType: 'school',
            accessToken: result.data.token,
            refreshToken: result.data.refreshToken,
            authExpiresAt: getNextAuthExpiry(),
            isAuthenticated: true,
            isLoading: false,
          });

          return result;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        const { authType, refreshToken } = get();

        try {
          if (authType === 'user' && refreshToken) {
            await logoutUserApi(refreshToken);
          }

          if (authType === 'school' && refreshToken) {
            await logoutSchoolApi(refreshToken);
          }
        } catch {
          // Ignore API logout failures and clear local session.
        }

        set({
          profile: null,
          authType: null,
          accessToken: null,
          refreshToken: null,
          authExpiresAt: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
    }),
    {
      name: 'school-web-auth-store',
      storage,
      partialize: (state) => ({
        profile: state.profile,
        authType: state.authType,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        authExpiresAt: state.authExpiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (!state.isAuthenticated) return;

        if (isAuthExpired(state.authExpiresAt)) {
          state.profile = null;
          state.authType = null;
          state.accessToken = null;
          state.refreshToken = null;
          state.authExpiresAt = null;
          state.isAuthenticated = false;
          state.isLoading = false;
        }
      },
    },
  ),
);
