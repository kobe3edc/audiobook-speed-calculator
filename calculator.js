(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.AudioCalc = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var LIMITS = {
    hoursMin: 0,
    hoursMax: 200,
    minutesMin: 0,
    minutesMax: 59,
    speedMin: 1,
    speedMax: 3,
    hoursPerDay: 2
  };

  var MESSAGES = {
    hoursEmpty: 'Enter hours as a whole number from 0 to 200.',
    hoursNegative: 'Hours cannot be negative.',
    hoursNotWhole: 'Hours must be a plain whole number from 0 to 200. Decimals such as 1.5 are not truncated.',
    hoursRange: 'Hours must be from 0 to 200.',
    minutesEmpty: 'Enter minutes as a whole number from 0 to 59.',
    minutesNegative: 'Minutes cannot be negative.',
    minutesNotWhole: 'Minutes must be a plain whole number from 0 to 59. Decimals such as 30.5 are not truncated.',
    minutesRange: 'Minutes must be from 0 to 59. Add extra time in the hours field.',
    zero: 'Enter a book length greater than 0 minutes.',
    speed: 'Playback speed must be from 1.00x to 3.00x.'
  };

  function inspectField(raw) {
    var trimmed = String(raw == null ? '' : raw).trim();
    if (trimmed === '') return { state: 'empty' };
    if (trimmed.charAt(0) === '-') return { state: 'negative' };
    if (!/^(0|[1-9]\d*)$/.test(trimmed)) return { state: 'not-whole' };
    return { state: 'ok', value: Number(trimmed) };
  }

  function parseDuration(hoursRaw, minutesRaw) {
    var hours = inspectField(hoursRaw);
    var minutes = inspectField(minutesRaw);

    if (hours.state === 'empty') return fail('hours', MESSAGES.hoursEmpty);
    if (hours.state === 'negative') return fail('hours', MESSAGES.hoursNegative);
    if (hours.state === 'not-whole') return fail('hours', MESSAGES.hoursNotWhole);
    if (hours.value > LIMITS.hoursMax) return fail('hours', MESSAGES.hoursRange);

    if (minutes.state === 'empty') return fail('minutes', MESSAGES.minutesEmpty);
    if (minutes.state === 'negative') return fail('minutes', MESSAGES.minutesNegative);
    if (minutes.state === 'not-whole') return fail('minutes', MESSAGES.minutesNotWhole);
    if (minutes.value > LIMITS.minutesMax) return fail('minutes', MESSAGES.minutesRange);

    var totalMinutes = hours.value * 60 + minutes.value;
    if (totalMinutes <= 0) return fail('both', MESSAGES.zero);

    return {
      ok: true,
      hours: hours.value,
      minutes: minutes.value,
      totalMinutes: totalMinutes
    };
  }

  function fail(field, message) {
    return { ok: false, field: field, message: message };
  }

  // Round the whole amount before splitting hours and minutes.
  // Rounding only the remainder turns 59.5 minutes into "0h 60m".
  function formatTime(totalMinutes) {
    if (!Number.isFinite(totalMinutes) || totalMinutes < 0) {
      throw new Error('formatTime expects a non-negative finite number of minutes');
    }
    var rounded = Math.round(totalMinutes);
    var hrs = Math.floor(rounded / 60);
    var mins = rounded % 60;
    return hrs + 'h ' + String(mins).padStart(2, '0') + 'm';
  }

  function formatDaysLabel(newTotalMinutes) {
    var days = (newTotalMinutes / 60) / LIMITS.hoursPerDay;
    var rounded = Math.round(days * 10) / 10;
    if (rounded <= 0) return 'Under 0.1 day';
    var shown = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
    var unit = rounded === 1 ? 'day' : 'days';
    return 'About ' + shown + ' ' + unit;
  }

  function normalizeSpeed(value) {
    var speed = Math.round(Number(value) * 100) / 100;
    if (!Number.isFinite(speed) || speed < LIMITS.speedMin || speed > LIMITS.speedMax) {
      return null;
    }
    return speed;
  }

  function calculateResult(totalMinutes, speed) {
    if (!Number.isInteger(totalMinutes) || totalMinutes <= 0) {
      return fail('both', MESSAGES.zero);
    }
    if (!Number.isFinite(speed) || speed < LIMITS.speedMin || speed > LIMITS.speedMax) {
      return fail('speed', MESSAGES.speed);
    }

    var newTotalMins = totalMinutes / speed;
    var savedMins = totalMinutes - newTotalMins;
    var pctSaved = Math.round((savedMins / totalMinutes) * 100);
    var ratioPct = Math.round((newTotalMins / totalMinutes) * 100);
    var speedFasterPct = Math.round((speed - 1) * 100);

    return {
      ok: true,
      newTotalMins: newTotalMins,
      savedMins: savedMins,
      pctSaved: pctSaved,
      ratioPct: ratioPct,
      speedFasterPct: speedFasterPct,
      newLabel: formatTime(newTotalMins),
      savedLabel: formatTime(savedMins),
      lessTimeLabel: pctSaved + '% less time',
      daysLabel: formatDaysLabel(newTotalMins),
      note: pctSaved === 0
        ? 'At 1.00x, listening time matches the original length.'
        : 'Listening time is ' + pctSaved + '% shorter than the original. Playback at ' +
          speed.toFixed(2) + 'x is ' + speedFasterPct + '% faster than 1.00x.',
      comparisons: {
        '1.25': formatTime(totalMinutes / 1.25),
        '1.50': formatTime(totalMinutes / 1.5),
        '1.75': formatTime(totalMinutes / 1.75),
        '2.00': formatTime(totalMinutes / 2)
      }
    };
  }

  function adjustDuration(hoursRaw, minutesRaw, field, delta) {
    var hours = inspectField(hoursRaw);
    var minutes = inspectField(minutesRaw);
    if (hours.state !== 'ok' || minutes.state !== 'ok' ||
        hours.value > LIMITS.hoursMax || minutes.value > LIMITS.minutesMax) {
      return { ok: false };
    }

    var h = hours.value;
    var m = minutes.value;
    if (field === 'hours') {
      h = Math.min(LIMITS.hoursMax, Math.max(LIMITS.hoursMin, h + delta));
    } else if (field === 'minutes') {
      m += delta;
      if (m >= 60) {
        h += Math.floor(m / 60);
        m = m % 60;
      }
      if (m < 0) m = 0;
      if (h > LIMITS.hoursMax) {
        h = LIMITS.hoursMax;
        m = LIMITS.minutesMax;
      }
    } else {
      return { ok: false };
    }

    return { ok: true, hours: h, minutes: m };
  }

  return {
    LIMITS: LIMITS,
    MESSAGES: MESSAGES,
    parseDuration: parseDuration,
    formatTime: formatTime,
    formatDaysLabel: formatDaysLabel,
    normalizeSpeed: normalizeSpeed,
    calculateResult: calculateResult,
    adjustDuration: adjustDuration
  };
});
