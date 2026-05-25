import { useAuthStore } from '../stores/authStore';

export const useRole = () => {
  const profile = useAuthStore((state) => state.profile);
  const authType = useAuthStore((state) => state.authType);
  const role = profile?.role || 'student';
  
  return {
    role,
    authType,
    isSchoolAccount: authType === 'school',
    isAdmin: role === 'admin',
    isTeacher: role === 'teacher',
    isStudent: role === 'student',
    isStaff: role === 'staff',
  };
};

export default useRole;
