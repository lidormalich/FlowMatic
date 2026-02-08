import { HebrewCalendar, HDate } from 'hebcal';

export const convertToHebrewDate = (date) => {
    const hDate = new HDate(date);
    return hDate.toString('h');
};
export const convertToHebrewDateWithHolidays = (date) => {
    const hDate = new HDate(date);
    const holidays = HebrewCalendar.getHolidaysOnDate(hDate);
    let holidayStr = '';
    if (holidays && holidays.length > 0) {
        holidayStr = ' - ' + holidays.map(holiday => holiday.getDesc('he')).join(', ');
    }
    return hDate.toString('h') + holidayStr;
};