// import React, { useMemo } from "react";

// import FullCalendar from "@fullcalendar/react";
// import dayGridPlugin from "@fullcalendar/daygrid";
// import timeGridPlugin from "@fullcalendar/timegrid";
// import interactionPlugin from "@fullcalendar/interaction";
// import listPlugin from "@fullcalendar/list";
// import './calander.css';

// export default function Calendar() {

//   const events = useMemo(() => [
//     {
//       id: "1",
//       title: "Team Standup",
//       start: "2026-05-01T10:00:00",
//       end: "2026-05-01T11:00:00",
//     },
//     {
//       id: "2",
//       title: "UI Review",
//       start: "2026-05-03T14:00:00",
//       end: "2026-05-03T15:30:00",
//     },
//     {
//       id: "3",
//       title: "Client Meeting",
//       start: "2026-05-05T12:00:00",
//       end: "2026-05-05T13:00:00",
//     },
//     {
//       id: "4",
//       title: "Backend Sprint",
//       start: "2026-05-08",
//       end: "2026-05-11",
//     },
//     {
//       id: "5",
//       title: "Design Workshop",
//       start: "2026-05-12T09:00:00",
//       end: "2026-05-12T12:00:00",
//     },
//     {
//       id: "6",
//       title: "Product Launch 🚀",
//       start: "2026-05-15T18:00:00",
//     },
//     {
//       id: "7",
//       title: "Marketing Sync",
//       start: "2026-05-18T16:00:00",
//     },
//     {
//       id: "8",
//       title: "Hackathon",
//       start: "2026-05-20",
//       end: "2026-05-22",
//     },
//     {
//       id: "9",
//       title: "Interview Round",
//       start: "2026-05-24T11:30:00",
//     },
//     {
//       id: "10",
//       title: "Monthly Review",
//       start: "2026-05-28T15:00:00",
//     },
//   ], []);

//   return (
//     <div className="calendar-wrapper">
//       <FullCalendar
//         plugins={[
//           dayGridPlugin,
//           timeGridPlugin,
//           interactionPlugin,
//           listPlugin,
//         ]}
//         initialView="dayGridMonth"
//         headerToolbar={{
//           left: "prev,next today",
//           center: "title",
//           right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
//         }}
//         editable={true}
//         selectable={true}
//         dayMaxEvents={3}
//         events={events}
//         height="90vh"
//       />

//       <style>{`
//         * {
//           box-sizing: border-box;
//         }

//         body {
//           margin: 0;
//           background: #6288e1;
//           font-family: Inter, sans-serif;
//         }

//         .calendar-wrapper {
//           padding: 24px;
//           min-height: 100vh;
//           background: linear-gradient(
//             135deg,
//             #142e9f,
//             #3a61bd,
//             #88a7e9
//           );
//         }

//         .fc {
//           background: rgba(40, 87, 197, 0.9);
//           padding: 20px;
//           border-radius: 24px;
//           color: white;
//           box-shadow:
//             0 10px 40px rgba(0,0,0,0.4);
//         }

//         .fc-toolbar-title {
//           font-size: 24px !important;
//           font-weight: 700;
//           color: white;
//         }

//         .fc-button {
//           background: #286cda !important;
//           border: none !important;
//           color: white !important;
//           padding: 8px 14px !important;
//           border-radius: 12px !important;
//           transition: 0.2s ease;
//         }

//         .fc-button:hover {
//           background: #1464d3 !important;
//         }

//         .fc-button-active {
//           background: #2563eb !important;
//         }

//         .fc-theme-standard td,
//         .fc-theme-standard th,
//         .fc-theme-standard .fc-scrollgrid {
//           border-color: rgba(255,255,255,0.08);
//         }

//         .fc-col-header-cell {
//           background: rgba(255,255,255,0.03);
//           padding: 14px 0;
//         }

//         .fc-col-header-cell-cushion {
//           color: #cbd5e1;
//           text-decoration: none;
//           font-weight: 600;
//         }

//         .fc-daygrid-day {
//           transition: 0.2s ease;
//         }

//         .fc-daygrid-day:hover {
//           background: rgba(255,255,255,0.03);
//         }

