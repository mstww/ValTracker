export default function timeToHMS(n, o) {
  n = Number(n);
  var d = Math.floor(n / 86400);
  var h = Math.floor((n - d * 86400) / 3600);
  var m = Math.floor(n % 3600 / 60);
  var s = Math.floor(n % 3600 % 60);

  var dDisplay = d > 0 ? d + (d == 1 ? " " + o.d_1 + ", " : " " + o.d_2 + ", ") : "";
  var hDisplay = h > 0 ? h + (h == 1 ? " " + o.h_1 + ", " : " " + o.h_2 + ", ") : "";
  var mDisplay = m > 0 ? m + (m == 1 ? " " + o.m_1 + ", " : " " + o.m_2 + ", ") : "";
  var sDisplay = s > 0 ? s + (s == 1 ? " " + o.s_1 : " " + o.s_2) : "";
  var str = dDisplay + hDisplay + mDisplay + sDisplay;

  if(str.split(",").pop() === ' ') {
    str = str.substring(0, str.lastIndexOf(','));
  }

  return str;
}