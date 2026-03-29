import { Calendar, CheckCircle } from 'react-feather';
import Card from '../_shared/Card';
import NoticeSection from './NoticeSection';

const StaffHome = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Staff Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card
          title="Today's Status"
          value="Present"
          icon={CheckCircle}
          bgColor="bg-green-50"
          textColor="text-green-600"
        />
        <Card
          title="Monthly Attendance"
          value="96%"
          icon={Calendar}
          bgColor="bg-blue-50"
          textColor="text-blue-600"
        />
        <Card
          title="Days Worked"
          value="20"
          icon={Calendar}
          bgColor="bg-purple-50"
          textColor="text-purple-600"
        />
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Monthly Summary</h2>
          <ul className="space-y-3 text-gray-600">
            <li className="flex justify-between border-b pb-2">
              <span>Total Days:</span>
              <span className="font-semibold">22</span>
            </li>
            <li className="flex justify-between border-b pb-2">
              <span>Present:</span>
              <span className="font-semibold text-green-600">21</span>
            </li>
            <li className="flex justify-between border-b pb-2">
              <span>Absent:</span>
              <span className="font-semibold text-red-600">0</span>
            </li>
            <li className="flex justify-between">
              <span>Leave:</span>
              <span className="font-semibold text-yellow-600">1</span>
            </li>
          </ul>
        </div>

        <NoticeSection />
      </div>
    </div>
  );
};

export default StaffHome;
