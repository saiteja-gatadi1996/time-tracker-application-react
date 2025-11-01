export const pad = (n) => n.toString().padStart(2, '0');
export const formatDate = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const getDateKey = (d) => formatDate(d);
export const hourLabel = (h) => {
  const hour12 = ((h + 11) % 12) + 1;
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${hour12} ${ampm}`;
};
export const timeRange = (h) => {
  const hh = pad(h);
  return { first: `${hh}:00–${hh}:30`, second: `${hh}:30–${hh}:59` };
};
export const isPast = (key) => getDateKey(new Date()) > key;
export const isTodayKey = (key) => getDateKey(new Date()) === key;
export const formatHours = (n) =>
  Number.isInteger(n) ? n : Number(n).toFixed(1);
