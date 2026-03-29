import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BarChart2, Calendar } from 'react-feather';
import { useNavigate, useParams } from 'react-router-dom';
import { getStudentPerformanceRoute, ROUTES } from '../../../constants/routes';
import studentService from '../../../services/dashboard-services/studentService';

const InfoSection = ({ title, children }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <h2 className="mb-3 text-base font-bold text-slate-900">{title}</h2>
    <div className="space-y-1">{children}</div>
  </section>
);

const InfoRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-3 border-b border-slate-100 py-2 last:border-b-0">
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <p className="text-right text-sm font-semibold text-slate-800">{value || 'N/A'}</p>
  </div>
);

const StudentInfo = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchStudent();
    } else {
      setLoading(false);
      setError('Student id is missing in route.');
    }
  }, [id]);

  const formatDate = (value) => {
    if (!value) return undefined;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const attendanceUserId = useMemo(() => {
    if (!student) return '';
    return student?.user?._id || '';
  }, [student]);

  const fetchStudent = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await studentService.getStudent(id);
      if (!response?.success || !response?.data) {
        throw new Error(response?.msg || 'Failed to fetch student info');
      }
      setStudent(response.data);
    } catch (err) {
      setError(err?.message || 'Failed to fetch student info');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
        Loading student info...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        {error}
      </div>
    );
  }

  if (!student) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
        Student not found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => navigate(ROUTES.dashboard)}
        className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800"
      >
        <ArrowLeft size={15} /> Back To Dashboard
      </button>

      <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-white to-slate-50 p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{student?.name || 'Student Profile'}</h1>
        <p className="mt-1 text-sm text-slate-600">Student ID Route: {id}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InfoSection title="Personal Information">
          <InfoRow label="Name" value={student?.name} />
          <InfoRow label="Email" value={student?.email} />
          <InfoRow label="Phone" value={student?.phone} />
          <InfoRow label="Gender" value={student?.gender} />
          <InfoRow label="Date of Birth" value={formatDate(student?.dateOfBirth)} />
        </InfoSection>

        <InfoSection title="Academic Information">
          <InfoRow label="Student ID" value={student?.studentId} />
          <InfoRow
            label="Roll Number"
            value={student?.rollNumber != null ? String(student.rollNumber) : undefined}
          />
          <InfoRow label="Class" value={student?.class?.name} />
          <InfoRow label="Grade" value={student?.class?.grade} />
          <InfoRow label="Section" value={student?.class?.section} />
          <InfoRow label="Date of Admission" value={formatDate(student?.dateOfAdmission)} />
          <InfoRow label="Status" value={student?.status} />
        </InfoSection>
      </div>

      {(student?.address || student?.city || student?.state || student?.pinCode) && (
        <InfoSection title="Address">
          <InfoRow label="Address" value={student?.address} />
          <InfoRow label="City" value={student?.city} />
          <InfoRow label="State" value={student?.state} />
          <InfoRow label="Pin Code" value={student?.pinCode} />
        </InfoSection>
      )}

      {(student?.fatherName || student?.motherName || student?.parentContact) && (
        <InfoSection title="Parent Information">
          <InfoRow label="Father Name" value={student?.fatherName} />
          <InfoRow label="Mother Name" value={student?.motherName} />
          <InfoRow label="Parent Contact" value={student?.parentContact} />
        </InfoSection>
      )}

      <InfoSection title="Account Information">
        <InfoRow
          label="Member Since"
          value={student?.createdAt ? new Date(student.createdAt).toLocaleDateString() : undefined}
        />
      </InfoSection>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => {
            if (!attendanceUserId) return;
            navigate(`${ROUTES.dashboard}?menu=attendance&id=${attendanceUserId}`);
          }}
          disabled={!attendanceUserId}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Calendar size={16} /> View Monthly Attendance
        </button>

        <button
          type="button"
          onClick={() => navigate(getStudentPerformanceRoute(id))}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
        >
          <BarChart2 size={16} /> Show Performance
        </button>
      </div>
    </div>
  );
};

export default StudentInfo;
