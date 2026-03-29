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
      setErrorText('Password must be at least 6 characters long');
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
      setSuccessText('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate(ROUTES.login, { replace: true });
      }, 2000);
    } catch (error) {
      setErrorText(error?.response?.data?.msg || error.message || 'An error occurred');
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 px-4"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-2">
          Reset Password
        </h1>
        <p className="text-center text-gray-600 mb-6">Enter your new password below</p>

        <form onSubmit={handleResetPassword} className="space-y-4">
          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorText('');
              }}
              placeholder="Enter new password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* Confirm Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrorText('');
              }}
              placeholder="Confirm new password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* Error Message */}
          {errorText && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
            >
              {errorText}
            </motion.div>
          )}

          {/* Success Message */}
          {successText && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm"
            >
              {successText}
            </motion.div>
          )}

          {/* Reset Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition duration-200"
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </motion.button>
        </form>

        {/* Back to Login */}
        <div className="text-center mt-6">
          <p className="text-gray-600">Remember your password?</p>
          <button
            onClick={() => navigate(ROUTES.login)}
            className="text-blue-600 hover:text-blue-700 font-semibold mt-2 transition"
          >
            Back to Login
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ResetPasswordPage;
