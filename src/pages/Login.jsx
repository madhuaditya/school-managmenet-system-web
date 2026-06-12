import { useState, useRef, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { forgotPasswordApi,sendOTPApi } from '../services/authService';
import { ROUTES } from '../constants/routes';

function Login() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loginUser = useAuthStore((state) => state.loginUser);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [sendingForgot, setSendingForgot] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [openOtp, setOpenOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [token, setToken] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const inputsRef = useRef([]);
  const [showPassword, setShowPassword] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (openOtp) {
      // focus first input when OTP panel opens
      setTimeout(() => inputsRef.current[0]?.focus(), 30);
    }
  }, [openOtp]);

  // cooldown timer for resend OTP
  useEffect(() => {
    if (!cooldown) return undefined;
    const id = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(id);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  if (isAuthenticated) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  const onSubmitOTP = async (event) => {
     if (event?.preventDefault) event.preventDefault();
    setErrorText('');
    if(!token) {
      setErrorText('Token is missing. Please try logging in again.');
      return;
    }
    if (!otp.trim() ) {
      setErrorText('OTP and token are required.');
      return;
    }

   const arrOtp = otp.split('')
    if (arrOtp.length !== 6 || arrOtp.includes('')) {
      setErrorText('Enter complete 6-digit OTP');
      return;
    }

    try {
      setVerifyingOtp(true);
      await loginUser({ token, code: otp });
      navigate(ROUTES.dashboard, { replace: true });
    } catch (error) {
      setErrorText(error?.response?.data?.msg || error?.message || 'Failed to login. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  }

  const handleOtpChange = (value, idx) => {
  if (!/^\d*$/.test(value)) return;

  const otpArr = otp.split('');
  while (otpArr.length < 6) otpArr.push('');

  otpArr[idx] = value.slice(-1);

  const newOtp = otpArr.join('').slice(0, 6);
  setOtp(newOtp);

  if (value && idx < 5) {
    inputsRef.current[idx + 1]?.focus();
  }
};

const handleKeyDown = (e, idx) => {
  if (e.key === 'Backspace') {
    e.preventDefault();

    const otpArr = otp.split('');
    while (otpArr.length < 6) otpArr.push('');

    if (otpArr[idx]) {
      otpArr[idx] = '';
      setOtp(otpArr.join(''));
    } else if (idx > 0) {
      inputsRef.current[idx - 1]?.focus();
      otpArr[idx - 1] = '';
      setOtp(otpArr.join(''));
    }
  }

  if (e.key === 'ArrowLeft' && idx > 0) {
    inputsRef.current[idx - 1]?.focus();
  }

  if (e.key === 'ArrowRight' && idx < 5) {
    inputsRef.current[idx + 1]?.focus();
  }
};

  const onSubmit = async (event) => {
    event.preventDefault();
    setErrorText('');

    if (!username.trim() || !password) {
      setErrorText('Username and password are required.');
      return;
    }

    try {
      setSendingOtp(true);
      const result = await sendOTPApi({ username: username.trim(), password });
      console.log('OTP send result: ', result);
      if (!result?.success) {
        throw new Error(result?.msg || 'Login failed');
      }
      setOtpMessage(result?.msg || 'OTP sent to your registered phone number');
      setToken(result.data.token);
      setOpenOtp(true);
      // initialize resend tracking
      setResendCount(1);
      setCooldown(90);
    } catch (error) {
      setErrorText(error?.response?.data?.msg || error?.message || 'Failed to login. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  const onResendOtp = async () => {
    if (resendCount >= 5) return;
    if (cooldown > 0) return;
    setErrorText('');
    try {
      setSendingOtp(true);
      const result = await sendOTPApi({ username: username.trim(), password });
      if (!result?.success) throw new Error(result?.msg || 'Failed to resend OTP');
      setOtpMessage(result?.msg || 'OTP resent to your registered phone number');
      setToken(result.data.token);
      setResendCount((c) => c + 1);
      setCooldown(90);
    } catch (err) {
      setErrorText(err?.response?.data?.msg || err?.message || 'Failed to resend OTP.');
    } finally {
      setSendingOtp(false);
    }
  };

  const onForgotPassword = async () => {
    setErrorText('');
    const validUsername = forgotUsername.trim().length >= 5;
    const validEmail = /^\S+@\S+\.\S+$/.test(forgotEmail);

    if (!validUsername || !validEmail) {
      setErrorText('Username and valid email are required for password reset.');
      return;
    }

    try {
      setSendingForgot(true);
      const result = await forgotPasswordApi({
        username: forgotUsername.trim(),
        email: forgotEmail.trim(),
      });
      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to send reset link');
        return ;
      }
      window.alert('Password reset link sent to your email.');
      setForgotUsername('');
      setForgotEmail('');
    } catch (error) {
      setErrorText(error?.response?.data?.msg || error?.message || 'Failed to send reset link.');
    } finally {
      setSendingForgot(false);
    }
  };

return (
  <div
    className="min-h-screen mt-5 flex items-center justify-center px-4"
    style={{ backgroundColor: '#F5F5F5' }}
  >
    <div
      className="grid w-full max-w-5xl overflow-hidden grid-cols-1 md:grid-cols-2"
      style={{
        border: '1px solid #E6E6E6',
        borderRadius: '6px',
        backgroundColor: '#FFFFFF',
      }}
    >

      {/* LEFT SIDE - FORM */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className=" p-3"
      >
        {!openOtp ? (
          <>
            <h1 className="text-2xl font-bold" style={{ color: '#303841' }}>
              User Login
            </h1>

            <p className="mt-2 text-sm" style={{ color: '#303841', opacity: 0.7 }}>
              Sign in with your user account credentials.
            </p>

            {/* FORM */}
            <form onSubmit={onSubmit} className="mt-6 space-y-4">

              {/* USERNAME */}
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #E6E6E6',
                  borderRadius: '6px',
                  outline: 'none',
                  color: '#303841',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#76ABAE')}
                onBlur={(e) => (e.target.style.borderColor = '#E6E6E6')}
              />

              {/* PASSWORD */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #E6E6E6',
                    borderRadius: '6px',
                    outline: 'none',
                    color: '#303841',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#76ABAE')}
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
                disabled={isLoading || sendingOtp}
                className="w-full py-2 text-sm font-semibold transition"
                style={{
                  backgroundColor: '#303841',
                  color: '#FFFFFF',
                  borderRadius: '6px',
                }}
              >
                {sendingOtp
                  ? 'Sending OTP...'
                  : isLoading
                  ? 'Logging in...'
                  : 'Login'}
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

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <input
                  type="text"
                  value={forgotUsername}
                  onChange={(e) => setForgotUsername(e.target.value)}
                  placeholder="Username"
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #E6E6E6',
                    borderRadius: '6px',
                    outline: 'none',
                  }}
                />

                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Email"
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #E6E6E6',
                    borderRadius: '6px',
                    outline: 'none',
                  }}
                />
              </div>

              <button
                type="button"
                onClick={onForgotPassword}
                disabled={sendingForgot || isLoading}
                className="mt-3 w-full py-2 text-sm font-semibold"
                style={{
                  backgroundColor: '#76ABAE',
                  color: '#FFFFFF',
                  borderRadius: '6px',
                }}
              >
                {sendingForgot ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>

            {/* ERROR */}
            {errorText && (
              <p className="mt-4 text-sm font-medium" style={{ color: '#FF5722' }}>
                {errorText}
              </p>
            )}

            {/* SWITCH */}
            <div className="mt-5 text-sm">
              <Link
                to={ROUTES.schoolLogin}
                style={{ color: '#303841', fontWeight: 600 }}
              >
                ← Go to School Login
              </Link>
            </div>
          </>
        ) : (
          /* OTP SECTION (UNCHANGED STRUCTURE, ONLY STYLE TUNED) */
          <form onSubmit={onSubmitOTP} className="flex flex-col items-center gap-4">

            <p className="text-sm font-medium" style={{ color: '#303841' }}>
              {otpMessage}
            </p>
           {/* ERROR */}
            {errorText && (
              <p className="mt-4 text-sm font-medium" style={{ color: '#FF5722' }}>
                {errorText}
              </p>
            )}

              <div className="flex gap-2 sm:gap-3 flex-wrap justify-center">
            {Array.from({ length: 6 }).map((_, idx) => (
              <input
                key={idx}
                ref={(el) => (inputsRef.current[idx] = el)}
                value={otp[idx] || ''}
                onChange={(e) => handleOtpChange(e.target.value, idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                inputMode="numeric"
                maxLength={1}
                className="w-11 h-11 sm:w-12 sm:h-12 text-center border border-slate-300 rounded-md text-lg focus:border-[#76ABAE] outline-none"
              />
            ))}
          </div>

            <div className="flex w-full gap-3">
              <button
                type="submit"
                className="flex-1 py-2 text-sm font-semibold"
                style={{
                  backgroundColor: '#303841',
                  color: '#fff',
                  borderRadius: '6px',
                }}
              >
                Verify OTP
              </button>

              <button
                type="button"
                onClick={() => {
                  setOpenOtp(false);
                  setOtp('');
                  setToken('');
                }}
                className="flex-1 py-2 text-sm font-semibold"
                style={{
                  border: '1px solid #E6E6E6',
                  borderRadius: '6px',
                  backgroundColor: '#fff',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </motion.section>

      {/* RIGHT SIDE - IMAGE */}
      <div className="relative hidden md:block">
        <img
          src="https://images.unsplash.com/photo-1523240795612-9a054b0db644"
          alt="user login"
          className="h-full w-full object-cover"
        />

        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(48,56,65,0.4), rgba(48,56,65,0.9))',
          }}
        />

        <div className="absolute bottom-6 left-6 right-6">
          <h2 className="text-xl font-bold text-white">
            Welcome Back
          </h2>
          <p className="mt-1 text-sm text-white/80">
            Access your dashboard and manage your account securely
          </p>
        </div>
      </div>

    </div>
  </div>
);
}

export default Login;
