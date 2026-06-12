import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#F5F5F5' }}
    >
      <div
        className="w-full max-w-md text-center p-8"
        style={{
          backgroundColor: '#fff',
          border: '1px solid #E6E6E6',
          borderRadius: '6px',
        }}
      >
        {/* ERROR CODE */}
        <h1
          className="text-6xl font-black"
          style={{ color: '#303841', letterSpacing: '2px' }}
        >
          404
        </h1>

        {/* MESSAGE */}
        <p
          className="mt-3 text-sm"
          style={{ color: '#303841', opacity: 0.75 }}
        >
          The page you are trying to reach doesn’t exist or has been moved.
        </p>

        {/* DECOR LINE */}
        <div
          className="mx-auto mt-5 mb-6"
          style={{
            width: '60px',
            height: '2px',
            backgroundColor: '#76ABAE',
          }}
        />

        {/* BUTTON */}
        <Link
          to="/"
          className="inline-block px-5 py-2 text-sm font-semibold transition"
          style={{
            backgroundColor: '#303841',
            color: '#fff',
            borderRadius: '6px',
          }}
        >
          Back to Home
        </Link>

        {/* SECONDARY HINT */}
        <p className="mt-5 text-xs" style={{ color: '#303841', opacity: 0.6 }}>
          Check the URL or return to dashboard/home page
        </p>
      </div>
    </div>
  );
}

export default NotFound;