import StudentInfo from '../components/dashboard-menus/students/StudentInfo';

function StudentInfoPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="mx-auto w-full max-w-5xl px-4 md:px-6">
        <StudentInfo />
      </div>
    </div>
  );
}

export default StudentInfoPage;
