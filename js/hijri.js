// ============================================================
// تحويل التاريخ الميلادي إلى الهجري
// خوارزمية معيارية تدعم التقويم الأم القرى
// ============================================================

var Hijri = (function () {

  function toHijri(year, month, day) {
    var jd = _gregorianToJD(year, month, day);
    return _jdToHijri(jd);
  }

  function fromDate(date) {
    return toHijri(date.getFullYear(), date.getMonth() + 1, date.getDate());
  }

  function format(year, month, day, monthNames) {
    var names = monthNames || CONFIG.HIJRI_MONTHS;
    return day + ' ' + names[month - 1] + ' ' + year + ' هـ';
  }

  function formatDate(date, monthNames) {
    var h = fromDate(date);
    return format(h.year, h.month, h.day, monthNames);
  }

  function _gregorianToJD(year, month, day) {
    if (month <= 2) { year--; month += 12; }
    var A = Math.floor(year / 100);
    var B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (year + 4716)) +
           Math.floor(30.6001 * (month + 1)) +
           day + B - 1524;
  }

  function _jdToHijri(jd) {
    var l  = jd - 1948440 + 10632;
    var n  = Math.floor((l - 1) / 10631);
    l      = l - 10631 * n + 354;
    var j  = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
             Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
    l      = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
             Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
    var hYear  = 30 * n + j - 30;
    var hMonth = Math.floor((24 * l) / 709);
    var hDay   = l - Math.floor((709 * hMonth) / 24);
    return { year: hYear, month: hMonth, day: hDay };
  }

  return { toHijri: toHijri, fromDate: fromDate, format: format, formatDate: formatDate };
})();
