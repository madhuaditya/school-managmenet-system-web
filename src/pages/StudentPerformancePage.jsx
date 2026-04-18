import PerformanceForm from '../components/dashboard-menus/performance/PerformanceForm';

function StudentPerformancePage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-slate-100 via-slate-50 to-white py-6">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <PerformanceForm />
      </div>
    </div>
  );
}

export default StudentPerformancePage;
