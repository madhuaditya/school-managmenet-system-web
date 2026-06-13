import { motion } from 'framer-motion';
import './MobileAppShowcase.css'

// const mobileFeatures = [
//   {
//     title: 'Home Dashboard',
//     image: '/Phone View Home Pages.jpg',
//   },
//   {
//     title: 'Quick Navigation Drawer',
//     image: '/Phone View Quick Drawer.jpg',
//   },
//   {
//     title: 'Manage Profile',
//     image: '/Phone View Manage your profile.jpg',
//   },
//   {
//     title: 'My Attendance',
//     image: '/Phone View My Attendance.jpg',
//   },
//   {
//     title: 'Student Attendance Overview',
//     image: '/Phone View Student Attandances.jpg',
//   },
//   {
//     title: 'Student Performance Analytics',
//     image: '/Phone View Student Perfromances.jpg',
//   },
//   {
//     title: 'Add Student Marks',
//     image: '/Phone View Add Student Marks.jpg',
//   },
//   {
//     title: 'Subjects Overview',
//     image: '/Phone View Subjects Over Views.jpg',
//   },
//   {
//     title: 'Manage Classes',
//     image: '/Phone View Manage Classes.jpg',
//   },
//   {
//     title: 'Class Information',
//     image: '/Phone View Class Info.jpg',
//   },
//   {
//     title: 'Add New Users',
//     image: '/Phone View Add Users.jpg',
//   },
//   {
//     title: 'Administrator List',
//     image: '/Phone View Admins Lists.jpg',
//   },
//   {
//     title: 'Admin Attendance Management',
//     image: '/Phone View Admin Attendances.jpg',
//   },
//   {
//     title: 'Mark Student Attendance',
//     image: '/Phone View Mark attandaces Students.jpg',
//   },
//   {
//     title: 'Select Class for Attendance',
//     image: '/Phone View select Classes for Mark Attandaces.jpg',
//   },
//   {
//     title: 'Students Directory',
//     image: '/Phone View Stundents List.jpg',
//   },
//   {
//     title: 'Teacher Attendance Selection',
//     image: '/Phone View List of Teachers for Attandaces.jpg',
//   },
//   {
//     title: 'Create Alerts & Notifications',
//     image: '/Phone View Create Alerts.jpg',
//   },
//   {
//     title: 'Broadcast Messages',
//     image: '/Phone View BroadCast.jpg',
//   },
//   {
//     title: 'Feedback Management',
//     image: '/Phone View Feedback.jpg',
//   },
//   {
//     title: 'Apply Leave Requests',
//     image: '/Phone View Apply Leaves.jpg',
//   },
//   {
//     title: 'My Salary Details',
//     image: '/Phone View My Salary.jpg',
//   },
// ];

const mobileFeatures = [
  {
    title: 'Home Dashboard',
    image: '/Phone home page.jpg',
  },
  {
    title: 'Quick Navigation Drawer',
    image: '/Phone drawer munu.jpg',
  },
  {
    title: 'Manage Profile',
    image: '/Phone profile pages.jpg',
  },
  {
    title: 'My Attendance',
    image: '/Phone My attandaces.jpg',
  },
  {
    title: 'Student Attendance Overview',
    image: '/Phone  view studetent attanances.jpg',
  },
  {
    title: 'Student Performance Analytics',
    image: '/Phone  stundeant perfromaces.jpg',
  },
  {
    title: 'Add Student Marks',
    image: '/Phone add mark for student for any subjects.jpg',
  },
  {
    title: 'Subject Information',
    image: '/Phone subject info.jpg',
  },
  {
    title: 'Manage Classes',
    image: '/Phone manage classes.jpg',
  },
  {
    title: 'Class Information',
    image: '/Phone class info.jpg',
  },
  {
    title: 'Add New Users',
    image: '/Phone add new user.jpg',
  },
  {
    title: 'Admin Attendance Management',
    image: '/Phone admin attandance.jpg',
  },
  {
    title: 'Mark Student Attendance',
    image: '/Phone mark attendace.jpg',
  },
  {
    title: 'Attendance List View',
    image: '/Phone mark attendacne list view.jpg',
  },
  {
    title: 'Select Class for Attendance',
    image: '/Phone select class to mark attendace.jpg',
  },
  {
    title: 'Teacher Attendance',
    image: '/Phone teacher attendaces.jpg',
  },
  {
    title: 'Create Alerts & Notifications',
    image: '/Phone create alerts.jpg',
  },
  {
    title: 'Broadcast Messages',
    image: '/Phone  broadad cast messages.jpg',
  },
  {
    title: 'Multiple Broadcast Images',
    image: '/Phone  mult boradcase image.jpg',
  },
  {
    title: 'Feedback Management',
    image: '/Phone  feedback page.jpg',
  },
  {
    title: 'Apply Leave Requests',
    image: '/Phone  apply leaves.jpg',
  },
  {
    title: 'My Salary Details',
    image: '/Phone My salary.jpg',
  },
];

function AppFeaturesSection() {
  return (
    <section className="py-20">
      <div className="mb-12 text-center">
        <span
          className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider"
          style={{
            background: '#F5F5F5',
            borderLeft: '3px solid #76ABAE',
            color: '#303841',
          }}
        >
          Mobile Application
        </span>

        <h2
          className="mt-4 text-3xl md:text-4xl font-bold"
          style={{ color: '#303841' }}
        >
          Manage School Anywhere
        </h2>

        <p
          className="mx-auto mt-3 max-w-2xl"
          style={{
            color: '#303841',
            opacity: 0.75,
          }}
        >
          Access attendance, salary, classes, alerts, students and school
          operations directly from your mobile device.
        </p>
      </div>

      <div className="relative overflow-hidden">
        <motion.div
          animate={{
            x: ['0%', '-50%'],
          }}
          transition={{
            repeat: Infinity,
            duration: 60,
            ease: 'linear',
          }}
          className="flex gap-8 w-max"
        >
          {[...mobileFeatures, ...mobileFeatures].map((item, index) => (
            <div className="phone-card">
                <div className="phone-glow" />

                <div className="phone-frame">
                    <div className="phone-notch">
                    <div className="phone-speaker" />
                    <div className="phone-camera" />
                    </div>

                    <div className="phone-screen">
                    <img
                        src={item.image}
                        alt={item.title}
                        className="phone-image"
                    />
                    </div>
                 </div>
                 </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default AppFeaturesSection;
