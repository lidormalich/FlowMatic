import { HDate, HebrewCalendar, Location } from '@hebcal/core';

/**
 * Converts a Gregorian date to a Hebrew date string
 * @param {Date|string} date - The Gregorian date
 * @returns {string} - The Hebrew date string (e.g., "ה' באייר תשפ\"ד")
 */
export const formatHebrewDate = (date) => {
    try {
        const dt = new Date(date);
        const hd = new HDate(dt);
        return hd.renderGematriya(true); // true for 'he' locale/characters
    } catch (e) {
        console.error('Error converting date:', e);
        return '';
    }
};

/**
 * Get Hebrew holidays for a given month
 * @param {number} year - Gregorian year
 * @param {number} month - Gregorian month (0-11)
 * @returns {Array} - Array of holidays
 */
export const getHebrewHolidays = (year, month) => {
    try {
        const options = {
            year: year,
            isHebrewYear: false,
            il: true, // Israel holidays
            sedrot: true, // Torah portions
        };
        const events = HebrewCalendar.calendar(options);
        
        // Filter for specific month
        return events.filter(ev => {
            const date = ev.getDate().greg();
            return date.getMonth() === month && date.getFullYear() === year;
        }).map(ev => ({
            title: ev.render('he'),
            date: ev.getDate().greg(),
            className: 'hebrew-holiday'
        }));
    } catch (e) {
        console.error('Error getting holidays:', e);
        return [];
    }
};
