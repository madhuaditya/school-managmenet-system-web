import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Search, Users, BookOpen, Award } from 'react-feather';
import { TableSkeleton } from '../_shared/Skeleton';
import subjectService from '../../../services/dashboard-services/subjectService';
import SubjectDetailView from './SubjectDetailView';

const currentAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const start = month >= 4 ? year : year - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
};

const SubjectsList = ({ targetId, setTargetId }) => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchDashboardSubjects();
  }, []);

  const fetchDashboardSubjects = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await subjectService.getSubjectDashboard();
      const rows = Array.isArray(result?.data) ? result.data : [];
      setSubjects(rows);
    } catch (fetchError) {
      setError(fetchError?.response?.data?.msg || fetchError?.message || 'Error fetching subjects');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return subjects;
    return subjects.filter((subject) => {
      const name = String(subject?.name || '').toLowerCase();
      const code = String(subject?.code || '').toLowerCase();
      const teacher = String(subject?.teacher?.user?.name || '').toLowerCase();
      const className = String(subject?.class?.name || '').toLowerCase();
      return name.includes(term) || code.includes(term) || teacher.includes(term) || className.includes(term);
    });
  }, [search, subjects]);

  if (targetId) {
    return <SubjectDetailView subjectId={targetId} setTargetId={setTargetId} />;
  }

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Subjects Dashboard</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Subjects</h1>
            <p className="mt-2 text-sm text-slate-500">View subject-level performance, exam structures, and bulk marks entry from one place.</p>
          </div>

          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search subjects, teachers, or classes"
              className="w-72 max-w-full bg-transparent text-sm outline-none"
            />
          </label>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Subjects</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{subjects.length}</p>
              </div>
              <div className="rounded-2xl bg-blue-600/10 p-3 text-blue-700"><BookOpen size={18} /></div>
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Visible Rows</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{filteredSubjects.length}</p>
              </div>
              <div className="rounded-2xl bg-emerald-600/10 p-3 text-emerald-700"><Users size={18} /></div>
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Academic Year</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{currentAcademicYear()}</p>
              </div>
              <div className="rounded-2xl bg-amber-600/10 p-3 text-amber-700"><Award size={18} /></div>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Subject</th>
                <th className="px-5 py-4">Teacher</th>
                <th className="px-5 py-4">Class</th>
                <th className="px-5 py-4">Students</th>
                <th className="px-5 py-4">Exams</th>
                <th className="px-5 py-4">Average</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredSubjects.map((subject) => (
                <tr key={subject._id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">{subject?.name || 'N/A'}</p>
                      <p className="text-xs text-slate-500">{subject?.code || 'No code'}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-700">{subject?.teacher?.user?.name || 'N/A'}</td>
                  <td className="px-5 py-4 text-slate-700">{subject?.class?.name || 'N/A'}</td>
                  <td className="px-5 py-4 text-slate-700">{subject?.studentCount ?? 0}</td>
                  <td className="px-5 py-4 text-slate-700">{subject?.examCount ?? 0}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {Number(subject?.averagePercentage || 0).toFixed(2)}% · {subject?.grade || 'Fail'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => setTargetId?.(subject._id)}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      View More <ArrowRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {!filteredSubjects.length ? (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-slate-500">
                    No subjects found for the current filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SubjectsList;
