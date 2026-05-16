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

  useEffect(() => {
    if (openOtp) {
      // focus first input when OTP panel opens
      setTimeout(() => inputsRef.current[0]?.focus(), 30);
    }
  }, [openOtp]);

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
    } catch (error) {
      setErrorText(error?.response?.data?.msg || error?.message || 'Failed to login. Please try again.');
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
    <div className="mx-auto max-w-lg py-12">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200"
      >
     {!openOtp  ?
       <>
          <h1 className="font-heading text-3xl font-bold text-slate-900">User Login</h1>
        <p className="mt-2 text-sm text-slate-600">Sign in with your user account credentials.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Username</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-500"
              placeholder="Username"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-500"
              placeholder="Password"
            />
          </label>

          <button
            type="submit"
            disabled={isLoading || sendingOtp}
            className="w-full rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {sendingOtp ? 'Sending OTP...' : isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">Forgot Password</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input
              type="text"
              value={forgotUsername}
              onChange={(event) => setForgotUsername(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-500"
              placeholder="Enter your username"
            />
            <input
              type="email"
              value={forgotEmail}
              onChange={(event) => setForgotEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-500"
              placeholder="Enter your email"
            />
          </div>
          <button
            type="button"
            onClick={onForgotPassword}
            disabled={sendingForgot || isLoading}
            className="mt-3 w-full rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {sendingForgot ? 'Sending...' : 'Send Reset Link'}
          </button>
        </div>

        {errorText && <p className="mt-4 text-sm font-medium text-red-600">{errorText}</p>}

        <div className="mt-5 flex items-center justify-between text-sm">
          <span className="text-slate-600">School account?</span>
          <Link to={ROUTES.schoolLogin} className="font-semibold text-cyan-700 hover:text-cyan-600">
            Go to School Login
          </Link>
        </div>
        </> :
        <form onSubmit={onSubmitOTP} className="mt-6 flex flex-col items-center gap-4">
          <div>
            <p className="text-sm font-medium text-slate-700">{otpMessage}</p>
          </div>
          <div id="OtpInput" className="flex items-center justify-center" style={{ gap: 12 }}>
            {Array.from({ length: 6 }).map((_, idx) => {
              const otpChars = otp.split('');
              const value = otpChars[idx] || '';
              return (
                <input
                  key={idx}
                  ref={(el) => (inputsRef.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={value}
                  onChange={(e) => {
                    const digit = e.target.value.replace(/\D/g, '').slice(-1);
                    const arr = otp.split('');
                    while (arr.length < 6) arr.push('');
                    arr[idx] = digit;
                    const newOtp = arr.join('').slice(0, 6);
                    setOtp(newOtp);
                    if (digit && idx < 5) inputsRef.current[idx + 1]?.focus();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace') {
                      e.preventDefault();
                      const arr = otp.split('');
                      while (arr.length < 6) arr.push('');
                      if (arr[idx]) {
                        arr[idx] = '';
                        setOtp(arr.join(''));
                      } else if (idx > 0) {
                        inputsRef.current[idx - 1]?.focus();
                        arr[idx - 1] = '';
                        setOtp(arr.join(''));
                      }
                    } else if (e.key === 'ArrowLeft' && idx > 0) {
                      inputsRef.current[idx - 1]?.focus();
                    } else if (e.key === 'ArrowRight' && idx < 5) {
                      inputsRef.current[idx + 1]?.focus();
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const paste = e.clipboardData.getData('Text') || '';
                    const digits = (paste.match(/\d/g) || []).slice(0, 6 - idx);
                    if (digits.length === 0) return;
                    const arr = otp.split('');
                    while (arr.length < 6) arr.push('');
                    for (let i = 0; i < digits.length; i++) {
                      arr[idx + i] = digits[i];
                      if (inputsRef.current[idx + i]) inputsRef.current[idx + i].value = digits[i];
                    }
                    setOtp(arr.join('').slice(0, 6));
                    const next = Math.min(5, idx + digits.length - 1);
                    inputsRef.current[Math.max(idx, next)]?.focus();
                  }}
                  className="rounded-xl border border-slate-300 px-0 text-sm font-medium outline-none transition-colors"
                  style={{
                    width: '3.25rem',
                    height: '3.25rem',
                    borderRadius: '0.75rem',
                    fontSize: '1.125rem',
                    textAlign: 'center',
                    background: '#ffffff',
                  }}
                />
              );
            })}
          </div>

          <div className="flex w-full gap-3">
            <button
              type="submit"
              disabled={isLoading || verifyingOtp}
              className="flex-1 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
            >
              {verifyingOtp || isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpenOtp(false);
                setOtp('');
                setToken('');
              }}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
          <div>
            <p className="text-sm text-slate-600">Didn't receive the OTP? Try logging in again.</p>
            {errorText && <p className="mt-2 text-sm font-medium text-red-600">{errorText}</p>}
          </div>
        </form>
            }
      
      </motion.section>
    </div>
  );
}

export default Login;