//         .fc-daygrid-day-number {
//           color: #f8fafc;
//           text-decoration: none;
//           padding: 10px;
//           font-size: 14px;
//         }

//         .fc-day-today {
//           background: rgba(37, 99, 235, 0.18) !important;
//         }

//         .fc-event {
//           border: none !important;
//           border-radius: 10px !important;
//           padding: 4px 8px;
//           font-size: 13px;
//           font-weight: 500;
//           background: linear-gradient(
//             135deg,
//             #2563eb,
//             #7c3aed
//           ) !important;
//           box-shadow:
//             0 4px 12px rgba(37,99,235,0.3);
//         }

//         .fc-event:hover {
//           transform: translateY(-1px);
//           cursor: pointer;
//         }

//         .fc-list {
//           border-radius: 16px;
//           overflow: hidden;
//         }

//         .fc-list-day-cushion {
//           background: #111827 !important;
//         }

//         .fc-list-event:hover td {
//           background: rgba(255,255,255,0.04) !important;
//         }

//         .fc-scrollgrid {
//           border-radius: 18px;
//           overflow: hidden;
//         }

//         @media (max-width: 768px) {

//           .calendar-wrapper {
//             padding: 12px;
//           }

//           .fc-toolbar {
//             display: flex;
//             flex-direction: column;
//             gap: 12px;
//           }

//           .fc-toolbar-title {
//             font-size: 18px !important;
//           }

//           .fc-button {
//             padding: 6px 10px !important;
//             font-size: 12px !important;
//           }
//         }
//       `}</style>
//     </div>
//   );
// }

import React, { useMemo, useState } from "react";

import FullCalendar from "@fullcalendar/react";

import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";

