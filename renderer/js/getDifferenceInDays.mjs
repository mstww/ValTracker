/**
 * Function that returns the difference in days between to unix timestamps.
 * @param {Number} date1 
 * @param {Number} date2 
 */

export default function getDifferenceInDays(date1, date2) {
  const diffInMs = Math.abs(date2 - date1);
  return Math.round(diffInMs / (1000 * 60 * 60 * 24));
}