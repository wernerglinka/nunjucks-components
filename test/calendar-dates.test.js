/**
 * @fileoverview All-day calendar events name a calendar day, and must land on
 * that day whatever the visitor's time zone.
 */

import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

import { parseISODate } from '../lib/layouts/components/sections/calendar/modules/helpers/date-utils.js';
import {
  eventDays,
  transformCalendarData
} from '../lib/layouts/components/sections/calendar/modules/helpers/event-transformer.js';

const originalZone = process.env.TZ;

/**
 * Run a check with the process in a given time zone
 * @param {string} zone - IANA time zone name
 * @param {() => void} check - Assertions to run in that zone
 */
const inZone = (zone, check) => {
  process.env.TZ = zone;
  check();
};

before(() => {
  process.env.TZ = 'UTC';
});

after(() => {
  if (originalZone === undefined) {
    delete process.env.TZ;
  } else {
    process.env.TZ = originalZone;
  }
});

const ZONES = ['America/Chicago', 'Pacific/Honolulu', 'UTC', 'Europe/Berlin', 'Pacific/Auckland'];

test('a date without a time keeps its calendar day in every zone', () => {
  for (const zone of ZONES) {
    inZone(zone, () => {
      const date = parseISODate('2026-07-04');
      assert.deepEqual(
        [date.getFullYear(), date.getMonth() + 1, date.getDate()],
        [2026, 7, 4],
        `4 July stays 4 July in ${zone}`
      );
    });
  }
});

test('a date with a time is still read as an instant', () => {
  inZone('America/Chicago', () => {
    const date = parseISODate('2026-07-04T02:00:00Z');
    assert.equal(date.getDate(), 3, '02:00 UTC on the 4th is the evening of the 3rd in Chicago');
    assert.equal(date.getTime(), Date.UTC(2026, 6, 4, 2));
  });
});

test('an all-day event is filed under its own day and month', () => {
  for (const zone of ZONES) {
    inZone(zone, () => {
      const months = transformCalendarData([
        {
          success: true,
          calendarName: 'Holidays',
          calendarCategory: 'holiday',
          events: [
            { id: '1', summary: 'First of the month', start: { date: '2026-08-01' }, end: { date: '2026-08-02' } }
          ]
        }
      ]);
      assert.equal(months.length, 1);
      assert.equal(months[0].key, '2026-08', `the event stays in August in ${zone}`);
      const day = months[0].days.find((entry) => entry.allDayEvents.length > 0);
      assert.equal(day.date, '2026-08-01', `and on the 1st in ${zone}`);
    });
  }
});

/**
 * Wrap events as the result of one successful calendar fetch
 * @param {Object[]} events - Raw events
 * @returns {Object[]} Fetch results
 */
const fetched = (events) => [{ success: true, calendarName: 'Test', calendarCategory: 'test', events }];

/**
 * The dates in a month that carry a given event
 * @param {Object} month - Month object from transformCalendarData
 * @param {string} id - Event id
 * @returns {string[]} Date keys
 */
const daysWith = (month, id) =>
  month.days
    .filter((day) => [...day.allDayEvents, ...day.timedEvents].some((event) => event.id === id))
    .map((day) => day.date);

test('an all-day event ends the day before its exclusive end date', () => {
  inZone('America/Chicago', () => {
    const single = eventDays({ start: { date: '2026-07-04' }, end: { date: '2026-07-05' } });
    assert.equal(single.length, 1, 'one day, not two');
    const three = eventDays({ start: { date: '2026-07-04' }, end: { date: '2026-07-07' } });
    assert.deepEqual(
      three.map((day) => day.getDate()),
      [4, 5, 6]
    );
  });
});

test('a timed event that ends at midnight does not reach into the next day', () => {
  inZone('America/Chicago', () => {
    const evening = eventDays({
      start: { dateTime: '2026-07-04T20:00:00-05:00' },
      end: { dateTime: '2026-07-05T00:00:00-05:00' }
    });
    assert.equal(evening.length, 1);
    const overnight = eventDays({
      start: { dateTime: '2026-07-04T22:00:00-05:00' },
      end: { dateTime: '2026-07-05T02:00:00-05:00' }
    });
    assert.deepEqual(
      overnight.map((day) => day.getDate()),
      [4, 5]
    );
  });
});

test('a multi-day event shows on every day it covers, across a month boundary', () => {
  inZone('America/Chicago', () => {
    const months = transformCalendarData(
      fetched([{ id: 'trip', summary: 'Trip', start: { date: '2026-07-30' }, end: { date: '2026-08-03' } }])
    );
    assert.deepEqual(
      months.map((month) => month.key),
      ['2026-07', '2026-08']
    );
    assert.deepEqual(daysWith(months[0], 'trip'), ['2026-07-30', '2026-07-31']);
    assert.deepEqual(daysWith(months[1], 'trip'), ['2026-08-01', '2026-08-02']);
    const shown = months[0].days.find((day) => day.date === '2026-07-30').allDayEvents[0];
    assert.equal(shown.dateRange, 'Jul 30 – Aug 2', 'and says which days');
  });
});

test('with a window, exactly the fetched months come back', () => {
  inZone('America/Chicago', () => {
    const window = [
      { year: 2026, month: 5 },
      { year: 2026, month: 6 },
      { year: 2026, month: 7 }
    ];
    const months = transformCalendarData(
      fetched([
        // Started long before the window and reaches into it
        { id: 'long', summary: 'Sabbatical', start: { date: '2026-03-01' }, end: { date: '2026-06-03' } },
        { id: 'one', summary: 'Picnic', start: { date: '2026-07-04' }, end: { date: '2026-07-05' } }
      ]),
      window
    );
    assert.deepEqual(
      months.map((month) => month.key),
      ['2026-06', '2026-07', '2026-08'],
      'no month outside the window, and the empty month is included'
    );
    assert.deepEqual(daysWith(months[0], 'long'), ['2026-06-01', '2026-06-02']);
    assert.equal(months[2].days.length, 31);
    assert.deepEqual(daysWith(months[2], 'one'), []);
  });
});

test('a failed calendar contributes no events and an event without a start is skipped', () => {
  const months = transformCalendarData([
    { success: false, calendarName: 'Down', events: [] },
    { success: true, calendarName: 'Up', events: [{ id: 'bad', summary: 'Cancelled' }] }
  ]);
  assert.deepEqual(months, []);
});
