import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { resetPasswordApi } from '../services/authService';
import { ROUTES } from '../constants/routes';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    if (!password || !confirmPassword) {
      setErrorText('All fields are required');
      return false;
    }
    if (password.length < 6) {
      setErrorText('Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setErrorText('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorText('');
    setSuccessText('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const result = await resetPasswordApi(token, password);

      if (!result?.success) {
        setErrorText(result?.msg || 'Failed to reset password');
        setIsLoading(false);
        return;
      }

      setSuccessText('Password updated successfully');

      setTimeout(() => {
        navigate(ROUTES.login, { replace: true });
      }, 1500);
    } catch (error) {
      setErrorText(error?.response?.data?.msg || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#F5F5F5' }}
    >
      <div
        className="grid w-full max-w-5xl overflow-hidden"
        style={{
          gridTemplateColumns: '1fr 1fr',
          border: '1px solid #E6E6E6',
          borderRadius: '6px',
          backgroundColor: '#fff',
        }}
      >

        {/* LEFT SIDE - FORM */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8"
        >
          <h1 className="text-2xl font-bold" style={{ color: '#303841' }}>
            Reset Password
          </h1>

          <p className="mt-2 text-sm" style={{ color: '#303841', opacity: 0.7 }}>
            Create a new secure password for your account
          </p>

          <form onSubmit={handleResetPassword} className="mt-6 space-y-4">

            {/* NEW PASSWORD */}
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorText('');
              }}
              placeholder="New password"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #E6E6E6',
                borderRadius: '6px',
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#76ABAE')}
              onBlur={(e) => (e.target.style.borderColor = '#E6E6E6')}
            />

            {/* CONFIRM PASSWORD */}
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrorText('');
              }}
              placeholder="Confirm password"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #E6E6E6',
                borderRadius: '6px',
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#76ABAE')}
              onBlur={(e) => (e.target.style.borderColor = '#E6E6E6')}
            />

            {/* ERROR */}
            {errorText && (
              <p className="text-sm font-medium" style={{ color: '#FF5722' }}>
                {errorText}
              </p>
            )}

            {/* SUCCESS */}
            {successText && (
              <p className="text-sm font-medium" style={{ color: '#76ABAE' }}>
                {successText}
              </p>
            )}

            {/* BUTTON */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 text-sm font-semibold transition"
              style={{
                backgroundColor: '#303841',
                color: '#fff',
                borderRadius: '6px',
              }}
            >
              {isLoading ? 'Updating...' : 'Reset Password'}
            </button>
          </form>

          {/* BACK */}
          <div className="mt-5">
            <button
              onClick={() => navigate(ROUTES.login)}
              className="text-sm font-semibold"
              style={{ color: '#303841' }}
            >
              ← Back to Login
            </button>
          </div>
        </motion.section>

        {/* RIGHT SIDE - IMAGE PANEL */}
        <div className="hidden md:block relative">
          <img
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d"
            alt="reset password"
            className="h-full w-full object-cover"
          />

          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(48,56,65,0.35), rgba(48,56,65,0.85))',
            }}
          />

          <div className="absolute bottom-6 left-6 right-6">
            <h2 className="text-xl font-bold text-white">
              Secure Your Account
            </h2>
            <p className="text-sm text-white/80 mt-1">
              Choose a strong password to protect your data
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ResetPasswordPage;