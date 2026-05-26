// ============================================================
// التقويم — كل يوم بطاقة مستقلة (هجري + ميلادي + حالة الورديات)
// ============================================================

var Calendar = (function () {

  var _currentYear   = new Date().getFullYear();
  var _currentMonth  = new Date().getMonth() + 1;
  var _scheduleData  = null;
  var _selectedShift = 'all';
  var _containerId   = null;

  function init(containerId) {
    _containerId = containerId;
    _renderShell(containerId);
    _load(containerId);
  }

  // ---- Shell (navigation + filters) ----

  function _renderShell(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;

    el.innerHTML =
      '<div class="calendar-wrapper">' +
        '<div class="calendar-header">' +
          '<button class="btn-icon" id="cal-prev">&#8249;</button>' +
          '<span class="calendar-title" id="cal-month-year"></span>' +
          '<button class="btn-icon" id="cal-next">&#8250;</button>' +
        '</div>' +
        '<div class="shift-filter" id="shift-filter">' +
          '<button class="shift-btn active" data-shift="all">الكل</button>' +
          '<button class="shift-btn shift-a" data-shift="a">وردية أ</button>' +
          '<button class="shift-btn shift-b" data-shift="b">وردية ب</button>' +
          '<button class="shift-btn shift-c" data-shift="c">وردية ج</button>' +
          '<button class="shift-btn shift-d" data-shift="d">وردية د</button>' +
        '</div>' +
        '<div class="calendar-day-headers">' +
          CONFIG.DAYS_AR.map(function(d) {
            return '<div class="day-header">' + d + '</div>';
          }).join('') +
        '</div>' +
        '<div class="calendar-grid" id="calendar-grid">' +
          '<div class="cal-loading"><div class="spinner"></div><span>جارٍ التحميل...</span></div>' +
        '</div>' +
        '<div class="calendar-summary" id="calendar-summary"></div>' +
      '</div>';

    document.getElementById('cal-prev').onclick = function() {
      _currentMonth--;
      if (_currentMonth < 1) { _currentMonth = 12; _currentYear--; }
      _load(containerId);
    };
    document.getElementById('cal-next').onclick = function() {
      _currentMonth++;
      if (_currentMonth > 12) { _currentMonth = 1; _currentYear++; }
      _load(containerId);
    };

    el.querySelectorAll('.shift-btn').forEach(function(btn) {
      btn.onclick = function() {
        _selectedShift = this.dataset.shift;
        el.querySelectorAll('.shift-btn').forEach(function(b) { b.classList.remove('active'); });
        this.classList.add('active');
        if (_scheduleData) _renderDays(_scheduleData);
      };
    });
  }

  // ---- Load from API ----

  function _load(containerId) {
    var grid = document.getElementById('calendar-grid');
    if (grid) grid.innerHTML = '<div class="cal-loading"><div class="spinner"></div><span>جارٍ التحميل...</span></div>';

    var titleEl = document.getElementById('cal-month-year');
    if (titleEl) titleEl.textContent = CONFIG.MONTHS_AR[_currentMonth - 1] + ' ' + _currentYear;

    API.getSchedule(_currentYear, _currentMonth).then(function(res) {
      if (!res.ok) {
        if (grid) grid.innerHTML = '<div class="cal-error">تعذر تحميل البيانات — تحقق من الاتصال</div>';
        return;
      }
      _scheduleData = res;
      _renderDays(res);
    });
  }

  // ---- Render day cards ----

  function _renderDays(res) {
    var grid = document.getElementById('calendar-grid');
    if (!grid) return;

    var schedule = res.schedule;
    var colors   = res.colors || {};

    var today    = new Date();
    var todayStr = today.getFullYear() + '-' + _pad(today.getMonth() + 1) + '-' + _pad(today.getDate());

    // First day-of-week offset (0=Sun)
    var firstDow = new Date(_currentYear, _currentMonth - 1, 1).getDay();
    var html = '';

    // Empty cells before first day
    for (var e = 0; e < firstDow; e++) {
      html += '<div class="cal-cell cal-empty"></div>';
    }

    schedule.forEach(function(day) {
      var date    = new Date(day.date);
      var hijri   = Hijri.fromDate(date);
      var isToday = day.date === todayStr;
      var dayNum  = parseInt(day.date.split('-')[2]);

      html += '<div class="cal-card' + (isToday ? ' cal-today' : '') + '">' +
        // ---- Header: day name + number ----
        '<div class="cal-card-head">' +
          '<span class="cal-day-name">' + CONFIG.DAYS_AR[date.getDay()] + '</span>' +
          '<span class="cal-day-num' + (isToday ? ' today-num' : '') + '">' + dayNum + '</span>' +
        '</div>' +
        // ---- Hijri date ----
        '<div class="cal-hijri-date">' +
          hijri.day + ' ' + CONFIG.HIJRI_MONTHS[hijri.month - 1] +
        '</div>' +
        // ---- Shift rows ----
        '<div class="cal-shifts-rows">' + _buildShiftRows(day, colors) + '</div>' +
      '</div>';
    });

    grid.innerHTML = html;
    _renderSummary(res.summary, colors);
  }

  function _buildShiftRows(day, colors) {
    var entries = [
      { key: 'a', en: day.a },
      { key: 'b', en: day.b },
      { key: 'c', en: day.c },
      { key: 'd', en: day.d }
    ];
    var html = '';
    entries.forEach(function(s) {
      if (_selectedShift !== 'all' && _selectedShift !== s.key) return;
      var sc    = CONFIG.STATUS[s.en] || CONFIG.STATUS.off;
      var shift = CONFIG.SHIFTS[s.key] || {};
      html += '<div class="cal-shift-row">' +
        '<span class="cal-shift-label" style="background:' + (colors[s.key] || shift.solid || '#999') + '">' +
          (shift.label || s.key) +
        '</span>' +
        '<span class="cal-status-badge" style="background:' + sc.bg + ';color:' + sc.text + ';border-color:' + sc.badge + '">' +
          sc.icon + ' ' + sc.label +
        '</span>' +
      '</div>';
    });
    return html;
  }

  // ---- Summary table ----

  function _renderSummary(summary, colors) {
    var el = document.getElementById('calendar-summary');
    if (!el || !summary) return;

    var keys = _selectedShift === 'all' ? ['a','b','c','d'] : [_selectedShift];
    var html = '<div class="summary-title">ملخص الشهر</div><div class="summary-grid">';

    keys.forEach(function(k) {
      var data  = summary[k] || {};
      var shift = CONFIG.SHIFTS[k] || {};
      var color = colors[k] || shift.solid || '#999';
      html += '<div class="summary-card" style="border-top:3px solid ' + color + '">' +
        '<div class="summary-shift-label" style="color:' + color + '">وردية ' + (shift.label || k) + '</div>' +
        '<div class="summary-stats">' +
          '<div class="stat-row morning-stat"><span>' + (CONFIG.STATUS.morning.icon) + ' صباح</span><b>' + (data.morning || 0) + '</b></div>' +
          '<div class="stat-row evening-stat"><span>' + (CONFIG.STATUS.evening.icon) + ' مساء</span><b>' + (data.evening || 0) + '</b></div>' +
          '<div class="stat-row off-stat"><span>' + (CONFIG.STATUS.off.icon) + ' إجازة</span><b>' + (data.off || 0) + '</b></div>' +
        '</div>' +
      '</div>';
    });

    html += '</div>';
    el.innerHTML = html;
  }

  function _pad(n) { return n < 10 ? '0' + n : String(n); }

  return { init: init };
})();
