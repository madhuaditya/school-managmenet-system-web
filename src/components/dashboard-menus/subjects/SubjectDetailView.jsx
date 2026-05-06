import { useCallback, useEffect, useMemo, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReactModule from 'highcharts-react-official';
import { ArrowLeft, BookOpen, CheckCircle, Edit3, Save, Search, Users } from 'react-feather';
import subjectService from '../../../services/dashboard-services/subjectService';
import progressService from '../../../services/dashboard-services/progressService';

const HighchartsReact = HighchartsReactModule?.default || HighchartsReactModule;

const currentAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const start = month >= 4 ? year : year - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
};

const academicYearOptions = () => {
  const year = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, index) => {
    const start = year - index;
    return `${start}-${String(start + 1).slice(-2)}`;
  });
};

const normalizeNumber = (value) => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
};

const getGradeColor = (grade) => {
  switch (grade) {
    case 'A+': return '#16a34a';
    case 'A': return '#15803d';
    case 'B': return '#0891b2';
    case 'C': return '#ca8a04';
    case 'D': return '#ea580c';
    default: return '#dc2626';
  }
};

const typeOptions = [
  { value: 'exam', label: 'Exam' },
  { value: 'test', label: 'Test' },
  { value: 'assignment', label: 'Assignment' },
];

const emptyBulkRow = (student, existing = {}) => ({
  studentId: student?._id || '',
  progressId: existing?.progressId || existing?._id || null,
  name: student?.user?.name || 'Unknown',
  rollNumber: student?.rollNumber || '-',
  marksObtained: existing?.marksObtained ?? '',
  totalMarks: existing?.totalMarks ?? '',
  remarks: existing?.remarks || '',
});

