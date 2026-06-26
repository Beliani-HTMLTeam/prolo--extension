export const getDefaultDeactivateDate = (tabDate?: Date): Date => {  
  const baseDate = tabDate ? new Date(tabDate) : new Date();

  // Always add one month to the base date
  baseDate.setMonth(baseDate.getMonth() + 1);
  
  // Check if it's Sunday (0)
  if (baseDate.getDay() !== 0) {
    // Move to the next closest Sunday
    const daysUntilSunday = 7 - baseDate.getDay();
    baseDate.setDate(baseDate.getDate() + daysUntilSunday);
  }
  
  baseDate.setHours(23, 59, 0, 0);
  return baseDate;
};
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

  newDate.setHours(23, 59, 0, 0);
  return newDate;
}