import PerformanceForm from '../components/dashboard-menus/performance/PerformanceForm';

function StudentPerformancePage() {
  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="mx-auto w-full max-w-5xl px-4 md:px-6">
        <PerformanceForm />
      </div>
    </div>
  );
}

export default StudentPerformancePage;
