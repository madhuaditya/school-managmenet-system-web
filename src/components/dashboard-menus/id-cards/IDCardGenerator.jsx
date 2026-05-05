import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Upload, Users, User, Printer } from 'react-feather';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'react-toastify';
import studentService from '../../../services/dashboard-services/studentService';

const TEMPLATE_OPTIONS = [
  { id: 'template-1', label: 'Template 1 (Horizontal Classic)' },
  { id: 'template-2', label: 'Template 2 (Horizontal Modern)' },
  { id: 'template-3', label: 'Template 3 (Vertical Indigo)' },
  { id: 'template-4', label: 'Template 4 (Vertical Warm)' },
];

const DEFAULT_EDITABLE = {
  name: '',
  fatherName: '',
  motherName: '',
  rollNumber: '',
  gender: '',
  bloodGroup: '',
  dateOfBirth: '',
  parentContact: '',
  address: '',
  validUntil: '',
  classLabel: '',
};

const toInputDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const triggerPdfDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

const buildClassLabel = (selectedClass) => {
  if (!selectedClass) return '';
  return `${selectedClass.name || ''}${selectedClass.section ? ` - ${selectedClass.section}` : ''}`.trim();
};

const PreviewCard = ({ templateId, data, schoolLogo, studentPhoto, principalSignature }) => {
  const isVertical = templateId === 'template-3' || templateId === 'template-4';

  const theme = {
    'template-1': 'from-cyan-700 to-emerald-700',
    'template-2': 'from-blue-700 to-sky-600',
    'template-3': 'from-violet-700 to-indigo-700',
    'template-4': 'from-amber-700 to-orange-700',
  }[templateId] || 'from-cyan-700 to-emerald-700';

  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow ${isVertical ? 'w-64' : 'w-full max-w-md'}`}>
      <div className={`rounded-t-xl bg-linear-to-r ${theme} p-3 text-white`}>
        <div className="flex items-center gap-2">
          {schoolLogo ? (
            <img src={schoolLogo} alt="School logo" className="h-8 w-8 rounded-md object-cover border border-white/30" />
          ) : (
            <div className="h-8 w-8 rounded-md bg-white/20" />
          )}
          <div>
            <p className="text-xs uppercase tracking-wider">Student Identity Card</p>
            <p className="text-sm font-bold truncate">{data.schoolName || 'School Name'}</p>
          </div>
        </div>
      </div>

      <div className="p-3">
        <div className={`flex gap-3 ${isVertical ? 'flex-col' : ''}`}>
          {studentPhoto ? (
            <img
              src={studentPhoto}
              alt="Student"
              className={`${isVertical ? 'h-32 w-full' : 'h-28 w-24'} rounded-md border border-slate-200 object-cover`}
            />
          ) : (
            <div className={`${isVertical ? 'h-32 w-full' : 'h-28 w-24'} rounded-md border border-slate-200 bg-slate-100`} />
          )}

          <div className="min-w-0 flex-1 text-xs text-slate-700">
            <p className="text-sm font-bold text-slate-900 truncate">{data.name || 'Student Name'}</p>
            <p><span className="font-semibold">Admission:</span> {data.admissionNo || 'N/A'}</p>
            <p><span className="font-semibold">Class:</span> {data.classLabel || 'N/A'}</p>
            <p><span className="font-semibold">Roll:</span> {data.rollNumber || 'N/A'}</p>
            <p><span className="font-semibold">Gender:</span> {data.gender || 'N/A'}</p>
            <p><span className="font-semibold">DOB:</span> {data.dateOfBirth || 'N/A'}</p>
            <p><span className="font-semibold">Blood:</span> {data.bloodGroup || 'N/A'}</p>
            <p><span className="font-semibold">Valid Till:</span> {data.validUntil || 'N/A'}</p>
          </div>
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div className="h-12 w-12 rounded border border-slate-200 p-1 text-[8px] text-slate-600 overflow-hidden leading-tight">
            {data.qrText || `${data.name || ''} | ${data.admissionNo || ''}`}
          </div>
          <div className="text-right text-[10px] text-slate-600">
            {principalSignature ? (
              <img
                src={principalSignature}
                alt="Principal signature"
                className="ml-auto h-5 w-16 object-contain"
              />
            ) : null}
            <p className="border-t border-slate-400 pt-1 font-semibold">{data.principalName || 'Principal'}</p>
            <p>{data.signatureLabel || 'Principal Signature'}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-dashed border-slate-300 p-3 text-xs text-slate-600">
        <p>{data.address || 'Address'}</p>
        <p>Parent: {data.parentContact || 'N/A'}</p>
        <p>{data.schoolPhone || 'N/A'} | {data.schoolEmail || 'N/A'}</p>
      </div>
    </div>
  );
};

const IDCardGenerator = () => {
  const [classes, setClasses] = useState([]);
  const [school, setSchool] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [includeWholeClass, setIncludeWholeClass] = useState(false);
  const [templateId, setTemplateId] = useState('template-1');
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [downloadingSingle, setDownloadingSingle] = useState(false);
  const [downloadingBulk, setDownloadingBulk] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [schoolOverrides, setSchoolOverrides] = useState({
    schoolName: '',
    schoolAddress: '',
    schoolPhone: '',
    schoolEmail: '',
    logoUrl: '',
    principalName: '',
    signatureLabel: '',
    principalSignatureUrl: '',
  });

  const [studentOverridesById, setStudentOverridesById] = useState({});

  const selectedClass = useMemo(
    () => classes.find((item) => item._id === selectedClassId) || null,
    [classes, selectedClassId]
  );

  const selectedStudent = useMemo(
    () => students.find((item) => item._id === selectedStudentId) || null,
    [students, selectedStudentId]
  );

  const activeStudentOverrides = useMemo(
    () => studentOverridesById[selectedStudentId] || DEFAULT_EDITABLE,
    [studentOverridesById, selectedStudentId]
  );

  const loadClasses = useCallback(async () => {
    setLoadingClasses(true);
    try {
      const result = await studentService.getIdCardClasses();
      const classItems = result?.data?.classes || [];
      setClasses(classItems);
      setSchool(result?.data?.school || null);

      setSchoolOverrides((prev) => ({
        ...prev,
        schoolName: result?.data?.school?.schoolName || '',
        schoolAddress: result?.data?.school?.address || '',
        schoolPhone: result?.data?.school?.phone || '',
        schoolEmail: result?.data?.school?.email || '',
        logoUrl: result?.data?.school?.idCardLogo || result?.data?.school?.image || '',
        principalName: result?.data?.school?.idCardSettings?.principalName || '',
        signatureLabel: result?.data?.school?.idCardSettings?.signatureLabel || 'Principal Signature',
        principalSignatureUrl: result?.data?.school?.idCardSettings?.principalSignatureUrl || '',
      }));
    } catch (error) {
      toast.error(error?.response?.data?.msg || 'Failed to load classes');
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  const loadClassStudents = useCallback(async (classId) => {
    if (!classId) {
      setStudents([]);
      setSelectedStudentId('');
      setSelectedStudentIds([]);
      return;
    }

    setLoadingStudents(true);
    try {
      const result = await studentService.getIdCardStudentsByClass(classId);
      const classStudents = result?.data?.students || [];
      setStudents(classStudents);

      if (classStudents.length) {
        const firstStudentId = classStudents[0]._id;
        setSelectedStudentId(firstStudentId);
        setSelectedStudentIds([firstStudentId]);

        setStudentOverridesById((prev) => {
          const next = { ...prev };
          classStudents.forEach((student) => {
            if (!next[student._id]) {
              next[student._id] = {
                ...DEFAULT_EDITABLE,
                name: student.name || '',
                fatherName: student.fatherName || '',
                motherName: student.motherName || '',
                rollNumber: student.rollNumber || '',
                      gender: student.gender || '',
                bloodGroup: student.bloodGroup || '',
                dateOfBirth: toInputDate(student.dateOfBirth),
                parentContact: student.parentContact || '',
                address: student.address || '',
                validUntil: '',
                classLabel: buildClassLabel(classes.find((item) => item._id === classId)),
                studentPhoto: student.photo || '',
              };
            }
          });
          return next;
        });
      } else {
        setSelectedStudentId('');
        setSelectedStudentIds([]);
      }
    } catch (error) {
      toast.error(error?.response?.data?.msg || 'Failed to load students');
    } finally {
      setLoadingStudents(false);
    }
  }, [classes]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    if (!selectedClassId) return;
    loadClassStudents(selectedClassId);
  }, [selectedClassId, loadClassStudents]);

  const toggleStudentSelection = useCallback((studentId) => {
    setSelectedStudentIds((prev) => {
      if (prev.includes(studentId)) return prev.filter((id) => id !== studentId);
      return [...prev, studentId];
    });
  }, []);

  const onEditableStudentChange = useCallback((field, value) => {
    if (!selectedStudentId) return;
    setStudentOverridesById((prev) => ({
      ...prev,
      [selectedStudentId]: {
        ...(prev[selectedStudentId] || DEFAULT_EDITABLE),
        [field]: value,
      },
    }));
  }, [selectedStudentId]);

  const onSchoolOverrideChange = useCallback((field, value) => {
    setSchoolOverrides((prev) => ({ ...prev, [field]: value }));
  }, []);

  const uploadSchoolLogo = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const result = await studentService.uploadSchoolIdCardLogo(file);
      const logoUrl = result?.data?.logoUrl || '';
      setSchoolOverrides((prev) => ({ ...prev, logoUrl }));
      toast.success('School logo uploaded');
    } catch (error) {
      toast.error(error?.response?.data?.msg || 'Failed to upload school logo');
    } finally {
      setUploadingLogo(false);
      event.target.value = '';
    }
  }, []);

  const uploadStudentPhoto = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file || !selectedStudentId) return;

    setUploadingPhoto(true);
    try {
      const result = await studentService.uploadStudentIdCardPhoto(selectedStudentId, file);
      const photoUrl = result?.data?.photoUrl || '';

      setStudentOverridesById((prev) => ({
        ...prev,
        [selectedStudentId]: {
          ...(prev[selectedStudentId] || DEFAULT_EDITABLE),
          studentPhoto: photoUrl,
        },
      }));

      setStudents((prev) => prev.map((student) => (
        student._id === selectedStudentId ? { ...student, photo: photoUrl } : student
      )));

      toast.success('Student photo uploaded');
    } catch (error) {
      toast.error(error?.response?.data?.msg || 'Failed to upload student photo');
    } finally {
      setUploadingPhoto(false);
      event.target.value = '';
    }
  }, [selectedStudentId]);

  const convertHtmlToPdf = useCallback(async (html, templateId) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-10000px';
    iframe.style.top = '0';
    iframe.style.width = '1200px';
    iframe.style.height = '1600px';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      throw new Error('Unable to create PDF preview frame');
    }

    doc.open();
    doc.write(html);
    doc.close();

    await new Promise((resolve) => {
      const complete = () => setTimeout(resolve, 250);
      if (doc.readyState === 'complete') {
        complete();
        return;
      }
      iframe.onload = complete;
    });

    const target = doc.body;
    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: doc.documentElement.scrollWidth,
      windowHeight: doc.documentElement.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: templateId === 'template-3' || templateId === 'template-4' ? 'portrait' : 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = pageWidth;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    const blob = pdf.output('blob');
    document.body.removeChild(iframe);
    return blob;
  }, []);

  const uploadPrincipalSignature = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingSignature(true);
    try {
      const result = await studentService.uploadSchoolPrincipalSignature(file);
      const principalSignatureUrl = result?.data?.principalSignatureUrl || '';
      setSchoolOverrides((prev) => ({ ...prev, principalSignatureUrl }));
      toast.success('Principal signature uploaded');
    } catch (error) {
      toast.error(error?.response?.data?.msg || 'Failed to upload principal signature');
    } finally {
      setUploadingSignature(false);
      event.target.value = '';
    }
  }, []);

  const generateSinglePdf = useCallback(async () => {
    if (!selectedStudentId) {
      toast.warning('Select a student first');
      return;
    }

    setDownloadingSingle(true);
    try {
      const payload = {
        studentId: selectedStudentId,
        templateId,
        schoolOverrides,
        studentOverrides: studentOverridesById[selectedStudentId] || {},
      };

      const result = await studentService.generateSingleIdCardHtml(payload);
      const html = result?.data?.html || '';
      const pdfBlob = await convertHtmlToPdf(html, templateId);
      const admission = selectedStudent?.admissionNo || selectedStudentId;
      triggerPdfDownload(pdfBlob, `id-card-${admission}.pdf`);
      toast.success('ID card downloaded');
    } catch (error) {
      toast.error(error?.response?.data?.msg || 'Failed to generate ID card');
    } finally {
      setDownloadingSingle(false);
    }
  }, [selectedStudentId, templateId, schoolOverrides, studentOverridesById, selectedStudent]);

  const generateBulkPdf = useCallback(async () => {
    if (!selectedClassId) {
      toast.warning('Select class first');
      return;
    }

    if (!includeWholeClass && !selectedStudentIds.length) {
      toast.warning('Select at least one student or choose whole class');
      return;
    }

    setDownloadingBulk(true);
    try {
      const payload = {
        templateId,
        classId: selectedClassId,
        includeWholeClass,
        studentIds: includeWholeClass ? [] : selectedStudentIds,
        schoolOverrides,
        overridesByStudent: studentOverridesById,
      };

      const result = await studentService.generateBulkIdCardHtml(payload);
      const html = result?.data?.html || '';
      const pdfBlob = await convertHtmlToPdf(html, templateId);
      triggerPdfDownload(pdfBlob, `id-cards-${selectedClass?.name || 'class'}.pdf`);
      toast.success('Merged PDF downloaded');
    } catch (error) {
      toast.error(error?.response?.data?.msg || 'Failed to generate bulk ID cards');
    } finally {
      setDownloadingBulk(false);
    }
  }, [selectedClassId, includeWholeClass, selectedStudentIds, templateId, schoolOverrides, studentOverridesById, selectedClass]);

  const previewData = useMemo(() => {
    const student = selectedStudent;
    const override = selectedStudentId ? (studentOverridesById[selectedStudentId] || {}) : {};

    return {
      schoolName: schoolOverrides.schoolName || school?.schoolName || 'School Name',
      schoolPhone: schoolOverrides.schoolPhone || school?.phone || '',
      schoolEmail: schoolOverrides.schoolEmail || school?.email || '',
      schoolAddress: schoolOverrides.schoolAddress || school?.address || '',
      principalName: schoolOverrides.principalName || school?.idCardSettings?.principalName || 'Principal',
      signatureLabel: schoolOverrides.signatureLabel || school?.idCardSettings?.signatureLabel || 'Principal Signature',
      admissionNo: student?.admissionNo || '',
      name: override.name || student?.name || '',
      classLabel: override.classLabel || buildClassLabel(selectedClass),
      rollNumber: override.rollNumber || student?.rollNumber || '',
      gender: override.gender || student?.gender || '',
      dateOfBirth: override.dateOfBirth || toInputDate(student?.dateOfBirth),
      bloodGroup: override.bloodGroup || student?.bloodGroup || '',
      parentContact: override.parentContact || student?.parentContact || '',
      address: override.address || student?.address || '',
      validUntil: override.validUntil || '',
      qrText: `${override.name || student?.name || 'N/A'} | ${student?.admissionNo || 'N/A'} | ${buildClassLabel(selectedClass) || 'N/A'}`,
    };
  }, [selectedStudent, selectedStudentId, studentOverridesById, schoolOverrides, school, selectedClass]);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Student ID Card Generator</h2>
        <p className="text-sm text-slate-600 mt-1">
          Select class and students, choose a template, edit details, preview front/back, then download single or merged PDF.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">1) Class and Student Selection</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Class</label>
                <select
                  value={selectedClassId}
                  onChange={(event) => setSelectedClassId(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  disabled={loadingClasses}
                >
                  <option value="">Select class</option>
                  {classes.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.label} ({item.studentCount})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Primary student (for single PDF/editing)</label>
                <select
                  value={selectedStudentId}
                  onChange={(event) => setSelectedStudentId(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  disabled={loadingStudents || !students.length}
                >
                  <option value="">Select student</option>
                  {students.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.name} | Roll: {student.rollNumber || 'N/A'} | Adm: {student.admissionNo || 'N/A'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-200 p-2">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={includeWholeClass}
                  onChange={(event) => setIncludeWholeClass(event.target.checked)}
                />
                Generate for full class ({selectedClass?.studentCount || 0} students)
              </label>
              <span className="text-xs text-slate-500">{loadingStudents ? 'Loading students...' : `${students.length} students loaded`}</span>
            </div>

            <div className="mt-3 max-h-44 overflow-y-auto rounded-lg border border-slate-200 p-2">
              <p className="text-xs font-medium text-slate-700 mb-2">Bulk selection</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {students.map((student) => (
                  <label key={student._id} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.includes(student._id)}
                      onChange={() => toggleStudentSelection(student._id)}
                      disabled={includeWholeClass}
                    />
                    <span className="truncate">{student.name} ({student.rollNumber || 'N/A'})</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">2) Template</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {TEMPLATE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTemplateId(option.id)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm ${templateId === option.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">3) Editable Data</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Student Name</label>
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={activeStudentOverrides.name || ''} onChange={(event) => onEditableStudentChange('name', event.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Father Name</label>
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={activeStudentOverrides.fatherName || ''} onChange={(event) => onEditableStudentChange('fatherName', event.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Mother Name</label>
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={activeStudentOverrides.motherName || ''} onChange={(event) => onEditableStudentChange('motherName', event.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Class Label</label>
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={activeStudentOverrides.classLabel || buildClassLabel(selectedClass)} onChange={(event) => onEditableStudentChange('classLabel', event.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Roll Number</label>
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={activeStudentOverrides.rollNumber || ''} onChange={(event) => onEditableStudentChange('rollNumber', event.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Gender</label>
                <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={activeStudentOverrides.gender || ''} onChange={(event) => onEditableStudentChange('gender', event.target.value)}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Blood Group</label>
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={activeStudentOverrides.bloodGroup || ''} onChange={(event) => onEditableStudentChange('bloodGroup', event.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Date of Birth</label>
                <input type="date" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={activeStudentOverrides.dateOfBirth || ''} onChange={(event) => onEditableStudentChange('dateOfBirth', event.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Valid Until</label>
                <input type="date" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={activeStudentOverrides.validUntil || ''} onChange={(event) => onEditableStudentChange('validUntil', event.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Parent Contact</label>
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={activeStudentOverrides.parentContact || ''} onChange={(event) => onEditableStudentChange('parentContact', event.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Address</label>
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={activeStudentOverrides.address || ''} onChange={(event) => onEditableStudentChange('address', event.target.value)} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">4) School Branding and Uploads</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">School Name</label>
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={schoolOverrides.schoolName || ''} onChange={(event) => onSchoolOverrideChange('schoolName', event.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">School Phone</label>
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={schoolOverrides.schoolPhone || ''} onChange={(event) => onSchoolOverrideChange('schoolPhone', event.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">School Email</label>
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={schoolOverrides.schoolEmail || ''} onChange={(event) => onSchoolOverrideChange('schoolEmail', event.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Principal Name</label>
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={schoolOverrides.principalName || ''} onChange={(event) => onSchoolOverrideChange('principalName', event.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-slate-700 block mb-1">School Address</label>
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={schoolOverrides.schoolAddress || ''} onChange={(event) => onSchoolOverrideChange('schoolAddress', event.target.value)} />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <Upload size={14} />
                {uploadingLogo ? 'Uploading logo...' : 'Upload school logo'}
                <input type="file" accept="image/*" className="hidden" onChange={uploadSchoolLogo} disabled={uploadingLogo} />
              </label>

              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <Upload size={14} />
                {uploadingPhoto ? 'Uploading photo...' : 'Upload selected student photo'}
                <input type="file" accept="image/*" className="hidden" onChange={uploadStudentPhoto} disabled={!selectedStudentId || uploadingPhoto} />
              </label>

              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <Upload size={14} />
                {uploadingSignature ? 'Uploading signature...' : 'Upload principal signature'}
                <input type="file" accept="image/*" className="hidden" onChange={uploadPrincipalSignature} disabled={uploadingSignature} />
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">5) Download</h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={generateSinglePdf}
                disabled={!selectedStudentId || downloadingSingle}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <User size={14} />
                <Download size={14} />
                {downloadingSingle ? 'Generating...' : 'Download Single PDF'}
              </button>

              <button
                type="button"
                onClick={generateBulkPdf}
                disabled={downloadingBulk || (!includeWholeClass && !selectedStudentIds.length)}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <Users size={14} />
                <Printer size={14} />
                {downloadingBulk ? 'Generating...' : 'Download Merged PDF'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Live Preview (Front + Back)</h3>
            <PreviewCard
              templateId={templateId}
              data={previewData}
              schoolLogo={schoolOverrides.logoUrl || school?.idCardLogo || school?.image || ''}
              studentPhoto={activeStudentOverrides.studentPhoto || selectedStudent?.photo || ''}
              principalSignature={schoolOverrides.principalSignatureUrl || school?.idCardSettings?.principalSignatureUrl || ''}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default IDCardGenerator;
