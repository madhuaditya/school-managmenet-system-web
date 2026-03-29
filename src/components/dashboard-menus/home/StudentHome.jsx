import { useEffect, useMemo, useState } from 'react';
import { BookOpen } from 'react-feather';
import Card from '../_shared/Card';
import { CardSkeleton } from '../_shared/Skeleton';
import NoticeSection from './NoticeSection';
import { useAuthStore } from '../../../stores/authStore';
import studentService from '../../../services/dashboard-services/studentService';
import subjectService from '../../../services/dashboard-services/subjectService';

const StudentHome = () => {
  const profile = useAuthStore((state) => state.profile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [student, setStudent] = useState(null);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    const loadStudentDashboard = async () => {
      const studentUserId = profile?._id;
      if (!studentUserId) {
        setError('Student profile not found. Please login again.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const studentResponse = await studentService.getStudent(studentUserId);
        if (!studentResponse?.success || !studentResponse?.data) {
          throw new Error(studentResponse?.msg || 'Failed to fetch student data');
        }

        const studentData = studentResponse.data;
        setStudent(studentData);

        const classId = studentData?.class?._id;
        if (!classId) {
          setSubjects([]);
          return;
        }

        const subjectResponse = await subjectService.getSubjectsByClass(classId);
        if (!subjectResponse?.success) {
          throw new Error(subjectResponse?.msg || 'Failed to fetch class subjects');
        }

        const classSubjects = Array.isArray(subjectResponse?.data) ? subjectResponse.data : [];
        const studentSubjects = classSubjects.map((subject) => ({
          _id: subject?._id,
          name: subject?.name || 'Subject',
          code: subject?.code || '',
        }));

        setSubjects(studentSubjects);
      } catch (err) {
        setError(err?.message || 'Could not load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadStudentDashboard();
  }, [profile?._id]);

  const classLabel = useMemo(() => {
    if (!student?.class) return 'Not Assigned';
    const className = student?.class?.name || '';
    const classSection = student?.class?.section || '';
    return `${className} ${classSection}`.trim() || 'Not Assigned';
  }, [student]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((item) => (
          <CardSkeleton key={item} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Student Dashboard</h1>

      {error ? (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          title="My Class"
          value={classLabel}
          icon={BookOpen}
          bgColor="bg-blue-50"
          textColor="text-blue-600"
        />
        <Card
          title="My Subjects"
          value={String(subjects.length)}
          icon={BookOpen}
          bgColor="bg-green-50"
          textColor="text-green-600"
        />
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">My Subjects</h2>
          {subjects.length === 0 ? (
            <p className="text-sm text-gray-500">No subjects assigned yet.</p>
          ) : (
            <ul className="space-y-3 text-gray-600">
              {subjects.map((subject) => (
                <li key={subject?._id} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                  <span>{subject?.name || 'Subject'}</span>
                  <span className="font-semibold text-blue-600">{subject?.code || 'N/A'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <NoticeSection />
      </div>
    </div>
  );
};

export default StudentHome;
