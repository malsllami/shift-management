// ============================================================
// مكوّن التقويم الديناميكي - هجري + ميلادي + حالة الورديات
// ============================================================

var Calendar = (function () {

  var _currentYear  = new Date().getFullYear();
  var _currentMonth = new Date().getMonth() + 1;
  var _scheduleData = null;
  var _selectedShift = 'all'; // 'all' | 'أ' | 'ب' | 'ج' | 'د'

  function init(containerId) {
    _render(containerId);
    _load(containerId);
  }

  function _load(containerId) {
    _showLoading(containerId);
    API.getSchedule(_currentYear, _currentMonth).then(function(res) {
      if (res.success) {
        _scheduleData = res;
        _renderCalendar(containerId, res);
      }
    });
  }

  function _showLoading(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var calEl = el.querySelector('.calendar-grid');
    if (calEl) calEl.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
  }

  function _render(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;

    el.innerHTML =
      '<div class="calendar-wrapper">' +
        '<div class="calendar-header">' +
          '<button class="btn-icon" id="cal-prev">&#8249;</button>' +
          '<div class="calendar-title">' +
            '<span id="cal-month-year"></span>' +
          '</div>' +
          '<button class="btn-icon" id="cal-next">&#8250;</button>' +
        '</div>' +
        '<div class="shift-filter" id="shift-filter">' +
          '<button class="shift-btn active" data-shift="all">الكل</button>' +
          '<button class="shift-btn shift-a" data-shift="أ">وردية أ</button>' +
          '<button class="shift-btn shift-b" data-shift="ب">وردية ب</button>' +
          '<button class="shift-btn shift-c" data-shift="ج">وردية ج</button>' +
          '<button class="shift-btn shift-d" data-shift="د">وردية د</button>' +
        '</div>' +
        '<div class="calendar-day-headers">' +
          CONFIG.DAYS_AR.map(function(d) {
            return '<div class="day-header">' + d + '</div>';
          }).join('') +
        '</div>' +
        '<div class="calendar-grid" id="calendar-grid"></div>' +
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
        if (_scheduleData) _renderCalendar(containerId, _scheduleData);
      };
    });
  }

  function _renderCalendar(containerId, res) {
    var el    = document.getElementById(containerId);
    if (!el) return;

    var grid  = document.getElementById('calendar-grid');
    var title = document.getElementById('cal-month-year');
    var schedule = res.schedule;
    var colors   = res.settings;

    title.textContent = CONFIG.MONTHS_AR[_currentMonth - 1] + ' ' + _currentYear;

    // يوم الأسبوع لأول يوم في الشهر
    var firstDay = new Date(_currentYear, _currentMonth - 1, 1).getDay();
    var html     = '';

    // خلايا فارغة قبل اليوم الأول
    for (var e = 0; e < firstDay; e++) {
      html += '<div class="cal-cell empty"></div>';
    }

    var today = new Date();
    var todayStr = today.getFullYear() + '-' +
                   _pad(today.getMonth() + 1) + '-' +
                   _pad(today.getDate());

    schedule.forEach(function(day) {
      var hijri    = Hijri.fromDate(new Date(day.date));
      var isToday  = day.date === todayStr;

      var shifts = _getShiftsToShow(day, colors);

      html += '<div class="cal-cell' + (isToday ? ' today' : '') + '">' +
        '<div class="cal-date">' +
          '<span class="cal-day-num">' + parseInt(day.date.split('-')[2]) + '</span>' +
          '<span class="cal-hijri">' + hijri.day + ' ' + CONFIG.HIJRI_MONTHS[hijri.month-1] + '</span>' +
        '</div>' +
        '<div class="cal-shifts">' + shifts + '</div>' +
      '</div>';
    });

    grid.innerHTML = html;

    // ملخص الشهر
    _renderSummary(res.summary, colors);
  }

  function _getShiftsToShow(day, colors) {
    var shiftMap = [
      { key: 'أ', status: day.shiftA, color: colors.colorA },
      { key: 'ب', status: day.shiftB, color: colors.colorB },
      { key: 'ج', status: day.shiftC, color: colors.colorC },
      { key: 'د', status: day.shiftD, color: colors.colorD }
    ];

    var html = '';
    shiftMap.forEach(function(s) {
      if (_selectedShift !== 'all' && s.key !== _selectedShift) return;
      var sc = CONFIG.STATUS_COLORS[s.status] || CONFIG.STATUS_COLORS['إجازة'];
      html += '<span class="shift-badge" style="background:' + sc.bg + ';color:' + sc.text + ';border:1px solid ' + sc.badge + '">' +
        s.key + ':' + _statusIcon(s.status) +
      '</span>';
    });
    return html;
  }

  function _statusIcon(status) {
    if (status === 'صباح')  return '☀';
    if (status === 'مساء')  return '🌙';
    return '—';
  }

  function _renderSummary(summary, colors) {
    var el = document.getElementById('calendar-summary');
    if (!el) return;

    var shifts = ['أ', 'ب', 'ج', 'د'];
    if (_selectedShift !== 'all') shifts = [_selectedShift];

    var html = '<div class="summary-title">ملخص الشهر</div>' +
               '<div class="summary-grid">';

    shifts.forEach(function(s) {
      var data  = summary[s] || {};
      var colorMap = { 'أ': colors.colorA, 'ب': colors.colorB, 'ج': colors.colorC, 'د': colors.colorD };
      html += '<div class="summary-card" style="border-right:4px solid ' + colorMap[s] + '">' +
        '<div class="summary-shift" style="color:' + colorMap[s] + '">وردية ' + s + '</div>' +
        '<div class="summary-stats">' +
          '<span class="stat-item morning-stat">☀ صباح: <b>' + (data['صباح'] || 0) + '</b></span>' +
          '<span class="stat-item evening-stat">🌙 مساء: <b>' + (data['مساء'] || 0) + '</b></span>' +
          '<span class="stat-item off-stat">— إجازة: <b>' + (data['إجازة'] || 0) + '</b></span>' +
        '</div>' +
      '</div>';
    });

    html += '</div>';
    el.innerHTML = html;
  }

  function _pad(n) { return n < 10 ? '0' + n : String(n); }

  return { init: init };
})();
