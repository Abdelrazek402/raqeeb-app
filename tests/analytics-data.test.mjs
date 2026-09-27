import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import test from 'node:test';

const values = new Map();
globalThis.window = { crypto: webcrypto };
globalThis.localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: (key) => values.delete(key),
};

const { getRolling7DaysSummary, getRolling30DaysMonthlySummary } = await import('../src/services/periodStatsService.ts');
const { getLocalFormattedDate } = await import('../src/utils/dateUtils.ts');

const emptyStats = () => ({
  date: getLocalFormattedDate(),
  confirmedPrayers: 0,
  socialTimeMinutes: 0,
  browserTimeMinutes: 0,
  blockedAttemptsCount: 0,
  remindersShown: 0,
  istighfarCount: 0,
  focusSessionsCount: 0,
  focusMinutesTotal: 0,
});
const unconfirmedPrayers = () => ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].map((id) => ({
  id,
  nameAr: id,
  time: '00:00',
  confirmed: false,
}));

test('empty analytics periods show no measured days or fabricated scores', () => {
  values.clear();
  const weekly = getRolling7DaysSummary(emptyStats(), unconfirmedPrayers(), []);
  const monthly = getRolling30DaysMonthlySummary(emptyStats(), unconfirmedPrayers(), []);

  assert.equal(weekly.recordedDaysCount, 0);
  assert.equal(weekly.totalPossiblePrayers, 0);
  assert.equal(weekly.weeklyScore, null);
  assert.ok(weekly.days.every((day) => !day.hasRecordedData));
  assert.equal(monthly.recordedDaysCount, 0);
  assert.equal(monthly.totalPossiblePrayers, 0);
  assert.equal(monthly.monthlyScore, null);
  assert.ok(monthly.weeksComparison.every((week) => week.recordedDaysCount === 0 && week.prayerPercentage === null));
});

test('a confirmed prayer is counted only against the recorded day', () => {
  values.clear();
  const prayers = unconfirmedPrayers().map((prayer) => ({
    ...prayer,
    confirmed: prayer.id === 'fajr',
  }));
  const weekly = getRolling7DaysSummary(emptyStats(), prayers, []);
  const monthly = getRolling30DaysMonthlySummary(emptyStats(), prayers, []);

  assert.equal(weekly.recordedDaysCount, 1);
  assert.equal(weekly.totalConfirmedPrayers, 1);
  assert.equal(weekly.totalPossiblePrayers, 5);
  assert.equal(monthly.recordedDaysCount, 1);
  assert.equal(monthly.totalConfirmedPrayers, 1);
  assert.equal(monthly.totalPossiblePrayers, 5);
});
