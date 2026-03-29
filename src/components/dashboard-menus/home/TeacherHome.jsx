import { Users, BookOpen } from 'react-feather';
import Card from '../_shared/Card';
import NoticeSection from './NoticeSection';

const TeacherHome = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Teacher Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card
          title="My Classes"
          value="3"
          icon={BookOpen}
          bgColor="bg-blue-50"
          textColor="text-blue-600"
        />
        <Card
          title="My Students"
          value="95"
          icon={Users}
          bgColor="bg-green-50"
          textColor="text-green-600"
        />
        <Card
          title="My Subjects"
          value="5"
          icon={BookOpen}
          bgColor="bg-purple-50"
          textColor="text-purple-600"
        />
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Today's Classes</h2>
          <ul className="space-y-3 text-gray-600">
            <li className="flex justify-between border-b pb-2">
              <span>10:00 AM - Class 10-A (Math)</span>
              <span className="text-green-600 font-semibold">Present</span>
            </li>
            <li className="flex justify-between border-b pb-2">
              <span>11:30 AM - Class 10-B (Math)</span>
              <span className="text-green-600 font-semibold">Present</span>
            </li>
            <li className="flex justify-between">
              <span>1:00 PM - Class 9-A (Math)</span>
              <span className="text-blue-600 font-semibold">Upcoming</span>
            </li>
          </ul>
        </div>

        <NoticeSection />
      </div>
    </div>
  );
};

export default TeacherHome;
