/**
 * Transform raw calendar events into structured month/day/event hierarchy
 */

import {
  formatDateKey,
  parseISODate,
  isAllDayEvent,
  getMonthName,
  getDayName,
  getShortDayName,
  formatTime,
  getDaysInMonth
} from './date-utils.js';

/**
 * The calendar days an event covers, as local dates at midnight.
 *
 * An all-day event's end date is exclusive: one on the 4th only ends on the
 * 5th. A timed event that ends exactly at midnight does not reach into the
 * day that starts then.
 * @param {Object} event - Raw event object
 * @returns {Date[]} One date per day covered, at least the start day
 */
export function eventDays(event) {
  const allDay = isAllDayEvent(event);
  const start = parseISODate(allDay ? event.start.date : event.start.dateTime);
  const endSource = allDay ? event.end?.date : event.end?.dateTime;
  const end = endSource ? parseISODate(endSource) : start;

  // The last instant that still belongs to the event
  const last = new Date(end.getTime() - 1);
  const first = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const days = [first];

  // Guard against malformed data producing an endless run of days
  const MAX_DAYS = 366;
  for (let offset = 1; offset < MAX_DAYS; offset++) {
    const day = new Date(first.getFullYear(), first.getMonth(), first.getDate() + offset);
    if (day > last) {
      break;
    }
    days.push(day);
  }

  return days;
}

/**
 * Build an empty month with one entry per day
 * @param {number} year - Year
 * @param {number} month - Month (0-11)
 * @returns {Object} Month object with a Map of days keyed by date
 */
function createMonth(year, month) {
  const days = new Map();
  getDaysInMonth(year, month).forEach((dateObj) => {
    days.set(formatDateKey(dateObj), {
      date: formatDateKey(dateObj),
      dateObj,
      dayName: getDayName(dateObj),
      shortDayName: getShortDayName(dateObj),
      dayNumber: dateObj.getDate(),
      allDayEvents: [],
      timedEvents: []
    });
  });

  return {
    key: getMonthKey(year, month),
    monthName: getMonthName(new Date(year, month, 1)),
    year,
    month,
    days
  };
}

/**
 * Transform calendar events into hierarchical structure
 *
 * An event is filed under every day it covers. One that covers several days
 * goes with the all-day events on each of them, as calendars usually show it.
 * @param {Array} calendarResults - Array of calendar fetch results
 * @param {Array<{year: number, month: number}>} [window] - The months that were
 *   fetched. When given, exactly these months are returned, including empty
 *   ones, and days outside them are dropped: a long event reaching in from
 *   outside says nothing about the other events of the month it started in.
 *   Without it, the months are those that have events.
 * @returns {Array} Array of month objects with days and events
 */
export function transformCalendarData(calendarResults, window) {
  // Flatten all events from all calendars and add calendar metadata
  const allEvents = [];
  calendarResults.forEach((result) => {
    if (result.success && result.events) {
      result.events.forEach((event) => {
        allEvents.push({
          ...event,
          calendarName: result.calendarName,
          calendarCategory: result.calendarCategory
        });
      });
    }
  });

  const monthsMap = new Map();
  (window || []).forEach(({ year, month }) => {
    monthsMap.set(getMonthKey(year, month), createMonth(year, month));
  });

  allEvents.forEach((event) => {
    // Cancelled or malformed entries can arrive without a start
    if (!event.start || (!event.start.date && !event.start.dateTime)) {
      return;
    }

    const days = eventDays(event);
    const allDay = isAllDayEvent(event);
    const formatted = formatEvent(event, allDay, days);

    days.forEach((dateObj) => {
      const monthKey = getMonthKey(dateObj.getFullYear(), dateObj.getMonth());
      if (!monthsMap.has(monthKey)) {
        if (window) {
          return;
        }
        monthsMap.set(monthKey, createMonth(dateObj.getFullYear(), dateObj.getMonth()));
      }

      const day = monthsMap.get(monthKey).days.get(formatDateKey(dateObj));
      if (allDay || days.length > 1) {
        day.allDayEvents.push(formatted);
      } else {
        day.timedEvents.push(formatted);
      }
    });
  });

  // Convert the day maps to arrays and sort the months chronologically
  return Array.from(monthsMap.values())
    .map((month) => ({ ...month, days: Array.from(month.days.values()) }))
    .sort((a, b) => a.year - b.year || a.month - b.month);
}

/**
 * Format individual event for display
 * @param {Object} event - Raw event object
 * @param {boolean} isAllDay - Whether event is all-day
 * @param {Date[]} days - The days the event covers
 * @returns {Object} Formatted event object
 */
function formatEvent(event, isAllDay, days) {
  const formatted = {
    id: event.id,
    summary: event.summary || 'Untitled Event',
    description: event.description || '',
    location: event.location || '',
    calendarName: event.calendarName || '',
    calendarCategory: event.calendarCategory || '',
    htmlLink: event.htmlLink || '',
    isAllDay
  };

  // An event over several days says which, since it shows on each of them
  if (days.length > 1) {
    const label = (date) => date.toLocaleString('en-US', { month: 'short', day: 'numeric' });
    formatted.dateRange = `${label(days[0])} – ${label(days[days.length - 1])}`;
  }

  if (isAllDay) {
    formatted.startDate = event.start.date;
    formatted.endDate = event.end?.date;
  } else {
    const startDate = parseISODate(event.start.dateTime);

    formatted.startDateTime = event.start.dateTime;
    formatted.endDateTime = event.end?.dateTime;
    formatted.startTime = formatTime(startDate);
    formatted.endTime = event.end?.dateTime ? formatTime(parseISODate(event.end.dateTime)) : '';
  }

  return formatted;
}

/**
 * Get month key for navigation
 * @param {number} year - Year
 * @param {number} month - Month (0-11)
 * @returns {string} Month key (YYYY-MM)
 */
export function getMonthKey(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}
