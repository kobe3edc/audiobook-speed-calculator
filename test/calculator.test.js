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

test('minute stepper borrows from hours instead of dropping the remainder', () => {
  // 2h 03m is 123 minutes. 123 - 5 = 118 minutes = 1h 58m.
  // The old minute-only clamp returned 2h 00m.
  assert.deepEqual(calc.adjustDuration('2', '3', 'minutes', -5), { ok: true, hours: 1, minutes: 58 });
  // 1h 00m - 5 minutes = 55 minutes.
  assert.deepEqual(calc.adjustDuration('1', '0', 'minutes', -5), { ok: true, hours: 0, minutes: 55 });
  // 1h 04m - 5 minutes = 59 minutes.
  assert.deepEqual(calc.adjustDuration('1', '4', 'minutes', -5), { ok: true, hours: 0, minutes: 59 });
  // 200h 00m - 5 minutes = 11995 minutes = 199h 55m.
  assert.deepEqual(calc.adjustDuration('200', '0', 'minutes', -5), { ok: true, hours: 199, minutes: 55 });
  // Adding still carries, and the top end stays 200h 59m.
  assert.deepEqual(calc.adjustDuration('199', '58', 'minutes', 5), { ok: true, hours: 200, minutes: 3 });
  assert.deepEqual(calc.adjustDuration('200', '58', 'minutes', 5), { ok: true, hours: 200, minutes: 59 });
  assert.deepEqual(calc.adjustDuration('0', '0', 'minutes', -5), { ok: true, hours: 0, minutes: 0 });
});

test('every whole hour from 0 to 200 and minute from 0 to 59 keeps its exact total', () => {
  for (let hours = 0; hours <= 200; hours += 1) {
    for (let minutes = 0; minutes <= 59; minutes += 1) {
      const parsed = calc.parseDuration(String(hours), String(minutes));
      if (hours === 0 && minutes === 0) {
        assert.equal(parsed.ok, false);
        assert.equal(parsed.field, 'both');
        assert.equal(parsed.totalMinutes, undefined);
        continue;
      }
      assert.equal(parsed.ok, true, `${hours}h ${minutes}m`);
      assert.equal(parsed.hours, hours);
      assert.equal(parsed.minutes, minutes);
      assert.equal(parsed.totalMinutes, hours * 60 + minutes);
    }
  }
});

