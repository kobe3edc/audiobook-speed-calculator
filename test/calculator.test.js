const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const calc = require('../calculator.js');

const root = path.join(__dirname, '..');

function read(name) {
  return fs.readFileSync(path.join(root, name), 'utf8');
}

test('59.5 minutes rolls over to 1h 00m instead of 0h 60m', () => {
  assert.equal(calc.formatTime(59.5), '1h 00m');
  assert.equal(calc.formatTime(119.6), '2h 00m');
  assert.equal(calc.formatTime(59.4), '0h 59m');
  assert.equal(calc.formatTime(0), '0h 00m');
  assert.equal(calc.formatTime(0.5), '0h 01m');
});

test('1h 59m at 2.00x is 1h 00m listening time and 1h 00m saved', () => {
  const parsed = calc.parseDuration('1', '59');
  assert.equal(parsed.ok, true);
  assert.equal(parsed.totalMinutes, 119);
  const result = calc.calculateResult(parsed.totalMinutes, 2);
  assert.equal(result.ok, true);
  assert.equal(result.newLabel, '1h 00m');
  assert.equal(result.savedLabel, '1h 00m');
  assert.equal(result.lessTimeLabel, '50% less time');
  assert.equal(result.speedFasterPct, 100);
});

test('10h at 1.50x is 6h 40m and saves 3h 20m, about 33% less time', () => {
  const parsed = calc.parseDuration('10', '0');
  const result = calc.calculateResult(parsed.totalMinutes, 1.5);
  assert.equal(result.newLabel, '6h 40m');
  assert.equal(result.savedLabel, '3h 20m');
  assert.equal(result.pctSaved, 33);
  assert.equal(result.lessTimeLabel, '33% less time');
  assert.equal(result.speedFasterPct, 50);
  assert.equal(result.ratioPct, 67);
  assert.match(result.note, /33% shorter/);
  assert.match(result.note, /50% faster/);
  assert.equal(result.daysLabel, 'About 3.3 days');
});

test('default 12h 30m at 1.50x matches the visible starter result', () => {
  const parsed = calc.parseDuration('12', '30');
  const result = calc.calculateResult(parsed.totalMinutes, 1.5);
  assert.equal(result.newLabel, '8h 20m');
  assert.equal(result.savedLabel, '4h 10m');
  assert.equal(result.comparisons['1.25'], '10h 00m');
  assert.equal(result.comparisons['1.50'], '8h 20m');
  assert.equal(result.comparisons['1.75'], '7h 09m');
  assert.equal(result.comparisons['2.00'], '6h 15m');
  assert.equal(result.daysLabel, 'About 4.2 days');
});

test('cheat-sheet lengths use the same nearest-minute rounding', () => {
  assert.equal(calc.calculateResult(20 * 60, 1.75).newLabel, '11h 26m');
  assert.equal(calc.calculateResult(20 * 60, 1.75).savedLabel, '8h 34m');
  assert.equal(calc.calculateResult(30 * 60, 1.75).newLabel, '17h 09m');
  assert.equal(calc.calculateResult(30 * 60, 1.75).savedLabel, '12h 51m');
  assert.equal(calc.calculateResult(8 * 60, 1.75).newLabel, '4h 34m');
  assert.equal(calc.calculateResult(8 * 60, 1.75).savedLabel, '3h 26m');
});

test('decimals, blanks, zero, negatives, and out-of-range values are rejected', () => {
  const cases = [
    ['1.5', '0', 'hours', /not truncated/],
    ['10', '30.5', 'minutes', /not truncated/],
    ['10', '60', 'minutes', /0 to 59/],
    ['', '', 'hours', /Enter hours/],
    ['10', '', 'minutes', /Enter minutes/],
    ['0', '0', 'both', /greater than 0/],
    ['-1', '0', 'hours', /cannot be negative/],
    ['1', '-5', 'minutes', /cannot be negative/],
    ['1e3', '0', 'hours', /not truncated/],
    ['201', '0', 'hours', /0 to 200/],
    ['200', '59', null, null]
  ];

  for (const [hours, minutes, field, pattern] of cases) {
    const parsed = calc.parseDuration(hours, minutes);
    if (field === null) {
      assert.equal(parsed.ok, true, `${hours}h ${minutes}m should be valid`);
      assert.equal(parsed.totalMinutes, 200 * 60 + 59);
    } else {
      assert.equal(parsed.ok, false, `${hours} / ${minutes} should fail`);
      assert.equal(parsed.field, field);
      assert.match(parsed.message, pattern);
      assert.equal(parsed.totalMinutes, undefined);
    }
  }

  const truncated = calc.parseDuration('1.5', '0');
  assert.notEqual(truncated.totalMinutes, 60);
});