export default function Calendar() {

  const [darkMode, setDarkMode] = useState(false);

  const events = useMemo(() => [
    {
      title: "Team Meeting",
      date: "2026-05-03",
    },
    {
      title: "UI Review",
      date: "2026-05-06",
    },
    {
      title: "Project Demo",
      date: "2026-05-10",
    },
    {
      title: "Client Call",
      date: "2026-05-14",
    },
    {
      title: "Hackathon 🚀",
      date: "2026-05-20",
    },
    {
      title: "Monthly Review",
      date: "2026-05-28",
    },
  ], []);

  return (
    <div className={darkMode ? "calendar-wrapper dark" : "calendar-wrapper light"}>

      {/* Header */}
      <div className="calendar-topbar">

        <h1 className="calendar-heading">
          School Calendar
        </h1>

        <button
          className="theme-toggle-btn"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>

      </div>

      <FullCalendar
        plugins={[
          dayGridPlugin,
          timeGridPlugin,
          interactionPlugin,
          listPlugin,
        ]}
        initialView="dayGridMonth"
        editable={true}
        selectable={true}
        dayMaxEvents={3}
        height="85vh"
        events={events}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
        }}
      />

      <style>{`

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: Inter, sans-serif;
        }

        .calendar-wrapper {
          min-height: 100vh;
          padding: 24px;
          transition: all 0.3s ease;
        }

        /* =========================
           DARK MODE
        ========================= */

      /* =========================
   PREMIUM DARK MODE THEME
========================= */

.calendar-wrapper.dark {
  min-height: 100vh;

  background:
    radial-gradient(circle at top left, #1e3a8a 0%, transparent 30%),
    radial-gradient(circle at bottom right, #312e81 0%, transparent 30%),
    linear-gradient(
      135deg,
      #020617,
      #0f172a,
      #111827
    );

  transition: all 0.3s ease;
}


/* MAIN CALENDAR */

.calendar-wrapper.dark .fc {
  background: rgba(15, 23, 42, 0.88);

  backdrop-filter: blur(18px);

  border: 1px solid rgba(255,255,255,0.08);

  border-radius: 28px;

  padding: 24px;

  color: white;

  box-shadow:
    0 8px 32px rgba(0,0,0,0.45),
    inset 0 1px 0 rgba(255,255,255,0.04);
}


/* HEADER */

.calendar-wrapper.dark .calendar-heading {
  color: #f8fafc;

  font-size: 30px;

  font-weight: 800;

  letter-spacing: -0.5px;
}


/* TOOLBAR TITLE */

.calendar-wrapper.dark .fc-toolbar-title {
  color: #f8fafc;

  font-size: 26px !important;

  font-weight: 700;
}


/* BUTTONS */

.calendar-wrapper.dark .fc-button {
  background: rgba(255,255,255,0.06) !important;

  backdrop-filter: blur(12px);

  color: #e2e8f0 !important;

  border: 1px solid rgba(255,255,255,0.08) !important;

  border-radius: 14px !important;

  padding: 10px 18px !important;

  margin: 0 6px !important;

  font-weight: 600 !important;

  transition: all 0.25s ease !important;

  box-shadow:
    0 4px 12px rgba(0,0,0,0.2);
}

.calendar-wrapper.dark .fc-button:hover {
  background: rgba(255,255,255,0.12) !important;

  transform: translateY(-1px);

  box-shadow:
    0 6px 16px rgba(0,0,0,0.3);
}


/* ACTIVE BUTTON */

.calendar-wrapper.dark .fc-button-active {
  background: linear-gradient(
    135deg,
    #2563eb,
    #7c3aed
  ) !important;

  color: white !important;

  border: none !important;

  box-shadow:
    0 6px 20px rgba(37,99,235,0.4);
}


/* GRID */

.calendar-wrapper.dark .fc-theme-standard td,
.calendar-wrapper.dark .fc-theme-standard th,
.calendar-wrapper.dark .fc-theme-standard .fc-scrollgrid {
  border-color: rgba(255,255,255,0.06);
}


/* HEADER DAYS */

.calendar-wrapper.dark .fc-col-header-cell {
  background: rgba(255,255,255,0.03);

  padding: 16px 0;

  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.calendar-wrapper.dark .fc-col-header-cell-cushion {
  color: #cbd5e1;

  text-decoration: none;

  font-weight: 600;

  letter-spacing: 0.3px;
}


/* DAY CELLS */

.calendar-wrapper.dark .fc-daygrid-day {
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.calendar-wrapper.dark .fc-daygrid-day:hover {
  background: rgba(255,255,255,0.03);
}


/* DAY NUMBERS */

.calendar-wrapper.dark .fc-daygrid-day-number {
  color: #f8fafc;

  text-decoration: none;

  padding: 12px;

  font-size: 14px;

  font-weight: 500;
}


/* TODAY */

.calendar-wrapper.dark .fc-day-today {
  background:
    linear-gradient(
      135deg,
      rgba(37,99,235,0.18),
      rgba(124,58,237,0.12)
    ) !important;
}


/* EVENTS */

.calendar-wrapper.dark .fc-event {
  border: none !important;

  border-radius: 12px !important;

  padding: 6px 10px;

  font-size: 13px;

  font-weight: 600;

  letter-spacing: 0.2px;

  background: linear-gradient(
    135deg,
    #2563eb,
    #7c3aed
  ) !important;

  box-shadow:
    0 4px 16px rgba(37,99,235,0.35);

  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.calendar-wrapper.dark .fc-event:hover {
  transform: translateY(-2px);

  box-shadow:
    0 8px 22px rgba(37,99,235,0.45);

  cursor: pointer;
}


/* LIST VIEW */

.calendar-wrapper.dark .fc-list {
  border-radius: 18px;

  overflow: hidden;
}

.calendar-wrapper.dark .fc-list-day-cushion {
  background: rgba(255,255,255,0.03) !important;

  color: #f8fafc;
}

.calendar-wrapper.dark .fc-list-event:hover td {
  background: rgba(255,255,255,0.04) !important;
}


/* SCROLL GRID */

.calendar-wrapper.dark .fc-scrollgrid {
  border-radius: 22px;

  overflow: hidden;
}


/* TOGGLE BUTTON */

.calendar-wrapper.dark .theme-toggle-btn {
  background: rgba(255,255,255,0.06);

  backdrop-filter: blur(12px);

  color: white;

  border: 1px solid rgba(255,255,255,0.08);

  box-shadow:
    0 4px 12px rgba(0,0,0,0.25);
}

.calendar-wrapper.dark .theme-toggle-btn:hover {
  background: rgba(255,255,255,0.12);

  transform: translateY(-1px);
}

        /* =========================
           COMMON STYLES
        ========================= */

        .calendar-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 14px;
        }

        .calendar-heading {
          color: white;
          font-size: 28px;
          margin: 0;
          font-weight: 700;
        }

        .calendar-wrapper.light .calendar-heading {
          color: #111827;
        }

        .theme-toggle-btn {
          border: none;
          padding: 12px 18px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s ease;
          background: white;
          color: #111827;
          box-shadow:
            0 4px 12px rgba(0,0,0,0.12);
        }

        .theme-toggle-btn:hover {
          transform: translateY(-1px);
        }

        .dark .theme-toggle-btn {
          background: rgba(255,255,255,0.12);
          color: white;
          backdrop-filter: blur(10px);
        }

        .fc {
          padding: 20px;
          border-radius: 24px;
          box-shadow:
            0 10px 40px rgba(0,0,0,0.15);
          transition: 0.3s ease;
        }

        .fc-toolbar {
          margin-bottom: 20px !important;
        }

        .fc-toolbar-title {
          font-size: 24px !important;
          font-weight: 700;
        }

        /* BUTTONS */

        .fc-button {
          border: none !important;
          padding: 10px 16px !important;
          border-radius: 12px !important;
          transition: 0.2s ease;
          margin-left: 8px !important;
          margin-right: 8px !important;
          font-weight: 600 !important;
        }

        .dark .fc-button {
          background: #286cda !important;
          color: white !important;
        }

        .dark .fc-button:hover {
          background: #1464d3 !important;
        }

        .light .fc-button {
          background: #e5e7eb !important;
          color: #111827 !important;
        }

        .light .fc-button:hover {
          background: #ffffff !important;
        }

        .fc-button-active {
          background: #2563eb !important;
          color: white !important;
        }

        /* GRID */

        .fc-theme-standard td,
        .fc-theme-standard th,
        .fc-theme-standard .fc-scrollgrid {
          border-color: rgba(255,255,255,0.08);
        }

        .light .fc-theme-standard td,
        .light .fc-theme-standard th,
        .light .fc-theme-standard .fc-scrollgrid {
          border-color: #e5e7eb;
        }

        .fc-col-header-cell {
          padding: 14px 0;
        }

        .fc-col-header-cell-cushion {
          text-decoration: none;
          font-weight: 600;
        }

        .fc-daygrid-day {
          transition: 0.2s ease;
        }

        .fc-daygrid-day-number {
          text-decoration: none;
          padding: 10px;
          font-size: 14px;
        }

        .fc-day-today {
          background: rgba(37, 99, 235, 0.14) !important;
        }

        /* EVENTS */

        .fc-event {
          border: none !important;
          border-radius: 10px !important;
          padding: 4px 8px;
          font-size: 13px;
          font-weight: 500;
          background: linear-gradient(
            135deg,
            #2563eb,
            #7c3aed
          ) !important;
          box-shadow:
            0 4px 12px rgba(37,99,235,0.25);
        }

        .fc-event:hover {
          transform: translateY(-1px);
          cursor: pointer;
        }

        /* LIST VIEW */

        .fc-list {
          border-radius: 16px;
          overflow: hidden;
        }

        .fc-list-event:hover td {
          background: rgba(0,0,0,0.04) !important;
        }

        /* GRID ROUND */

        .fc-scrollgrid {
          border-radius: 18px;
          overflow: hidden;
        }

        /* RESPONSIVE */

        @media (max-width: 768px) {

          .calendar-wrapper {
            padding: 12px;
          }

          .calendar-topbar {
            flex-direction: column;
            align-items: flex-start;
          }

          .fc-toolbar {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .fc-toolbar-title {
            font-size: 18px !important;
          }

          .fc-button {
            padding: 6px 10px !important;
            font-size: 12px !important;
            margin: 4px !important;
          }
        }

      `}</style>
    </div>
  );
}