import { useState, useEffect } from 'react';
import Table from '../_shared/Table';
import { TableSkeleton } from '../_shared/Skeleton';
import subjectService from '../../../services/dashboard-services/subjectService';

const SubjectsList = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const result = await subjectService.getSubjects();
      const subjectRows = (result?.data || []).map((subject) => ({
        _id: subject?._id,
        subjectName: subject?.name || 'N/A',
        subjectCode: subject?.code || 'N/A',
        maxMarks: subject?.maxMarks ?? 100,
        className: subject?.class?.name || 'N/A',
        teacherName: subject?.teacher?.user?.name || 'N/A',
      }));
      setSubjects(subjectRows);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'subjectName', label: 'Subject Name' },
    { key: 'subjectCode', label: 'Subject Code' },
    { key: 'maxMarks', label: 'Max Marks' },
    { key: 'className', label: 'Class' },
    { key: 'teacherName', label: 'Teacher' },
  ];

  if (loading) return <TableSkeleton />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Subjects</h1>
      </div>

      <Table columns={columns} data={subjects} />
    </div>
  );
};

export default SubjectsList;
