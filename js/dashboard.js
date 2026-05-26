// ============================================================
// لوحة التحكم - بطاقات الإحصائيات
// ============================================================

var Dashboard = (function () {

  function render(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;

    var user = Auth.getUser();
    var role = Auth.getEffectiveRole();

    el.innerHTML = '<div class="dashboard-grid" id="dash-grid">' +
      '<div class="loading-card"><div class="spinner"></div><p>جارٍ التحميل...</p></div>' +
    '</div>';

    API.getDashboard().then(function(res) {
      if (!res.ok) {
        var grid = el.querySelector('.dashboard-grid');
        if (grid) grid.innerHTML = '<div class="error-state">تعذر تحميل بيانات اللوحة — ' + (res.error || 'خطأ في الاتصال') + '</div>';
        return;
      }
      var d = res.data;
      _renderCards(el, d, role, user);
    });
  }

  function _renderCards(el, d, role, user) {
    var grid = el.querySelector('.dashboard-grid') || el;

    var html = '';

    // بطاقة الترحيب
    html += '<div class="dash-card welcome-card full-width">' +
      '<div class="welcome-info">' +
        '<div class="welcome-name">مرحباً، ' + user.name + '</div>' +
        '<div class="welcome-role"><span class="role-badge role-' + _roleClass(role) + '">' + role + '</span>' +
          ' — وردية ' + user.shift + '</div>' +
        '<div class="welcome-date">' + _todayLabel() + '</div>' +
      '</div>' +
      '<div class="welcome-shift-status">' + _shiftStatusCard(d.todayShifts, role) + '</div>' +
    '</div>';

    // بطاقة المتواجدين الآن (للمدير والمشرف والإداري)
    if (role === 'مدير' || role === 'مشرف' || role === 'اداري') {
      html += '<div class="dash-card present-card">' +
        '<div class="card-icon present-icon">👥</div>' +
        '<div class="card-body">' +
          '<div class="card-label">المتواجدون الآن</div>' +
          '<div class="card-value">' + d.present.total + '</div>' +
          '<div class="card-sub">' +
            '<span class="morning-badge">☀ صباح: ' + d.present.morning + '</span>' +
            '<span class="evening-badge">🌙 مساء: ' + d.present.evening + '</span>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    // بطاقة الطلبات الأسبوعية (المدير والمشرف)
    if (role === 'مدير' || role === 'مشرف') {
      var weekData = d.weekData || [];
      var limit    = d.dailyLimit || 10;
      var todayStr = (new Date()).toISOString().slice(0, 10);

      var dayBars = weekData.map(function(day) {
        var pct    = limit > 0 ? Math.min(100, Math.round(day.count / limit * 100)) : 0;
        var cls    = pct >= 95 ? 'wday-danger' :
                     pct >= 75 ? 'wday-warn75' :
                     pct >= 65 ? 'wday-warn65' :
                     day.count > 0 ? 'wday-safe' : 'wday-zero';
        var isToday = day.date === todayStr ? ' wday-today' : '';
        var name   = CONFIG.DAYS_AR[day.dow].slice(0, 3);
        return '<div class="week-day-chip ' + cls + isToday + '">' +
          '<span class="wdc-num">' + day.count + '</span>' +
          '<div class="wdc-bar-wrap"><div class="wdc-bar-fill" style="height:' + pct + '%"></div></div>' +
          '<span class="wdc-name">' + name + '</span>' +
        '</div>';
      }).join('');

      html += '<div class="dash-card requests-week-card full-width">' +
        '<div class="card-icon">📋</div>' +
        '<div class="card-body">' +
          '<div class="week-card-top">' +
            '<span class="card-label">الطلبات الأسبوعية</span>' +
            '<span class="week-limit-badge">الحد اليومي: ' + limit + '</span>' +
          '</div>' +
          '<div class="week-chart">' + dayBars + '</div>' +
          '<div class="week-legend">' +
            '<span class="wleg wleg-safe">طبيعي</span>' +
            '<span class="wleg wleg-warn65">تجاوز 65%</span>' +
            '<span class="wleg wleg-warn75">تجاوز 75%</span>' +
            '<span class="wleg wleg-danger">95%+</span>' +
          '</div>' +
        '</div>' +
        // Pending mini section inside same card
        '<div class="week-pending-row">' +
          '<span class="pending-chip leave-pending" onclick="App.navigate(\'leaves\')">' +
            '<span class="pending-num">' + d.pendingLeave + '</span>' +
            '<span class="pending-lbl">إجازة قيد المراجعة</span>' +
          '</span>' +
          '<span class="pending-chip ot-pending" onclick="App.navigate(\'overtime\')">' +
            '<span class="pending-num">' + d.pendingOT + '</span>' +
            '<span class="pending-lbl">أوفرتايم قيد المراجعة</span>' +
          '</span>' +
        '</div>' +
      '</div>';
    }

    // بطاقة رصيد الإجازات للموظف
    if (role === 'موظف' || !Auth.isAdminMode()) {
      API.getEmployee().then(function(res) {
        if (!res.ok) return;
        var emp = res.data;
        var leaveCard = document.getElementById('leave-balance-card');
        if (leaveCard) {
          leaveCard.querySelector('.card-value').textContent = emp.annLeave || 0;
          leaveCard.querySelector('.remaining-val').textContent = emp.remLeave || 0;
        }
      });

      html += '<div class="dash-card leave-card" id="leave-balance-card">' +
        '<div class="card-icon">🏖️</div>' +
        '<div class="card-body">' +
          '<div class="card-label">رصيد الإجازات</div>' +
          '<div class="card-value">—</div>' +
          '<div class="card-sub">' +
            '<span>المتبقي: <b class="remaining-val">—</b> يوم</span>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    // الأزرار السريعة للموظف
    if (role === 'موظف' || !Auth.isAdminMode()) {
      html += '<div class="dash-card quick-actions full-width">' +
        '<div class="card-label">إجراءات سريعة</div>' +
        '<div class="quick-btns">' +
          '<button class="quick-btn" onclick="App.navigate(\'leave-form\')">' +
            '<span class="qb-icon">📅</span><span>طلب إجازة</span>' +
          '</button>' +
          '<button class="quick-btn" onclick="App.navigate(\'overtime-form\')">' +
            '<span class="qb-icon">⏱️</span><span>طلب أوفرتايم</span>' +
          '</button>' +
          '<button class="quick-btn" onclick="App.navigate(\'profile\')">' +
            '<span class="qb-icon">👤</span><span>بياناتي</span>' +
          '</button>' +
          '<button class="quick-btn" onclick="App.navigate(\'calendar\')">' +
            '<span class="qb-icon">📆</span><span>التقويم</span>' +
          '</button>' +
        '</div>' +
      '</div>';
    }

    var grid = el.querySelector('.dashboard-grid');
    if (grid) grid.innerHTML = html;
  }

  function _shiftStatusCard(shifts, role) {
    if (!shifts) return '';
    var keyMap   = { 'أ':'a', 'ب':'b', 'ج':'c', 'د':'d' };
    var canClick = (role === 'مدير' || role === 'مشرف');
    return '<div class="today-shifts">' +
      ['أ','ب','ج','د'].map(function(s) {
        var k   = keyMap[s];
        var en  = shifts[k]         || 'off';
        var ar  = shifts[k + '_ar'] || 'إجازة';
        var sc  = CONFIG.STATUS[en] || CONFIG.STATUS.off;
        var clickAttr = canClick
          ? ' onclick="App.navigate(\'employees\',{filterShift:\'' + s + '\'})" title="عرض موظفي الوردية ' + s + '"'
          : '';
        return '<div class="today-shift-item' + (canClick ? ' shift-clickable' : '') + '"' + clickAttr +
          ' style="background:' + sc.bg + ';border:1px solid ' + sc.badge + ';color:' + sc.text + '">' +
          '<span class="ts-shift">وردية ' + s + '</span>' +
          '<span class="ts-status">' + sc.icon + ' ' + ar + '</span>' +
        '</div>';
      }).join('') +
    '</div>';
  }

  function _todayLabel() {
    var d = new Date();
    var hijri = Hijri.fromDate(d);
    return CONFIG.DAYS_AR[d.getDay()] + '، ' +
           d.getDate() + ' ' + CONFIG.MONTHS_AR[d.getMonth()] + ' ' + d.getFullYear() + ' م  |  ' +
           hijri.day + ' ' + CONFIG.HIJRI_MONTHS[hijri.month-1] + ' ' + hijri.year + ' هـ';
  }

  function _roleClass(role) {
    var map = { 'مدير': 'admin', 'مشرف': 'supervisor', 'موظف': 'employee', 'اداري': 'viewer' };
    return map[role] || 'employee';
  }

  return { render: render };
})();
