import { useAuthStore } from '../stores/authStore';

export const useRole = () => {
  const profile = useAuthStore((state) => state.profile);
  const role = profile?.role || 'student';
  
  return {
    role,
    isAdmin: role === 'admin',
    isTeacher: role === 'teacher',
    isStudent: role === 'student',
    isStaff: role === 'staff',
  };
};

export default useRole;
