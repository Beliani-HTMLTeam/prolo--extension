import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import styles from '../styles/CalendarWidget.module.scss';
import calendar_logo from '/icons/calendar.png?url';

interface CalendarWidgetProps {
  token: string | null;
  setToken: (token: string | null) => void;
  setUserProfile: (profile: any) => void;
  fetchUserProfile: (token: string) => Promise<void>;
}

export default function CalendarWidget({ token, setToken, setUserProfile, fetchUserProfile }: CalendarWidgetProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const currentDay = currentDate.getDate();

  const firstDayOffset = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const handleLogin = () => {
    setLoading(true);
    browser.identity.getAuthToken({ interactive: true }, result => {
      if (browser.runtime.lastError) {
        console.error(browser.runtime.lastError);
        setError('Login failed. Please check Google Cloud settings.');
        setLoading(false);
        return;
      }
      const tokenVal = typeof result === 'string' ? result : (result as any)?.token;
      if (tokenVal) {
        setToken(tokenVal);
        fetchUserProfile(tokenVal);
        fetchEvents(tokenVal);
      } else {
        setLoading(false);
      }
    });
  };

  const fetchEvents = async (authToken: string) => {
    try {
      const timeMin = new Date();
      timeMin.setMonth(timeMin.getMonth() - 3);
      timeMin.setDate(1);
      timeMin.setHours(0, 0, 0, 0);

      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin.toISOString()}&maxResults=150&singleEvents=true&orderBy=startTime`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      if (res.status === 401 || res.status === 403) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Google API Error Response:', errorData);
        browser.identity.removeCachedAuthToken({ token: authToken }, () => {
          setToken(null);
          setUserProfile(null);
          setError(errorData?.error?.message || 'Access denied to calendar. Please sign in again.');
        });
        return;
      }

      const data = await res.json();
      if (data.items) {
        setEvents(data.items);
        setError(null);
      } else if (data.error) {
        setError(data.error.message || 'Calendar API error.');
      }
    } catch (err) {
      console.error(err);
      setError('Error fetching calendar events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchEvents(token);
    } else {
      setEvents([]);
    }
  }, [token]);

  const actualMonthNames = [
    'JANUARY',
    'FEBRUARY',
    'MARCH',
    'APRIL',
    'MAY',
    'JUNE',
    'JULY',
    'AUGUST',
    'SEPTEMBER',
    'OCTOBER',
    'NOVEMBER',
    'DECEMBER',
  ];

  const shortMonthNamesEN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const handleDayClick = (day: number) => {
    setSelectedDay(prev => (prev === day ? null : day));
  };

  const handlePrevMonth = () => {
    setSelectedDay(null);
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDay(null);
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const renderCalendarDays = () => {
    const days = [];

    for (let i = firstDayOffset - 1; i >= 0; i--) {
      const colIndex = days.length % 7;
      const isWeekend = colIndex === 5 || colIndex === 6;
      days.push(
        <div key={`prev-${i}`} className={`${styles.day} ${styles.inactive} ${isWeekend ? styles.weekend : ''}`}>
          {daysInPrevMonth - i}
        </div>,
      );
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const colIndex = days.length % 7;
      const isWeekend = colIndex === 5 || colIndex === 6;
      const isToday = i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
      const isSelected = i === selectedDay;
      const dayDate = new Date(currentYear, currentMonth, i);
      const isPastDay = dayDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());

      const hasEvent = events.some(e => {
        const dateStr = e.start?.dateTime || e.start?.date;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d.getDate() === i && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });

      days.push(
        <div
          key={`curr-${i}`}
          className={`${styles.day} ${styles.currentMonthDay} ${isToday ? styles.today : ''} ${isSelected ? styles.selected : ''} ${hasEvent && !isSelected ? styles.hasEvent : ''} ${isWeekend ? styles.weekend : ''} ${isPastDay ? styles.pastDay : ''}`}
          onClick={() => handleDayClick(i)}
        >
          {i}
        </div>,
      );
    }

    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const colIndex = days.length % 7;
      const isWeekend = colIndex === 5 || colIndex === 6;
      days.push(
        <div key={`next-${i}`} className={`${styles.day} ${styles.inactive} ${isWeekend ? styles.weekend : ''}`}>
          {i}
        </div>,
      );
    }

    return days;
  };

  if (!token) {
    return (
      <div className={styles.calendarLoginWidget}>
        <div className={styles.content}>
          <img
            src={calendar_logo}
            className={styles.logo}
            style={{ objectFit: 'cover', objectPosition: `0px -${96 * (currentDay - 1)}px` }}
          />
          <p>
            In order to use calendar widget, you need to
            <br />
            login with Google, use button below to continue.
          </p>
        </div>

        <button className={styles.loginBtn} onClick={handleLogin} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>

        {error && <p className={styles.error}>{error}</p>}
      </div>
    );
  }

  const displayedEvents =
    selectedDay === null
      ? events
          .filter(e => {
            const dateStr = e.start?.dateTime || e.start?.date;
            if (!dateStr) return false;
            const d = new Date(dateStr);
            const boundaryDate =
              currentMonth === today.getMonth() && currentYear === today.getFullYear()
                ? new Date(today.getFullYear(), today.getMonth(), today.getDate())
                : new Date(currentYear, currentMonth, 1);
            return d >= boundaryDate && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
          })
          .slice(0, 5)
      : events.filter(e => {
          const dateStr = e.start?.dateTime || e.start?.date;
          if (!dateStr) return false;
          const d = new Date(dateStr);
          return d.getDate() === selectedDay && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

  return (
    <div className={styles.calendarWidget}>
      <div className={styles.leftPane}>
        <div className={styles.monthHeader}>
          <h3>
            {actualMonthNames[currentMonth]} {currentYear}
          </h3>
          <div className={styles.navButtons}>
            <button className={styles.navBtn} onClick={handlePrevMonth} title="Previous month">
              <Icon icon="mdi:chevron-left" />
            </button>
            <button className={styles.navBtn} onClick={handleNextMonth} title="Next month">
              <Icon icon="mdi:chevron-right" />
            </button>
          </div>
        </div>
        <div className={styles.calendarGrid}>
          {daysOfWeek.map((d, i) => (
            <div key={`dow-${i}`} className={styles.dow}>
              {d}
            </div>
          ))}
          {renderCalendarDays()}
        </div>
      </div>
      <div className={styles.rightPane}>
        <div className={styles.rightHeader}>
          <span className={styles.rightTitle}>
            {selectedDay ? `${selectedDay} ${shortMonthNamesEN[currentMonth]}` : 'Upcoming'}
          </span>
          <div className={styles.headerActions}>
            {selectedDay && (
              <button className={styles.clearBtn} onClick={() => setSelectedDay(null)} title="Show upcoming">
                ✕
              </button>
            )}
          </div>
        </div>
        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : displayedEvents.length === 0 ? (
          <div className={styles.noEvents}>No events</div>
        ) : (
          <div className={styles.eventsList}>
            {displayedEvents.map((e, idx) => {
              const start = e.start?.dateTime ? new Date(e.start.dateTime) : new Date(e.start?.date);
              const isAllDay = !e.start?.dateTime;
              const eventLink = e.htmlLink;

              const inner = (
                <>
                  <span className={styles.eventTitle}>{e.summary}</span>
                  <span className={styles.eventTime}>
                    {start.getDate()} {shortMonthNamesEN[start.getMonth()]}
                    {!isAllDay &&
                      ` ${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`}
                  </span>
                </>
              );

              return eventLink ? (
                <a
                  key={e.id || idx}
                  href={eventLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.eventCard} ${styles.clickable}`}
                >
                  {inner}
                </a>
              ) : (
                <div key={e.id || idx} className={styles.eventCard}>
                  {inner}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
