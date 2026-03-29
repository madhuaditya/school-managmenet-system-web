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
  const [forgotEmail, setForgotEmail] = useState('');
  const [sendingForgot, setSendingForgot] = useState(false);
  const [errorText, setErrorText] = useState('');

  if (isAuthenticated) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

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
      setErrorText(error?.response?.data?.msg || error?.message || 'School login failed.');
    }
  };

  const onForgotPassword = async () => {
    setErrorText('');
    const validEmail = /^\S+@\S+\.\S+$/.test(forgotEmail);

    if (!validEmail) {
      setErrorText('Please enter a valid school email.');
      return;
    }

    try {
      setSendingForgot(true);
      const result = await forgotSchoolPasswordApi(forgotEmail.trim());
      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to send school reset link');
      }
      window.alert('School password reset link sent.');
      setForgotEmail('');
    } catch (error) {
      setErrorText(error?.response?.data?.msg || error?.message || 'Failed to send school reset link.');
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
        <h1 className="font-heading text-3xl font-bold text-slate-900">School Login</h1>
        <p className="mt-2 text-sm text-slate-600">Sign in with your school admin credentials.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">School Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-500"
              placeholder="School email"
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
            disabled={isLoading}
            className="w-full rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? 'Logging in...' : 'School Login'}
          </button>
        </form>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">Forgot Password</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              value={forgotEmail}
              onChange={(event) => setForgotEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-500"
              placeholder="Enter school email"
            />
            <button
              type="button"
              onClick={onForgotPassword}
              disabled={sendingForgot || isLoading}
              className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {sendingForgot ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        </div>

        {errorText && <p className="mt-4 text-sm font-medium text-red-600">{errorText}</p>}

        <div className="mt-5 flex items-center justify-between text-sm">
          <span className="text-slate-600">User account?</span>
          <Link to={ROUTES.login} className="font-semibold text-cyan-700 hover:text-cyan-600">
            Go to User Login
          </Link>
        </div>
      </motion.section>
    </div>
  );
}

export default SchoolLogin;
