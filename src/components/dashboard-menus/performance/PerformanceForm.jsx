import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import apiClient from '../../../services/apiClient';

const currentAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const start = month >= 4 ? year : year - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
};

const getRoleValue = (role) => {
  if (!role) return null;
  if (typeof role === 'string') return role;
  return role?.role || null;
};

const getYears = () => {
  const now = new Date().getFullYear();
  return Array.from({ length: 6 }).map((_, idx) => {
    const start = now - idx;
    return `${start}-${String(start + 1).slice(-2)}`;
  });
};

const PerformanceForm = ({ targetId }) => {
  const { id: routeId } = useParams();
  const profile = useAuthStore((state) => state.profile);

  const role = getRoleValue(profile?.role);
  const ownUserId = profile?._id || '';
  const selectedId = routeId || targetId || ownUserId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [year, setYear] = useState(currentAcademicYear());
  const [student, setStudent] = useState(null);
  const [items, setItems] = useState([]);

  const yearOptions = useMemo(() => getYears(), []);

  const filteredItems = useMemo(() => {
    if (!year) return items;
    return items.filter((item) => item?.academicYear === year);
  }, [items, year]);

  const totals = useMemo(() => {
    if (filteredItems.length === 0) {
      return { count: 0, avg: 0 };
    }

    const sum = filteredItems.reduce((acc, item) => {
      const percentage =
        typeof item?.percentage === 'number'
          ? item.percentage
          : item?.totalMarks
          ? (Number(item.marksObtained || 0) / Number(item.totalMarks || 1)) * 100
          : 0;
      return acc + percentage;
    }, 0);

    return {
      count: filteredItems.length,
      avg: Number((sum / filteredItems.length).toFixed(2)),
    };
  }, [filteredItems]);

  useEffect(() => {
    if (!selectedId) {
      setLoading(false);
      setError('Performance id is missing.');
      return;
    }

    if (!['student', 'admin', 'teacher'].includes(role)) {
      setLoading(false);
      setError('You are not allowed to view performance records.');
      return;
    }

    if (routeId && ownUserId && routeId !== ownUserId) {
      if (role !== 'student') {
        loadData();
        return;
      }

      setLoading(false);
      setError('You can only view your own performance.');
      return;
    }

    loadData();
  }, [selectedId, role, routeId, ownUserId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [studentRes, perfRes] = await Promise.all([
        apiClient.get(`/api/student/${selectedId}`),
        apiClient.get(`/api/progress/student/${selectedId}`),
      ]);

      if (!studentRes?.data?.success) {
        throw new Error(studentRes?.data?.msg || 'Unable to load student profile');
      }

      if (!perfRes?.data?.success) {
        throw new Error(perfRes?.data?.msg || 'Unable to load performance records');
      }

      setStudent(studentRes?.data?.data || null);
      setItems(Array.isArray(perfRes?.data?.data) ? perfRes.data.data : []);
    } catch (err) {
      setError(err?.message || 'Failed to load performance');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-600">
        Loading performance...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-white to-slate-50 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Performance</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{student?.name || 'Student'}</h1>
        <p className="text-sm text-slate-600">
          Student ID: {student?.studentId || 'N/A'} | Roll: {student?.rollNumber ?? 'N/A'}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:w-72">
          <div className="rounded-xl bg-emerald-50 px-3 py-2">
            <p className="text-xs text-emerald-700">Records</p>
            <p className="text-lg font-bold text-emerald-700">{totals.count}</p>
          </div>
          <div className="rounded-xl bg-sky-50 px-3 py-2">
            <p className="text-xs text-sky-700">Average</p>
            <p className="text-lg font-bold text-sky-700">{totals.avg}%</p>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-2 text-sm font-semibold text-slate-800">Academic Year</p>
        <div className="flex flex-wrap gap-2">
          {yearOptions.map((yearItem) => {
            const isSelected = year === yearItem;
            return (
              <button
                key={yearItem}
                type="button"
                onClick={() => setYear(yearItem)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  isSelected
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {yearItem}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-bold text-slate-900">Performance Records</h2>

        {filteredItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
            No performance records for {year}.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const percentage =
                typeof item?.percentage === 'number'
                  ? item.percentage
                  : item?.totalMarks
                  ? (Number(item.marksObtained || 0) / Number(item.totalMarks || 1)) * 100
                  : 0;

              return (
                <article
                  key={item._id}
                  className="rounded-xl border border-slate-200 bg-linear-to-br from-white to-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{item?.title || 'Untitled'}</h3>
                      <p className="text-xs text-slate-600">
                        {(item?.subject?.name || 'Subject')} • {(item?.type || 'exam').toUpperCase()} • {item?.academicYear || 'N/A'}
                      </p>
                    </div>
                    <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-bold text-sky-700">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-700">
                    Score: {item?.marksObtained ?? 0} / {item?.totalMarks ?? 0}
                  </p>
                  {item?.remarks ? (
                    <p className="mt-1 text-sm text-slate-600">Remarks: {item.remarks}</p>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default PerformanceForm;
