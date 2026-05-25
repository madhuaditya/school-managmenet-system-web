import { useCallback, useMemo, useState } from 'react';
import { AlertCircle, Calendar as CalendarIcon, Clock, MapPin, Moon, RefreshCw, Sun, Users } from 'react-feather';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import calendarService from '../../services/dashboard-services/calendarService';

type CalendarRange = {
  start: string;
  end: string;
};

type CalendarEventItem = {
  _id: string;
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  timezone?: string;
  allDay?: boolean;
  color?: string;
  visibility?: string;
  status?: string;
  source?: string;
  attendees?: Array<Record<string, unknown>>;
  reminders?: Array<Record<string, unknown>>;
};

const DEFAULT_RANGE_DAYS = 45;

const formatDateTime = (value: string | Date | null | undefined, includeTime = true) => {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    ...(includeTime ? { timeStyle: 'short' as const } : {}),
  }).format(date);
};

const getRangeBounds = (start: Date, end: Date): CalendarRange => ({
  start: start.toISOString(),
  end: end.toISOString(),
});

const toCalendarEvent = (item: CalendarEventItem, darkMode: boolean) => ({
  id: item._id,
  title: item.title,
  start: item.startDate,
  end: item.endDate,
  allDay: Boolean(item.allDay),
  backgroundColor: item.color || (darkMode ? '#6366f1' : '#2563eb'),
  borderColor: item.color || (darkMode ? '#6366f1' : '#2563eb'),
  textColor: '#ffffff',
  extendedProps: {
    ...item,
    attendees: Array.isArray(item.attendees) ? item.attendees : [],
    reminders: Array.isArray(item.reminders) ? item.reminders : [],
  },
});

