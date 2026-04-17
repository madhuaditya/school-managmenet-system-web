import FeePaymentHistory from '../components/dashboard-menus/fees/FeePaymentHistory';

function FeePaymentHistoryPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <FeePaymentHistory />
      </div>
    </div>
  );
}

export default FeePaymentHistoryPage;
