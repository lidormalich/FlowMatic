/**
 * Date range helpers for common queries
 * Replaces duplicated moment().startOf().endOf() blocks across multiple routes
 *
 * Usage:
 *   const { todayRange, monthRange, lastNDaysRange } = require('../utils/dateRanges');
 *   const { start, end } = todayRange();
 */

const moment = require('moment');

const todayRange = () => ({
  start: moment().startOf('day').toDate(),
  end: moment().endOf('day').toDate()
});

const yesterdayRange = () => ({
  start: moment().subtract(1, 'day').startOf('day').toDate(),
  end: moment().subtract(1, 'day').endOf('day').toDate()
});

const weekRange = () => ({
  start: moment().startOf('week').toDate(),
  end: moment().endOf('week').toDate()
});

const monthRange = () => ({
  start: moment().startOf('month').toDate(),
  end: moment().endOf('month').toDate()
});

const yearRange = () => ({
  start: moment().startOf('year').toDate(),
  end: moment().endOf('year').toDate()
});

const lastNDaysRange = (n) => ({
  start: moment().subtract(n, 'days').startOf('day').toDate(),
  end: moment().endOf('day').toDate()
});

const lastNMonthsRange = (n) => ({
  start: moment().subtract(n, 'months').startOf('month').toDate(),
  end: moment().endOf('day').toDate()
});

module.exports = {
  todayRange,
  yesterdayRange,
  weekRange,
  monthRange,
  yearRange,
  lastNDaysRange,
  lastNMonthsRange
};
