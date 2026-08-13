const addHoursToDate = (h, date) => {
  date.setTime(date.getTime() + h * 60 * 60 * 1000);
  return date;
};

const flip = data =>
  Object.fromEntries(Object.entries(data).map(([key, value]) => [value, key]));

module.exports = { addHoursToDate, flip };
