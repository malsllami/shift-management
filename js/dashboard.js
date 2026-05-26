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
      if (!res.success) return;
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
      '<div class="welcome-shift-status">' + _shiftStatusCard(d.todayShifts) + '</div>' +
    '</div>';

    // بطاقة المتواجدين الآن (للمدير والمشرف والإداري)
    if (role === 'مدير' || role === 'مشرف' || role === 'اداري') {
      html += '<div class="dash-card present-card">' +
        '<div class="card-icon present-icon">👥</div>' +
        '<div class="card-body">' +
          '<div class="card-label">المتواجدون الآن</div>' +
          '<div class="card-value">' + d.present.total + '</div>' +
          '<div class="card-sub">' +
            '<span class="morning-badge">☀ صباح: ' + d.present['صباح'] + '</span>' +
            '<span class="evening-badge">🌙 مساء: ' + d.present['مساء'] + '</span>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    // بطاقة الطلبات اليومية (مع مؤشر تحذيري)
    if (role === 'مدير' || role === 'مشرف') {
      var dailyPct  = Math.min(100, Math.round(d.dailyReqs  / d.dailyLimit  * 100));
      var weeklyPct = Math.min(100, Math.round(d.weeklyReqs / d.weeklyLimit * 100));

      html += '<div class="dash-card requests-card">' +
        '<div class="card-icon">📋</div>' +
        '<div class="card-body">' +
          '<div class="card-label">الطلبات</div>' +
          '<div class="req-row">' +
            '<span class="req-label">اليوم</span>' +
            '<div class="progress-bar">' +
              '<div class="progress-fill ' + _progressClass(dailyPct) + '" style="width:' + dailyPct + '%"></div>' +
            '</div>' +
            '<span class="req-count ' + _countClass(dailyPct) + '">' + d.dailyReqs + '/' + d.dailyLimit + '</span>' +
          '</div>' +
          '<div class="req-row">' +
            '<span class="req-label">الأسبوع</span>' +
            '<div class="progress-bar">' +
              '<div class="progress-fill ' + _progressClass(weeklyPct) + '" style="width:' + weeklyPct + '%"></div>' +
            '</div>' +
            '<span class="req-count ' + _countClass(weeklyPct) + '">' + d.weeklyReqs + '/' + d.weeklyLimit + '</span>' +
          '</div>' +
        '</div>' +
      '</div>';

      // بطاقة الطلبات المعلقة
      html += '<div class="dash-card pending-card">' +
        '<div class="card-icon">⏳</div>' +
        '<div class="card-body">' +
          '<div class="card-label">قيد المراجعة</div>' +
          '<div class="pending-row">' +
            '<span class="pending-item leave-pending" onclick="App.navigate(\'leaves\')">' +
              '<span class="pending-num">' + d.pendingLeave + '</span>' +
              '<span class="pending-lbl">إجازة</span>' +
            '</span>' +
            '<span class="pending-item ot-pending" onclick="App.navigate(\'overtime\')">' +
              '<span class="pending-num">' + d.pendingOT + '</span>' +
              '<span class="pending-lbl">أوفرتايم</span>' +
            '</span>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    // بطاقة رصيد الإجازات للموظف
    if (role === 'موظف' || !Auth.isAdminMode()) {
      API.getEmployee().then(function(res) {
        if (!res.success) return;
        var emp = res.data;
        var leaveCard = document.getElementById('leave-balance-card');
        if (leaveCard) {
          leaveCard.querySelector('.card-value').textContent = emp['رصيد الاجازات السنوية'] || 0;
          leaveCard.querySelector('.remaining-val').textContent = emp['المتبقي من الاجازات'] || 0;
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

  function _shiftStatusCard(shifts) {
    if (!shifts) return '';
    var sc = CONFIG.STATUS_COLORS;
    return '<div class="today-shifts">' +
      ['أ','ب','ج','د'].map(function(s) {
        var key    = { 'أ': 'أ', 'ب': 'ب', 'ج': 'ج', 'د': 'د' }[s];
        var status = shifts[key] || 'إجازة';
        var c      = sc[status] || sc['إجازة'];
        var icon   = status === 'صباح' ? '☀' : (status === 'مساء' ? '🌙' : '—');
        return '<div class="today-shift-item" style="background:' + c.bg + ';border:1px solid ' + c.badge + ';color:' + c.text + '">' +
          '<span class="ts-shift">وردية ' + s + '</span>' +
          '<span class="ts-status">' + icon + ' ' + status + '</span>' +
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

  function _progressClass(pct) {
    if (pct >= 90) return 'progress-danger';
    if (pct >= 70) return 'progress-warn';
    return 'progress-safe';
  }

  function _countClass(pct) {
    if (pct >= 90) return 'count-danger';
    if (pct >= 70) return 'count-warn';
    return 'count-safe';
  }

  function _roleClass(role) {
    var map = { 'مدير': 'admin', 'مشرف': 'supervisor', 'موظف': 'employee', 'اداري': 'viewer' };
    return map[role] || 'employee';
  }

  return { render: render };
})();