test('hand-checked formulas at the speed and duration boundaries', () => {
  // Expected labels are written out from the arithmetic in the name of each row.
  // listening = total / speed, saved = total - listening.
  // Each clock rounds with half up, then 60 minutes becomes another hour.
  // pct = round(saved / total * 100), ratio = round(listening / total * 100).
  // faster = round((speed - 1) * 100).
  // days = round1(unroundedListeningMinutes / 120).
  const rows = [
    // 1 minute at 1.00x stays 0h 01m and saves nothing. 1/120 day is under 0.1.
    ['0', '1', 1, '0h 01m', '0h 00m', 0, 100, 0, 'Under 0.1 day'],
    // 1/3 minute rounds to 0h 00m; the saved 2/3 minute rounds to 0h 01m.
    // 0.666...% * 100 rounds to 67, and 0.333...% * 100 rounds to 33.
    ['0', '1', 3, '0h 00m', '0h 01m', 67, 33, 200, 'Under 0.1 day'],
    // 59 minutes at 1.00x. 59/120 = 0.4916... rounds to 0.5 days.
    ['0', '59', 1, '0h 59m', '0h 00m', 0, 100, 0, 'About 0.5 days'],
    // 119/2 = 59.5 and 59.5, so both clocks are 1h 00m. Days use 59.5/120 = 0.4958... → 0.5.
    ['1', '59', 2, '1h 00m', '1h 00m', 50, 50, 100, 'About 0.5 days'],
    // 180/3 = 60 and 120. 120/180*100 = 66.666... → 67. Days 60/120 = 0.5.
    ['3', '0', 3, '1h 00m', '2h 00m', 67, 33, 200, 'About 0.5 days'],
    // 240/1.6 = 150 and 90. Shares 62.5 and 37.5 round to 63 and 38. 150/120 = 1.25 → 1.3.
    ['4', '0', 1.6, '2h 30m', '1h 30m', 38, 63, 60, 'About 1.3 days'],
    // 600/1.15 = 521.739... → 522 = 8h 42m. Saved 78.260... → 78 = 1h 18m.
    // Percents 86.956... and 13.043... round to 87 and 13. Days 521.739.../120 = 4.347... → 4.3.
    ['10', '0', 1.15, '8h 42m', '1h 18m', 13, 87, 15, 'About 4.3 days'],
    ['10', '0', 1, '10h 00m', '0h 00m', 0, 100, 0, 'About 5 days'],
    // 600/3 = 200 = 3h 20m, saved 400 = 6h 40m. Days 200/120 = 1.666... → 1.7.
    ['10', '0', 3, '3h 20m', '6h 40m', 67, 33, 200, 'About 1.7 days'],
    // 12000/3 = 4000 = 66h 40m, saved 8000 = 133h 20m. Days 4000/120 = 33.333... → 33.3.
    ['200', '0', 3, '66h 40m', '133h 20m', 67, 33, 200, 'About 33.3 days'],
    ['200', '0', 1, '200h 00m', '0h 00m', 0, 100, 0, 'About 100 days'],
    // 12059/3 = 4019.666... → 4020 = 67h 00m. Saved 8039.333... → 8039 = 133h 59m.
    // Days 4019.666.../120 = 33.497... → 33.5.
    ['200', '59', 3, '67h 00m', '133h 59m', 67, 33, 200, 'About 33.5 days'],
    ['200', '59', 1, '200h 59m', '0h 00m', 0, 100, 0, 'About 100.5 days']
  ];

  for (const [hours, minutes, speed, newLabel, savedLabel, pctSaved, ratioPct, faster, daysLabel] of rows) {
    const parsed = calc.parseDuration(hours, minutes);
    assert.equal(parsed.ok, true, `${hours}h ${minutes}m`);
    const total = Number(hours) * 60 + Number(minutes);
    assert.equal(parsed.totalMinutes, total);
    const result = calc.calculateResult(total, speed);
    assert.equal(result.ok, true);
    assert.equal(result.newTotalMins, total / speed);
    assert.equal(result.savedMins, total - total / speed);
    assert.equal(result.newLabel, newLabel, `${hours}h ${minutes}m at ${speed}`);
    assert.equal(result.savedLabel, savedLabel);
    assert.equal(result.pctSaved, pctSaved);
    assert.equal(result.ratioPct, ratioPct);
    assert.equal(result.speedFasterPct, faster);
    assert.equal(result.lessTimeLabel, pctSaved + '% less time');
    assert.equal(result.daysLabel, daysLabel);
    assert.equal(calc.normalizeSpeed(speed), speed);
  }
});