export default function Calendar() {
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [range, setRange] = useState<CalendarRange | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const loadEvents = useCallback(async (nextRange: CalendarRange) => {
    if (!nextRange?.start || !nextRange?.end) return;

    setLoading(true);
    setError('');

    try {
      const response = await calendarService.getEvents({
        page: 1,
        size: 100,
        dateFrom: nextRange.start,
        dateTo: nextRange.end,
      });

      if (!response?.success) {
        throw new Error(response?.msg || 'Failed to load calendar events');
      }

      const items = Array.isArray(response?.data?.items) ? (response.data.items as CalendarEventItem[]) : [];
      setEvents(items);
      setSelectedEventId((currentId) => {
        if (currentId && items.some((item) => item._id === currentId)) {
          return currentId;
        }

        return items[0]?._id || '';
      });
      setLastSyncedAt(new Date());
    } catch (err: any) {
      setEvents([]);
      setSelectedEventId('');
      setError(err?.response?.data?.msg || err?.message || 'Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDatesSet = useCallback((arg: { start: Date; end: Date }) => {
    const nextRange = getRangeBounds(arg.start, arg.end);
    setRange(nextRange);
    void loadEvents(nextRange);
  }, [loadEvents]);

  const handleEventClick = useCallback((info: { event: { id: string } }) => {
    setSelectedEventId(info.event.id || '');
  }, []);

  const refreshEvents = useCallback(() => {
    if (range) {
      void loadEvents(range);
      return;
    }

    const fallbackRange = getRangeBounds(new Date(), new Date(Date.now() + DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000));
    setRange(fallbackRange);
    void loadEvents(fallbackRange);
  }, [loadEvents, range]);

  const calendarEvents = useMemo(
    () => events.map((item) => toCalendarEvent(item, darkMode)),
    [darkMode, events],
  );

  const selectedEvent = useMemo(
    () => events.find((item) => item._id === selectedEventId) || events[0] || null,
    [events, selectedEventId],
  );

  const summary = useMemo(() => {
    const total = events.length;
    const upcoming = events.filter((item) => new Date(item.startDate).getTime() >= Date.now()).length;
    const publicCount = events.filter((item) => item.visibility === 'public').length;

    return { total, upcoming, publicCount };
  }, [events]);

  return (
    <section className={darkMode ? 'calendar-shell dark' : 'calendar-shell light'}>
      <div className="calendar-topbar">
        <div>
          <h1 className="calendar-eyebrow">
            <CalendarIcon size={14} />
            School calendar
          </h1>
          {/* <h1 className="calendar-heading">Events at a glance</h1> */}
        </div>

        <div className="calendar-actions">
          <button type="button" className="calendar-action-btn" onClick={() => setDarkMode((value) => !value)}>
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            {darkMode ? 'Light' : 'Dark'}
          </button>
          <button type="button" className="calendar-action-btn secondary" onClick={refreshEvents} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="calendar-metrics">
        <div className="calendar-metric-card">
          <span>Total</span>
          <strong>{summary.total}</strong>
        </div>
        <div className="calendar-metric-card">
          <span>Upcoming</span>
          <strong>{summary.upcoming}</strong>
        </div>
        <div className="calendar-metric-card">
          <span>Public</span>
          <strong>{summary.publicCount}</strong>
        </div>
        <div className="calendar-metric-card calendar-metric-card-wide">
          <span>Last sync</span>
          <strong>{lastSyncedAt ? formatDateTime(lastSyncedAt) : 'Not synced yet'}</strong>
        </div>
      </div>

      {error ? (
        <div className="calendar-alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="calendar-layout">
        <div className="calendar-panel calendar-panel-main">
          <div className="calendar-panel-inner">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
              }}
              datesSet={handleDatesSet}
              eventClick={handleEventClick}
              events={calendarEvents}
              height="auto"
              dayMaxEvents={3}
              selectable={false}
              editable={false}
              nowIndicator
              eventDisplay="block"
              moreLinkClick="popover"
            />

            {loading ? <div className="calendar-loading">Loading calendar events…</div> : null}
          </div>
        </div>

        <aside className="calendar-panel calendar-panel-side">
          <h2 className="calendar-side-title">Event details</h2>

          {selectedEvent ? (
            <div className="calendar-detail-card">
              <div className="calendar-detail-header">
                <h3>{selectedEvent.title}</h3>
                <span className={`status-pill ${selectedEvent.status || 'confirmed'}`}>
                  {selectedEvent.status || 'confirmed'}
                </span>
              </div>

              <p className="calendar-detail-description">
                {selectedEvent.description || 'No description provided.'}
              </p>

              <div className="calendar-detail-row">
                <Clock size={16} />
                <span>
                  {formatDateTime(selectedEvent.startDate)}
                  {selectedEvent.endDate ? ` → ${formatDateTime(selectedEvent.endDate)}` : ''}
                </span>
              </div>

              {selectedEvent.location ? (
                <div className="calendar-detail-row">
                  <MapPin size={16} />
                  <span>{selectedEvent.location}</span>
                </div>
              ) : null}

              <div className="calendar-detail-row">
                <Users size={16} />
                <span>{Array.isArray(selectedEvent.attendees) ? selectedEvent.attendees.length : 0} attendee(s)</span>
              </div>

              <div className="calendar-detail-grid">
                <div>
                  <span>Visibility</span>
                  <strong>{selectedEvent.visibility || 'private'}</strong>
                </div>
                <div>
                  <span>Source</span>
                  <strong>{selectedEvent.source || 'internal'}</strong>
                </div>
                <div>
                  <span>Timezone</span>
                  <strong>{selectedEvent.timezone || 'Asia/Kolkata'}</strong>
                </div>
                <div>
                  <span>All day</span>
                  <strong>{selectedEvent.allDay ? 'Yes' : 'No'}</strong>
                </div>
              </div>

              {Array.isArray(selectedEvent.reminders) && selectedEvent.reminders.length ? (
                <div className="calendar-reminders">
                  <span className="calendar-mini-label">Reminders</span>
                  <ul>
                    {selectedEvent.reminders.map((reminder: any, index: number) => (
                      <li key={`${selectedEvent._id}-reminder-${index}`}>
                        {reminder?.type || 'notification'} • {reminder?.minutesBefore ?? 0} min before
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="calendar-empty-state">
              <CalendarIcon size={24} />
              <p>No event selected.</p>
              <span>Pick an event on the calendar to see details here.</span>
            </div>
          )}
        </aside>
      </div>

      <style>{`
        .calendar-shell {
          border-radius: 24px;
          padding: 20px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
          transition: background 0.3s ease, color 0.3s ease, border-color 0.3s ease;
        }

        .calendar-shell.light {
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          color: #0f172a;
        }

        .calendar-shell.dark {
          background: linear-gradient(180deg, #0f172a 0%, #111827 100%);
          color: #e2e8f0;
          border-color: rgba(255, 255, 255, 0.08);
        }

        .calendar-topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }

        .calendar-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin: 0 0 6px;
          font-size: 16px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #64748b;
        }

        .calendar-shell.dark .calendar-eyebrow {
          color: #94a3b8;
        }

        .calendar-heading {
          margin: 0;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.03em;
        }

        .calendar-subtitle {
          margin: 6px 0 0;
          color: #64748b;
          max-width: 560px;
        }

        .calendar-shell.dark .calendar-subtitle {
          color: #94a3b8;
        }

        .calendar-actions {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .calendar-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
          border-radius: 14px;
          padding: 10px 14px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease, background 0.2s ease, color 0.2s ease;
          background: #2563eb;
          color: white;
        }

        .calendar-action-btn.secondary {
          background: rgba(148, 163, 184, 0.16);
          color: inherit;
        }

        .calendar-shell.dark .calendar-action-btn.secondary {
          background: rgba(255, 255, 255, 0.08);
        }

        .calendar-action-btn:hover {
          transform: translateY(-1px);
        }

        .calendar-action-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .spin {
          animation: spin 0.9s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .calendar-metrics {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }

        .calendar-metric-card {
          border-radius: 18px;
          padding: 14px 16px;
          background: rgba(148, 163, 184, 0.08);
        }

        .calendar-shell.light .calendar-metric-card {
          background: #eef2ff;
        }

        .calendar-metric-card span,
        .calendar-detail-grid span,
        .calendar-mini-label {
          display: block;
          font-size: 12px;
          color: #64748b;
          margin-bottom: 4px;
        }

        .calendar-shell.dark .calendar-metric-card span,
        .calendar-shell.dark .calendar-detail-grid span,
        .calendar-shell.dark .calendar-mini-label {
          color: #94a3b8;
        }

        .calendar-metric-card strong {
          font-size: 22px;
          font-weight: 800;
        }

        .calendar-metric-card-wide {
          grid-column: span 1;
        }

        .calendar-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 14px;
          border-radius: 14px;
          margin-bottom: 16px;
          background: rgba(239, 68, 68, 0.12);
          color: #b91c1c;
        }

        .calendar-shell.dark .calendar-alert {
          background: rgba(248, 113, 113, 0.16);
          color: #fecaca;
        }

        .calendar-layout {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr);
          gap: 16px;
        }

        .calendar-panel {
          border-radius: 20px;
          overflow: hidden;
          min-width: 0;
        }

        .calendar-panel-main {
          background: rgba(255, 255, 255, 0.6);
        }

        .calendar-shell.dark .calendar-panel-main {
          background: rgba(15, 23, 42, 0.5);
        }

        .calendar-panel-inner {
          position: relative;
          padding: 12px;
        }

        .calendar-loading {
          position: absolute;
          inset: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          background: rgba(15, 23, 42, 0.08);
          font-weight: 600;
          backdrop-filter: blur(4px);
        }

        .calendar-shell.dark .calendar-loading {
          background: rgba(15, 23, 42, 0.4);
        }

        .calendar-panel-side {
          padding: 18px;
          background: rgba(255, 255, 255, 0.66);
          border: 1px solid rgba(148, 163, 184, 0.12);
        }

        .calendar-shell.dark .calendar-panel-side {
          background: rgba(15, 23, 42, 0.72);
          border-color: rgba(255, 255, 255, 0.08);
        }

        .calendar-side-title {
          margin: 0 0 12px;
          font-size: 18px;
          font-weight: 700;
        }

        .calendar-detail-card {
          display: grid;
          gap: 14px;
        }

        .calendar-detail-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .calendar-detail-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 5px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          text-transform: capitalize;
          background: rgba(148, 163, 184, 0.16);
        }

        .status-pill.confirmed {
          background: rgba(34, 197, 94, 0.16);
          color: #15803d;
        }

        .status-pill.draft {
          background: rgba(245, 158, 11, 0.16);
          color: #b45309;
        }

        .status-pill.cancelled {
          background: rgba(239, 68, 68, 0.16);
          color: #b91c1c;
        }

        .calendar-shell.dark .status-pill.confirmed {
          color: #86efac;
        }

        .calendar-shell.dark .status-pill.draft {
          color: #fcd34d;
        }

        .calendar-shell.dark .status-pill.cancelled {
          color: #fca5a5;
        }

        .calendar-detail-description {
          margin: 0;
          color: #475569;
          line-height: 1.6;
        }

        .calendar-shell.dark .calendar-detail-description {
          color: #cbd5e1;
        }

        .calendar-detail-row {
          display: flex;
          align-items: center;
          gap: 10px;
          color: inherit;
        }

        .calendar-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .calendar-detail-grid > div {
          border-radius: 14px;
          padding: 12px;
          background: rgba(148, 163, 184, 0.08);
        }

        .calendar-shell.dark .calendar-detail-grid > div {
          background: rgba(255, 255, 255, 0.05);
        }

        .calendar-detail-grid strong {
          font-size: 14px;
          font-weight: 700;
        }

        .calendar-reminders ul {
          margin: 8px 0 0;
          padding-left: 18px;
          color: inherit;
        }

        .calendar-empty-state {
          min-height: 320px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #64748b;
          text-align: center;
        }

        .calendar-shell.dark .calendar-empty-state {
          color: #94a3b8;
        }

        .calendar-empty-state p,
        .calendar-empty-state span {
          margin: 0;
        }

        .calendar-shell .fc {
          border: none;
          background: transparent;
        }

        .calendar-shell .fc .fc-toolbar-title {
          font-size: 22px;
          font-weight: 800;
        }

        .calendar-shell .fc .fc-button {
          border: none;
          border-radius: 12px;
          padding: 8px 12px;
          box-shadow: none;
          font-weight: 600;
        }

        .calendar-shell.light .fc .fc-button {
          background: #e2e8f0;
          color: #0f172a;
        }

        .calendar-shell.dark .fc .fc-button {
          background: rgba(255, 255, 255, 0.08);
          color: #e2e8f0;
        }

        .calendar-shell.light .fc .fc-button:hover,
        .calendar-shell.light .fc .fc-button-active,
        .calendar-shell.dark .fc .fc-button:hover,
        .calendar-shell.dark .fc .fc-button-active {
          background: #2563eb;
          color: #fff;
        }

        .calendar-shell.dark .fc .fc-daygrid-day-number,
        .calendar-shell.dark .fc .fc-col-header-cell-cushion,
        .calendar-shell.dark .fc .fc-toolbar-title {
          color: #e2e8f0;
        }

        .calendar-shell.dark .fc .fc-theme-standard td,
        .calendar-shell.dark .fc .fc-theme-standard th,
        .calendar-shell.dark .fc .fc-scrollgrid {
          border-color: rgba(255, 255, 255, 0.08);
        }

        .calendar-shell.dark .fc .fc-day-today {
          background: rgba(37, 99, 235, 0.16) !important;
        }

        @media (max-width: 1024px) {
          .calendar-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .calendar-shell {
            padding: 16px;
          }

          .calendar-metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .calendar-detail-grid {
            grid-template-columns: 1fr;
          }

          .calendar-heading {
            font-size: 22px;
          }

          .calendar-shell .fc .fc-toolbar {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
        }
      `}</style>
    </section>
  );
}
