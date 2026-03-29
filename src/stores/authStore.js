import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  loginSchoolApi,
  loginUserApi,
  logoutSchoolApi,
  logoutUserApi,
} from '../services/authService';

const storage = createJSONStorage(() => localStorage);

export const useAuthStore = create(
  persist(
    (set, get) => ({
      profile: null,
      authType: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      loginUser: async ({ email, password }) => {
        set({ isLoading: true });
        try {
          const result = await loginUserApi({ email, password });
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
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