test('decimals and empty fields are rejected instead of shortened, including the corners', () => {
  const rejected = [
    ['1.5', '0', 'hours'],
    ['1.9', '30', 'hours'],
    ['10.0', '0', 'hours'],
    ['200.5', '0', 'hours'],
    ['8', '30.5', 'minutes'],
    ['8', '59.9', 'minutes'],
    ['8', '60', 'minutes'],
    ['201', '0', 'hours'],
    ['-1', '0', 'hours'],
    ['', '30', 'hours'],
    ['10', '', 'minutes'],
    ['', '', 'hours'],
    ['0', '0', 'both']
  ];
  for (const [hours, minutes, field] of rejected) {
    const parsed = calc.parseDuration(hours, minutes);
    assert.equal(parsed.ok, false, `${hours} / ${minutes}`);
    assert.equal(parsed.field, field);
    assert.equal(parsed.totalMinutes, undefined);
  }

  const oneAndAHalfHours = calc.parseDuration('1.5', '0');
  assert.notEqual(oneAndAHalfHours.totalMinutes, 90);
  assert.notEqual(oneAndAHalfHours.totalMinutes, 60);
  assert.notEqual(oneAndAHalfHours.totalMinutes, 1);
  const thirtyPointFive = calc.parseDuration('10', '30.5');
  assert.notEqual(thirtyPointFive.totalMinutes, 30);
  assert.notEqual(thirtyPointFive.totalMinutes, 630);

  assert.equal(calc.normalizeSpeed(1), 1);
  assert.equal(calc.normalizeSpeed(3), 3);
  assert.equal(calc.normalizeSpeed(0.95), null);
  assert.equal(calc.normalizeSpeed(3.05), null);
  assert.equal(calc.calculateResult(60, 1).ok, true);
  assert.equal(calc.calculateResult(60, 3).newLabel, '0h 20m');
  assert.equal(calc.calculateResult(60, 3).savedLabel, '0h 40m');
  assert.equal(calc.calculateResult(60, 0.95).ok, false);
  assert.equal(calc.calculateResult(60, 3.05).ok, false);

  for (let step = 0; step <= 40; step += 1) {
    const speed = Math.round((1 + step * 0.05) * 100) / 100;
    assert.equal(calc.normalizeSpeed(String(speed)), speed);
    const result = calc.calculateResult(119, speed);
    assert.equal(result.ok, true);
    assert.equal(result.newTotalMins, 119 / speed);
    assert.equal(result.savedMins, 119 - 119 / speed);
  }
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
  assert.match(index, /119 ÷ 2 = 59\.5/);
  assert.match(index, /240 ÷ 1\.60 = 150 minutes \(2h 30m\)/);
  assert.match(index, /62\.5% and 37\.5%/);
  assert.match(index, /63% of the original length and 38% less time/);
  assert.match(index, /180 ÷ 3 = 60 minutes/);
  assert.match(index, /120 ÷ 180 rounds to 67%/);
  assert.match(index, /521\.739… minutes/);
  assert.match(index, /8h 42m and 1h 18m/);
  assert.match(index, /about 4\.3 days/);
  assert.equal(index.includes('Compatible with all formats'), false);
  assert.match(index, /Uses the length you type, not an audio file/);
  assert.match(index, /<h1 class="text-display font-display text-on-surface tracking-tight mb-4 text-center">\s*Audiobook Speed Calculator\s*<\/h1>/);
  assert.match(index, /<title>Audiobook Speed Calculator — Free Listening Time Tool<\/title>/);
  assert.match(index, /<link rel="canonical" href="https:\/\/audiobookspeedcalculator\.net\/"\/>/);
  const withoutScripts = index.replace(/<script[\s\S]*?<\/script>/gi, '');
  assert.match(withoutScripts, /Half minutes round up/);
  assert.match(withoutScripts, /59\.5/);
  assert.equal(withoutScripts.includes('adsbygoogle'), false);
  assert.equal(withoutScripts.includes('googletagmanager.com'), false);

  assert.match(privacy, /Last updated 2026-11-10/);
  assert.match(privacy, /G-X0RVS4D5VV/);
  assert.match(privacy, /Vercel/);
  assert.match(privacy, /fonts\.googleapis\.com/);
  assert.match(privacy, /cdn\.tailwindcss\.com/);
  assert.match(privacy, /localStorage/);
  assert.equal(/GDPR compliant/i.test(privacy), false);
  assert.equal(/never collect/i.test(privacy), false);
  assert.equal(/AdSense/i.test(privacy), true);
  assert.match(privacy, /does not show ads/);
  assert.match(privacy, /site verification and application/);
  assert.match(privacy, /Submitting verification or an application does not mean the site is approved or that ads are being served/);
  assert.equal(privacy.includes('does not use Google AdSense'), false);
  assert.equal(privacy.includes('not connected to AdSense'), false);
  assert.match(privacy, /https:\/\/adssettings\.google\.com\//);
  assert.match(privacy, /https:\/\/www\.aboutads\.info\/choices/);
  assert.match(privacy, /only if Google ads are actually added later/);
  assert.match(privacy, /does not claim the step is finished/);
  assert.match(privacy, /before those personalized ads are served/);
  assert.equal(privacy.includes('ca-pub'), false);
  assert.equal(privacy.includes('adsbygoogle'), false);
  assert.equal(index.includes('adsbygoogle'), false);
  assert.match(index, /<meta name="google-adsense-account" content="ca-pub-6030194077540135"\/>/);
  assert.equal(fs.readFileSync(path.join(root, 'ads.txt'), 'utf8'), 'google.com, pub-6030194077540135, DIRECT, f08c47fec0942fa0\n');
  assert.equal(privacy.includes('mailto:'), false);

  assert.match(about, /independent, free audiobook speed calculator/);
  assert.match(about, /calculated in the browser/);
  assert.match(about, /steps of 0\.05 from 1\.00x to 3\.00x/);
  assert.match(about, /one minute more than the book/);
  assert.match(about, /href="\/#how-it-works"/);
  assert.equal(/our team/i.test(about), false);
  assert.equal(/founded/i.test(about), false);
  assert.equal(/company history/i.test(about), false);
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
  const prep = read('docs/before-adsense.md');
  const readme = read('README.md');
  assert.match(prep, /认证 CMP 不只有 Google 自家一种/);
  assert.match(prep, /不是唯一合法选项/);
  assert.match(prep, /安装验证不等于开始展示广告/);
  assert.match(prep, /站点验证/);
  assert.match(prep, /审核尚未提交/);
  assert.match(prep, /没有安装 `adsbygoogle\.js`/);
  assert.equal(prep.includes('本站尚未接入'), false);
  assert.equal(prep.includes('没有 AdSense 账户'), false);
  assert.match(prep, /不保证该 URL 无法访问/);
  assert.match(readme, /not in the site navigation or sitemap/);
  assert.match(readme, /not a promise the URL is unreachable/);
  assert.equal(vercel.cleanUrls, true);
  assert.equal(analytics.includes('G-X0RVS4D5VV'), true);
  assert.equal(analytics.includes('G-'), true);
});

test('public speed claims match the sourced pages and the share label is not progress', () => {
  const pages = ['index.html', 'about.html', 'privacy.html', 'contact.html'].map(read).join('\n');
  const visible = pages.replace(/<script[\s\S]*?<\/script>/gi, '');

  assert.equal(visible.includes('Listening progress compression'), false);
  assert.equal(visible.includes('chipmunk'), false);
  assert.equal(visible.includes('pitch correction'), false);
  assert.equal(visible.includes('0.05x or 0.1x'), false);
  assert.equal(visible.includes('Variable stepping'), false);
  assert.equal(visible.includes('OverDrive'), false);
  assert.equal(visible.includes('Works for Audible'), false);
  assert.equal(visible.includes('3.5x increments'), false);

  assert.match(visible, /id="length-share-label">Whole book at this speed</);
  assert.match(visible, /id="length-share-note">This is the full listening time divided by the original length, not how far you have already listened\./);
  assert.match(visible, /id="length-share-meter" role="meter"/);
  assert.match(visible, /aria-labelledby="length-share-label"/);
  assert.match(visible, /aria-describedby="length-share-note"/);

  assert.match(visible, /does not play audio and does not measure pitch/);
  assert.match(visible, /does not claim that Audible, Spotify, Apple Books, Libby, or Storytel keep it the same/);

  assert.match(visible, /href="https:\/\/www\.audible\.com\/ep\/NarrationSpeed"/);
  assert.match(visible, /select a speed from 0\.5x to 3\.5x/);
  assert.match(visible, /cloud player is 0\.5x to 3\.5x in 0\.1 steps/);
  assert.match(visible, /does not give one step size for the iOS and Android apps/);
  assert.match(visible, /not a numeric range/);

  assert.match(visible, /href="https:\/\/help\.libbyapp\.com\/en-us\/6048\.htm"/);
  assert.match(visible, /fine-tune slider from 0\.6x to 3x/);

  assert.match(visible, /href="https:\/\/support\.apple\.com\/guide\/books\/listen-to-audiobooks-ibks9a460640\/mac"/);
  assert.match(visible, /Apple Books on Mac/);
  assert.match(visible, /slowest playback speed is 0\.75x and the fastest is 2x/);
  assert.match(visible, /That guide is for Mac/);

  assert.match(visible, /href="https:\/\/support\.spotify\.com\/us\/article\/audiobooks-unlock\/"/);
  assert.match(visible, /does not list a minimum, maximum, or step size/);
  assert.equal(/<strong>Spotify:<\/strong>[^<]*3\.5x/.test(visible), false);

  assert.match(visible, /href="https:\/\/support\.storytel\.com\/hc\/en-001\/articles\/360010485739-Audiobook-Player"/);
  assert.match(visible, /does not list the speeds or a step size/);
  assert.match(visible, /This calculator's control is separate: 1\.00x to 3\.00x in steps of 0\.05/);
});
