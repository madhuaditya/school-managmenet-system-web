import { useEffect, useMemo, useRef, useState } from 'react';
import { Users, BookOpen, Briefcase, Calendar } from 'react-feather';
import Highcharts from 'highcharts';
import Card from '../_shared/Card';
import { CardSkeleton } from '../_shared/Skeleton';
import NoticeSection from './NoticeSection';
import dashboardService from '../../../services/dashboard-services/dashboardService';

const TeacherHome = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const chartContainerRef = useRef(null);

  const chartOptions = useMemo(
    () => ({
      chart: {
        type: 'column',
        backgroundColor: 'transparent',
      },
      title: {
        text: 'School Overview',
      },
      xAxis: {
        categories: ['Students', 'Teachers', 'Staff', 'Classes', 'Subjects', 'Admins'],
        crosshair: true,
      },
      yAxis: {
        min: 0,
        title: {
          text: 'Count',
        },
      },
      legend: {
        enabled: false,
      },
      tooltip: {
        pointFormat: '<b>{point.y}</b>',
      },
      series: [
        {
          name: 'Count',
          data: [
            stats?.totalStudents || 0,
            stats?.totalTeachers || 0,
            stats?.totalStaff || 0,
            stats?.totalClasses || 0,
            stats?.totalSubjects || 0,
            stats?.totalAdmins || 0,
          ],
          colorByPoint: true,
        },
      ],
      credits: {
        enabled: false,
      },
    }),
    [stats],
  );

  useEffect(() => {
    if (!chartContainerRef.current) {
      return undefined;
    }

    const chart = Highcharts.chart(chartContainerRef.current, chartOptions);
    return () => {
      chart.destroy();
    };
  }, [chartOptions]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const result = await dashboardService.getOverview();
        if (result?.data) {
          setStats(result.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card
          title="Total Students"
          value={stats?.totalStudents || 0}
          icon={Users}
          bgColor="bg-blue-50"
          textColor="text-blue-600"
        />
        <Card
          title="Total Teachers"
          value={stats?.totalTeachers || 0}
          icon={Users}
          bgColor="bg-green-50"
          textColor="text-green-600"
        />
        <Card
          title="Total Staff"
          value={stats?.totalStaff || 0}
          icon={Briefcase}
          bgColor="bg-purple-50"
          textColor="text-purple-600"
        />
        <Card
          title="Total Classes"
          value={stats?.totalClasses || 0}
          icon={BookOpen}
          bgColor="bg-yellow-50"
          textColor="text-yellow-600"
        />
        <Card
          title="Total Subjects"
          value={stats?.totalSubjects || 0}
          icon={BookOpen}
          bgColor="bg-indigo-50"
          textColor="text-indigo-600"
        />
        <Card
          title="Total Admins"
          value={stats?.totalAdmins || 0}
          icon={Calendar}
          bgColor="bg-red-50"
          textColor="text-red-600"
        />
      </div>

      <div className="mt-12 grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-md xl:col-span-3">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Overview Chart</h2>
          <div ref={chartContainerRef} />
        </div>

        <NoticeSection className="xl:col-span-2" />
      </div>
    </div>
  );
};

export default TeacherHome;
