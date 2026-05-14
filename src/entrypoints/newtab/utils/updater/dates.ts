export const getDefaultDeactivateDate = (): Date => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);

  // we need to check if it is Sunday (0)
if (date.getDay() !== 0) {
  // moving to the next closest Sunday
  const daysUntilSunday = 7 - date.getDay();
  date.setDate(date.getDate() + daysUntilSunday);
}

date.setHours(23,59, 59, 999)
  return date;
}

export const getTodayAtMidnight = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}


export const formatDateForAPI = (date: Date): {date: string, time: string} => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}:${seconds}`
  };
}

export const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export const setDateToSunday23_59 = (date: Date): Date => {
  const newDate = new Date(date);

  if (newDate.getDay() !== 0) {
    const daysUntilSunday = 7 - newDate.getDay();
    newDate.setDate(newDate.getDate() + daysUntilSunday);
  }

  newDate.setHours(23, 59, 59, 999);
  return newDate;
}