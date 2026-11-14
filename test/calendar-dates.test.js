/**
 * @fileoverview All-day calendar events name a calendar day, and must land on
 * that day whatever the visitor's time zone.
 */

import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

import { parseISODate } from '../lib/layouts/components/sections/calendar/modules/helpers/date-utils.js';
import { transformCalendarData } from '../lib/layouts/components/sections/calendar/modules/helpers/event-transformer.js';

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