function SubjectDetailView({ subjectId, setTargetId }) {
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedType, setSelectedType] = useState('exam');
  const [selectedTitle, setSelectedTitle] = useState('');
  const [manualTotalMarks, setManualTotalMarks] = useState('100');
  const [bulkRows, setBulkRows] = useState([]);

  const loadDetail = useCallback(async () => {
    if (!subjectId) return;

    setLoading(true);
    setError('');

    try {
      const response = await subjectService.getSubjectDetails(subjectId, academicYear);
      const data = response?.data || response;
      setDetail(data);
      setSelectedExamId('');
      setBulkRows([]);
      setSelectedType('exam');
      setSelectedTitle(data?.subject?.name || '');
      setManualTotalMarks(String(data?.subject?.maxMarks || 100));
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || 'Failed to load subject details');
    } finally {
      setLoading(false);
    }
  }, [academicYear, subjectId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const subject = detail?.subject || null;
  const students = Array.isArray(detail?.students) ? detail.students : [];
  const exams = Array.isArray(detail?.exams) ? detail.exams : [];
  const progress = Array.isArray(detail?.progress) ? detail.progress : [];
  const ranking = Array.isArray(detail?.ranking) ? detail.ranking : [];

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return students;
    return students.filter((student) => {
      const name = student?.user?.name?.toLowerCase() || '';
      const roll = String(student?.rollNumber || '').toLowerCase();
      const studentCode = String(student?.studentId || '').toLowerCase();
      return name.includes(term) || roll.includes(term) || studentCode.includes(term);
    });
  }, [search, students]);

  const stats = detail?.stats || {};

  const gradeDistribution = useMemo(() => {
    const counts = { 'A+': 0, A: 0, B: 0, C: 0, D: 0, Fail: 0 };
    progress.forEach((record) => {
      counts[record.grade || 'Fail'] = (counts[record.grade || 'Fail'] || 0) + 1;
    });

    return {
      chart: { type: 'pie', backgroundColor: 'transparent' },
      title: { text: 'Grade Distribution' },
      series: [{
        name: 'Records',
        data: Object.entries(counts).map(([grade, count]) => ({ name: grade, y: count, color: getGradeColor(grade) })),
      }],
      credits: { enabled: false },
    };
  }, [progress]);

  const examTrend = useMemo(() => {
    const buckets = new Map();
    progress.forEach((record) => {
      const key = record.exam?.name || record.title || 'Assessment';
      if (!buckets.has(key)) {
        buckets.set(key, { total: 0, obtained: 0, count: 0 });
      }
      const bucket = buckets.get(key);
      bucket.total += normalizeNumber(record.totalMarks);
      bucket.obtained += normalizeNumber(record.marksObtained);
      bucket.count += 1;
    });

    const items = Array.from(buckets.entries()).map(([label, bucket]) => ({
      label,
      percentage: bucket.total ? Number(((bucket.obtained / bucket.total) * 100).toFixed(2)) : 0,
    }));

    return {
      chart: { type: 'column', backgroundColor: 'transparent' },
      title: { text: 'Assessment Average' },
      xAxis: { categories: items.map((item) => item.label) },
      yAxis: { min: 0, max: 100, title: { text: 'Average %' } },
      series: [{ name: 'Average %', data: items.map((item) => item.percentage), color: '#2563eb' }],
      credits: { enabled: false },
    };
  }, [progress]);

  const topPerformers = useMemo(() => ({
    chart: { type: 'bar', backgroundColor: 'transparent' },
    title: { text: 'Top Performers' },
    xAxis: { categories: ranking.slice(0, 8).map((item) => item.student?.user?.name || item.student?.studentId || 'Student') },
    yAxis: { min: 0, max: 100, title: { text: 'Percentage' } },
    series: [{ name: 'Percentage', data: ranking.slice(0, 8).map((item) => normalizeNumber(item.percentage)), color: '#0891b2' }],
    credits: { enabled: false },
  }), [ranking]);

  const belowThresholdCount = useMemo(() => progress.filter((record) => normalizeNumber(record.percentage) < 50).length, [progress]);

  const setTemplateRowsFromResponse = useCallback((responseData) => {
    const rows = Array.isArray(responseData?.rows) ? responseData.rows : [];
    setBulkRows(rows.map((row) => ({
      studentId: row?.student?._id || row?.studentId || '',
      progressId: row?.progressId || row?._id || null,
      name: row?.student?.user?.name || row?.name || 'Unknown',
      rollNumber: row?.student?.rollNumber || row?.rollNumber || '-',
      marksObtained: row?.marksObtained ?? '',
      totalMarks: row?.totalMarks ?? '',
      remarks: row?.remarks || '',
    })));
    setSelectedTitle(responseData?.exam?.name || selectedTitle);
    setSelectedType('exam');
    setManualTotalMarks(String(responseData?.exam?.totalMarks || manualTotalMarks || 100));
  }, [manualTotalMarks, selectedTitle]);

  const loadExamTemplate = useCallback(async (examId) => {
    if (!examId) {
      setSelectedExamId('');
      setBulkRows([]);
      return;
    }

    setLoadingTemplate(true);
    setError('');
    try {
      const response = await progressService.getExamProgressTemplate(examId, academicYear);
      const data = response?.data || response;
      setSelectedExamId(examId);
      setTemplateRowsFromResponse(data);
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || 'Failed to load exam template');
    } finally {
      setLoadingTemplate(false);
    }
  }, [academicYear, setTemplateRowsFromResponse]);

  const prepareManualRows = () => {
    setSelectedExamId('');
    setBulkRows(filteredStudents.map((student) => emptyBulkRow(student, {
      totalMarks: manualTotalMarks || subject?.maxMarks || 100,
    })));
  };

  const updateBulkRow = (index, field, value) => {
    setBulkRows((currentRows) => currentRows.map((row, rowIndex) => (
      rowIndex === index ? { ...row, [field]: value } : row
    )));
  };

  const saveBulkMarks = async () => {
    if (!subject) return;

    const rows = bulkRows
      .filter((row) => row.studentId)
      .map((row) => ({
        studentId: row.studentId,
        progressId: row.progressId,
        marksObtained: row.marksObtained,
        totalMarks: selectedExamId ? row.totalMarks || manualTotalMarks : row.totalMarks || manualTotalMarks,
        remarks: row.remarks,
      }));

    if (!rows.length) {
      setError('No valid rows to save');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        subjectId: subject._id,
        academicYear,
        type: selectedType,
        title: selectedTitle,
        classId: subject.class?._id || subject.class,
        rows,
      };

      if (selectedExamId) {
        payload.examId = selectedExamId;
        payload.type = 'exam';
        payload.title = selectedTitle || exams.find((exam) => exam._id === selectedExamId)?.name || 'Exam';
      }

      const response = await progressService.bulkCreateProgress(payload);
      const data = response?.data || response;
      setSuccess(data?.msg || 'Bulk marks saved successfully');
      await loadDetail();
      if (selectedExamId) {
        await loadExamTemplate(selectedExamId);
      }
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || 'Failed to save bulk marks');
    } finally {
      setSaving(false);
    }
  };

  const statsCards = useMemo(() => ([
    { label: 'Students', value: stats.totalStudents ?? students.length, icon: Users },
    { label: 'Exams', value: stats.totalExams ?? exams.length, icon: BookOpen },
    { label: 'Assessments', value: stats.totalProgress ?? progress.length, icon: Edit3 },
    { label: 'Below 50%', value: belowThresholdCount, icon: CheckCircle },
  ]), [belowThresholdCount, exams.length, progress.length, stats.totalExams, stats.totalProgress, stats.totalStudents, students.length]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
        <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="font-semibold">{error}</p>
        <button type="button" onClick={() => setTargetId('')} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white">
          <ArrowLeft size={16} /> Back to subjects
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <button type="button" onClick={() => setTargetId('')} className="mb-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <ArrowLeft size={16} /> Back
            </button>
            <h2 className="text-2xl font-bold text-slate-900">{subject?.name || 'Subject'}</h2>
            <p className="text-sm text-slate-500">
              {subject?.code || 'No code'} · {subject?.class?.name || '-'} · Teacher: {subject?.teacher?.user?.name || 'N/A'}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Academic Year</span>
              <select value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none">
                {academicYearOptions().map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </label>
            <label className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Exam</span>
              <select value={selectedExamId} onChange={(event) => loadExamTemplate(event.target.value)} className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none">
                <option value="">Manual / No exam selected</option>
                {exams.map((exam) => (
                  <option key={exam._id} value={exam._id}>{exam.name} · {exam.term || 'Term'}</option>
                ))}
              </select>
            </label>
            <label className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Type</span>
              <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)} disabled={selectedExamId} className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none disabled:opacity-60">
                {typeOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-4">
          {statsCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
                  </div>
                  <div className="rounded-2xl bg-blue-600/10 p-3 text-blue-700">
                    <Icon size={18} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : null}
      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Bulk Marks Editor</h3>
                <p className="text-sm text-slate-500">Select an exam to prefill rows or load the class manually for tests and assignments.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={prepareManualRows} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <Users size={16} /> Load Manual Rows
                </button>
                <button type="button" onClick={saveBulkMarks} disabled={saving || loadingTemplate || !bulkRows.length} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                  <Save size={16} /> {saving ? 'Saving...' : 'Save Bulk Marks'}
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="rounded-2xl border border-slate-200 p-3">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Title</span>
                <input
                  value={selectedTitle}
                  onChange={(event) => setSelectedTitle(event.target.value)}
                  placeholder="Unit Test 1 / Homework / Mid Term"
                  className="w-full border-0 bg-transparent text-sm font-semibold text-slate-900 outline-none"
                />
              </label>
              <label className="rounded-2xl border border-slate-200 p-3">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Total Marks</span>
                <input
                  type="number"
                  min="1"
                  value={manualTotalMarks}
                  onChange={(event) => setManualTotalMarks(event.target.value)}
                  className="w-full border-0 bg-transparent text-sm font-semibold text-slate-900 outline-none"
                />
              </label>
            </div>

            <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Roll No.</th>
                    <th className="px-4 py-3">Marks Obtained</th>
                    <th className="px-4 py-3">Total Marks</th>
                    <th className="px-4 py-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {bulkRows.length ? bulkRows.map((row, index) => (
                    <tr key={`${row.studentId || index}`}>
                      <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                      <td className="px-4 py-3 text-slate-500">{row.rollNumber}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          value={row.marksObtained}
                          onChange={(event) => updateBulkRow(index, 'marksObtained', event.target.value)}
                          className="w-28 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="1"
                          value={row.totalMarks || manualTotalMarks}
                          onChange={(event) => updateBulkRow(index, 'totalMarks', event.target.value)}
                          className="w-28 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          value={row.remarks}
                          onChange={(event) => updateBulkRow(index, 'remarks', event.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                          placeholder="Optional remarks"
                        />
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="px-4 py-10 text-center text-slate-500">
                        {loadingTemplate ? 'Loading exam template...' : 'Pick an exam or load manual rows to start bulk editing.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <HighchartsReact highcharts={Highcharts} options={gradeDistribution} />
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <HighchartsReact highcharts={Highcharts} options={examTrend} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <HighchartsReact highcharts={Highcharts} options={topPerformers} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Search size={16} className="text-slate-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search students by name, roll, or code"
                className="w-full border-0 bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Students</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{filteredStudents.length}</span>
            </div>
            <div className="space-y-3 max-h-105 overflow-y-auto pr-1">
              {filteredStudents.map((student) => {
                const summary = progress.find((item) => item.student?._id === student._id);
                return (
                  <div key={student._id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{student?.user?.name || 'Unnamed Student'}</p>
                        <p className="text-sm text-slate-500">Roll {student.rollNumber} · {student.studentId || 'No code'}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-semibold text-slate-900">{summary ? `${normalizeNumber(summary.percentage).toFixed(2)}%` : '-'}</p>
                        <p className="text-slate-500">{summary?.grade || 'No marks'}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-slate-900">Exams</h3>
            <div className="space-y-3">
              {exams.map((exam) => (
                <button
                  type="button"
                  key={exam._id}
                  onClick={() => loadExamTemplate(exam._id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${selectedExamId === exam._id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{exam.name}</p>
                      <p className="text-xs text-slate-500">{exam.term || 'Term'} · {exam.academicYear}</p>
                    </div>
                    <span className="text-xs font-semibold text-blue-700">{normalizeNumber(exam.totalMarks)} marks</span>
                  </div>
                </button>
              ))}
              {!exams.length ? <p className="text-sm text-slate-500">No exams found for this subject.</p> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubjectDetailView;
