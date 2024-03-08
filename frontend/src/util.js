export const addHoursToDate = (h, date) => {
  date.setTime(date.getTime() + h * 60 * 60 * 1000);
  return date;
};
