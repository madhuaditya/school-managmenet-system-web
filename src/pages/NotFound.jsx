import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center gap-4">
      <h1 className="font-heading text-5xl font-black text-slate-900">404</h1>
      <p className="text-slate-700">The page you are looking for does not exist.</p>
      <Link
        to="/"
        className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Back To Home
      </Link>
    </div>
  );
}

export default NotFound;
