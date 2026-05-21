export const monthsList = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const getMonthsForYear = (year) => {
  const startIndex = year === 2026 ? 3 : 0; // 3 = April
  return monthsList.slice(startIndex).map((name, i) => ({ name, index: startIndex + i }));
};
