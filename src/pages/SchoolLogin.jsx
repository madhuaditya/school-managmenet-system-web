import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { forgotSchoolPasswordApi } from '../services/authService';
import { ROUTES } from '../constants/routes';

function SchoolLogin() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loginSchool = useAuthStore((state) => state.loginSchool);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [sendingForgot, setSendingForgot] = useState(false);
  const [errorText, setErrorText] = useState('');

  if (isAuthenticated) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #E6E6E6',
    borderRadius: '6px',
    outline: 'none',
    color: '#303841',
  };

  const focusStyle = {
    borderColor: '#76ABAE',
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setErrorText('');

    if (!email.trim() || !password) {
      setErrorText('School email and password are required.');
      return;
    }

    try {
      await loginSchool({ email: email.trim(), password });
      navigate(ROUTES.dashboard, { replace: true });
    } catch (error) {
      setErrorText(error?.response?.data?.msg || 'School login failed.');
    }
  };

  const onForgotPassword = async () => {
    setErrorText('');

    const validEmail = /^\S+@\S+\.\S+$/.test(forgotEmail);

    if (!validEmail) {
      setErrorText('Enter valid school email.');
      return;
    }

    try {
      setSendingForgot(true);
      const result = await forgotSchoolPasswordApi(forgotEmail.trim());

      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to send reset link');
      }

      setForgotEmail('');
      alert('Reset link sent to school email');
    } catch (error) {
      setErrorText(error?.message || 'Failed to send reset link.');
    } finally {
      setSendingForgot(false);
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
          backgroundColor: '#FFFFFF',
        }}
      >

        {/* LEFT IMAGE SIDE */}
        <div className="hidden md:block relative">
          <img
            src="https://images.unsplash.com/photo-1588072432836-e10032774350"
            alt="school"
            className="h-full w-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, rgba(48,56,65,0.6), rgba(48,56,65,0.9))',
            }}
          />
          <div className="absolute bottom-6 left-6 right-6">
            <h2 className="text-xl font-bold text-white">
              School Management Portal
            </h2>
            <p className="mt-1 text-sm text-white/80">
              Secure access for administrators and staff
            </p>
          </div>
        </div>

        {/* RIGHT FORM SIDE */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8"
        >
          <h1 className="text-2xl font-bold" style={{ color: '#303841' }}>
            School Login
          </h1>

          <p className="mt-2 text-sm" style={{ color: '#303841', opacity: 0.7 }}>
            Sign in with your school admin credentials.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">

            {/* EMAIL */}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="School email"
              style={inputStyle}
              onFocus={(e) => Object.assign(e.target.style, focusStyle)}
              onBlur={(e) => (e.target.style.borderColor = '#E6E6E6')}
            />

            {/* PASSWORD */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                onBlur={(e) => (e.target.style.borderColor = '#E6E6E6')}
              />

              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-2 text-xs px-2 py-1"
                style={{
                  borderRadius: '4px',
                  color: '#303841',
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 text-sm font-semibold"
              style={{
                backgroundColor: '#303841',
                color: '#FFFFFF',
                borderRadius: '6px',
              }}
            >
              {isLoading ? 'Logging in...' : 'School Login'}
            </button>
          </form>

          {/* FORGOT PASSWORD */}
          <div
            className="mt-6 p-4"
            style={{
              backgroundColor: '#F5F5F5',
              border: '1px solid #E6E6E6',
              borderRadius: '6px',
            }}
          >
            <p className="text-sm font-semibold" style={{ color: '#303841' }}>
              Forgot Password
            </p>

            <div className="mt-3 flex gap-2">
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="School email"
                style={{ ...inputStyle, flex: 1 }}
              />

              <button
                onClick={onForgotPassword}
                disabled={sendingForgot || isLoading}
                className="px-4 py-2 text-sm font-semibold"
                style={{
                  backgroundColor: '#76ABAE',
                  color: '#FFFFFF',
                  borderRadius: '6px',
                }}
              >
                {sendingForgot ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>

          {/* ERROR */}
          {errorText && (
            <p className="mt-4 text-sm" style={{ color: '#FF5722' }}>
              {errorText}
            </p>
          )}

          {/* SWITCH LOGIN */}
          <div className="mt-5 text-sm">
            <Link
              to={ROUTES.login}
              style={{ color: '#303841', fontWeight: 600 }}
            >
              ← Go to User Login
            </Link>
          </div>

        </motion.section>
      </div>
    </div>
  );
}

export default SchoolLogin;