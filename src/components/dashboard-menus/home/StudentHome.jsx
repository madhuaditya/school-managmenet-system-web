import { BookOpen, Calendar } from 'react-feather';
import Card from '../_shared/Card';
import NoticeSection from './NoticeSection';

const StudentHome = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Student Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card
          title="My Class"
          value="10-A"
          icon={BookOpen}
          bgColor="bg-blue-50"
          textColor="text-blue-600"
        />
        <Card
          title="My Subjects"
          value="6"
          icon={BookOpen}
          bgColor="bg-green-50"
          textColor="text-green-600"
        />
        <Card
          title="Attendance Rate"
          value="92%"
          icon={Calendar}
          bgColor="bg-purple-50"
          textColor="text-purple-600"
        />
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">My Performance</h2>
          <ul className="space-y-3 text-gray-600">
            <li className="flex justify-between">
              <span>Mathematics</span>
              <span className="font-semibold text-blue-600">85/100</span>
            </li>
            <li className="flex justify-between">
              <span>English</span>
              <span className="font-semibold text-blue-600">78/100</span>
            </li>
            <li className="flex justify-between">
              <span>Science</span>
              <span className="font-semibold text-blue-600">88/100</span>
            </li>
          </ul>
        </div>

        <NoticeSection />
      </div>
    </div>
  );
};

export default StudentHome;