test('speed stays inside 1.00x to 3.00x', () => {
  assert.equal(calc.normalizeSpeed(0.75), null);
  assert.equal(calc.normalizeSpeed(0.99), null);
  assert.equal(calc.normalizeSpeed(3.05), null);
  assert.equal(calc.normalizeSpeed(1), 1);
  assert.equal(calc.normalizeSpeed(3), 3);
  assert.equal(calc.normalizeSpeed(1.5), 1.5);
  const slow = calc.calculateResult(60, 0.75);
  assert.equal(slow.ok, false);
  assert.match(slow.message, /1\.00x to 3\.00x/);
  const normal = calc.calculateResult(60, 1);
  assert.equal(normal.newLabel, '1h 00m');
  assert.equal(normal.savedLabel, '0h 00m');
  assert.equal(normal.lessTimeLabel, '0% less time');
});

test('day hint states a 2-hour listening day and does not invent week buckets', () => {
  assert.equal(calc.formatDaysLabel(120), 'About 1 day');
  assert.equal(calc.formatDaysLabel(121), 'About 1 day');
  assert.equal(calc.formatDaysLabel(1), 'Under 0.1 day');
  assert.equal(calc.LIMITS.hoursPerDay, 2);
});

test('stepper keeps whole numbers inside the same limits and does not truncate decimals', () => {
  assert.deepEqual(calc.adjustDuration('1', '59', 'minutes', 5), { ok: true, hours: 2, minutes: 4 });
  assert.deepEqual(calc.adjustDuration('200', '55', 'minutes', 5), { ok: true, hours: 200, minutes: 59 });
  assert.deepEqual(calc.adjustDuration('200', '0', 'hours', 1), { ok: true, hours: 200, minutes: 0 });
  assert.deepEqual(calc.adjustDuration('0', '3', 'minutes', -5), { ok: true, hours: 0, minutes: 0 });
  assert.equal(calc.adjustDuration('1.5', '0', 'hours', 1).ok, false);
  assert.equal(calc.adjustDuration('10', '30.5', 'minutes', 5).ok, false);
});

test('pages keep the canonical host, drop the old claims, and publish real notices', () => {
  const index = read('index.html');
  const privacy = read('privacy.html');
  const about = read('about.html');
  const contact = read('contact.html');
  const sitemap = read('sitemap.xml');
  const vercel = JSON.parse(read('vercel.json'));
  const analytics = read('analytics-choice.js');

  assert.match(index, /https:\/\/audiobookspeedcalculator\.net\//);
  assert.equal(index.includes('33% faster'), false);
  assert.equal(index.includes('(Optimal)'), false);
  assert.equal(index.includes('Cognitive studies'), false);
  assert.equal(index.includes('standard reading pace'), false);
  assert.equal(index.includes('without losing comprehension'), false);
  assert.equal(index.includes('googletagmanager.com'), false);
  assert.match(index, /href="\/privacy"/);
  assert.match(index, /href="\/about"/);
  assert.match(index, /href="\/contact"/);
  assert.match(index, /33% less time/);
  assert.match(index, /if you listen 2 hours a day/);
  assert.match(index, /6h 40m and saves 3h 20m/);

  assert.match(privacy, /Last updated 2026-11-09/);
  assert.match(privacy, /G-X0RVS4D5VV/);
  assert.match(privacy, /Vercel/);
  assert.match(privacy, /fonts\.googleapis\.com/);
  assert.match(privacy, /cdn\.tailwindcss\.com/);
  assert.match(privacy, /localStorage/);
  assert.equal(/GDPR compliant/i.test(privacy), false);
  assert.equal(/never collect/i.test(privacy), false);
  assert.equal(/AdSense/i.test(privacy), true);
  assert.match(privacy, /does not use Google AdSense/);
  assert.equal(privacy.includes('mailto:'), false);

  assert.match(about, /independent, free audiobook speed calculator/);
  assert.equal(/our team/i.test(about), false);
  assert.equal(/founded/i.test(about), false);
  assert.equal(about.includes('mailto:'), false);

  assert.match(contact, /https:\/\/github\.com\/kobe3edc\/audiobook-speed-calculator\/issues/);
  assert.match(contact, /does not publish an email address/);
  const emailAddress = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
  for (const page of [index, privacy, about, contact, analytics]) {
    assert.equal(page.includes('mailto:'), false);
    assert.equal(emailAddress.test(page), false);
  }

  assert.match(sitemap, /https:\/\/audiobookspeedcalculator\.net\/privacy/);
  assert.match(sitemap, /https:\/\/audiobookspeedcalculator\.net\/about/);
  assert.match(sitemap, /https:\/\/audiobookspeedcalculator\.net\/contact/);
  assert.equal(vercel.cleanUrls, true);
  assert.equal(analytics.includes('G-X0RVS4D5VV'), true);
  assert.equal(analytics.includes('G-'), true);
});
