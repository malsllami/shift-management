// ============================================================
// App controller — routing, navigation, shell rendering
// ============================================================

var App = (function () {

  var _currentView = null;
  var _history     = [];

  // ---- Public API ----

  function init() {
    if (Auth.restore()) {
      _showApp();
      navigate('dashboard');
    } else {
      showLogin();
    }
  }

  function showLogin() {
    _hideAll();
    document.getElementById('screen-login').style.display = 'flex';
    document.getElementById('screen-app').style.display   = 'none';
    _renderLoginForm();
  }

  function navigate(viewName, params) {
    if (_currentView) _history.push(_currentView);
    _currentView = viewName;
    _renderView(viewName, params);
    _updateNav(viewName);
  }

  function goBack() {
    if (_history.length > 0) {
      var prev = _history.pop();
      _currentView = prev;
      _renderView(prev);
      _updateNav(prev);
    } else {
      navigate('dashboard');
    }
  }

  // ---- Login ----

  function _renderLoginForm() {
    var el = document.getElementById('login-form-container');
    if (!el) return;
    el.innerHTML =
      '<form id="login-form" novalidate>' +
        '<div class="login-field">' +
          '<label>الرقم الوظيفي</label>' +
          '<input type="text" id="login-empid" class="login-input" placeholder="أدخل رقمك الوظيفي" required>' +
        '</div>' +
        '<div class="login-field">' +
          '<label>كلمة المرور</label>' +
          '<input type="password" id="login-pass" class="login-input" placeholder="••••••••" required>' +
        '</div>' +
        '<div id="login-error" class="login-error" style="display:none"></div>' +
        '<button type="submit" class="btn-login" id="btn-login">دخول</button>' +
      '</form>';

    document.getElementById('login-form').onsubmit = function(e) {
      e.preventDefault();
      var empId    = document.getElementById('login-empid').value.trim();
      var password = document.getElementById('login-pass').value;
      var errEl    = document.getElementById('login-error');
      var btn      = document.getElementById('btn-login');

      if (!empId || !password) {
        errEl.textContent = 'الرجاء إدخال الرقم الوظيفي وكلمة المرور';
        errEl.style.display = 'block'; return;
      }
      btn.disabled = true; btn.textContent = 'جارٍ الدخول...';
      errEl.style.display = 'none';

      Auth.login(empId, password).then(function(res) {
        btn.disabled = false; btn.textContent = 'دخول';
        if (res.ok) {
          if (res.force_change) {
            _renderChangePasswordForm();
          } else {
            _showApp();
            navigate('dashboard');
          }
        } else {
          errEl.textContent = _mapError(res.error);
          errEl.style.display = 'block';
        }
      });
    };
  }

  function _renderChangePasswordForm() {
    var el = document.getElementById('login-form-container');
    if (!el) return;
    el.innerHTML =
      '<div class="change-pass-notice">🔒 يجب تغيير كلمة المرور الافتراضية قبل المتابعة</div>' +
      '<form id="chpass-form" novalidate>' +
        '<div class="login-field">' +
          '<label>كلمة المرور الجديدة</label>' +
          '<input type="password" id="chpass-new" class="login-input" placeholder="6 أحرف على الأقل" required>' +
        '</div>' +
        '<div class="login-field">' +
          '<label>تأكيد كلمة المرور</label>' +
          '<input type="password" id="chpass-confirm" class="login-input" placeholder="••••••••" required>' +
        '</div>' +
        '<div id="chpass-error" class="login-error" style="display:none"></div>' +
        '<button type="submit" class="btn-login" id="btn-chpass">تغيير وحفظ</button>' +
      '</form>';

    document.getElementById('chpass-form').onsubmit = function(e) {
      e.preventDefault();
      var newPass = document.getElementById('chpass-new').value;
      var confirm = document.getElementById('chpass-confirm').value;
      var errEl   = document.getElementById('chpass-error');
      var btn     = document.getElementById('btn-chpass');

      if (newPass.length < 6) {
        errEl.textContent = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
        errEl.style.display = 'block'; return;
      }
      if (newPass !== confirm) {
        errEl.textContent = 'كلمتا المرور غير متطابقتين';
        errEl.style.display = 'block'; return;
      }

      btn.disabled = true; btn.textContent = 'جارٍ الحفظ...';
      errEl.style.display = 'none';

      API.changePassword(newPass).then(function(res) {
        btn.disabled = false; btn.textContent = 'تغيير وحفظ';
        if (res.ok) {
          _showApp();
          navigate('dashboard');
        } else {
          var errMap = {
            password_too_short:       'كلمة المرور قصيرة جداً (6 أحرف على الأقل)',
            password_same_as_default: 'لا يمكن استخدام كلمة المرور الافتراضية'
          };
          errEl.textContent = errMap[res.error] || _mapError(res.error);
          errEl.style.display = 'block';
        }
      });
    };
  }

  function _mapError(code) {
    var map = {
      invalid_credentials: 'رقم وظيفي أو كلمة مرور غير صحيحة',
      session_expired:     'انتهت الجلسة — يرجى تسجيل الدخول مجدداً',
      forbidden:           'غير مصرح لك بهذا الإجراء',
      not_found:           'البيانات غير موجودة',
      duplicate_id:        'الرقم الوظيفي موجود مسبقاً',
      network_error:       'خطأ في الاتصال — تحقق من الإنترنت'
    };
    return map[code] || ('حدث خطأ: ' + code);
  }

  // ---- App shell ----

  function _showApp() {
    document.getElementById('screen-login').style.display = 'none';
    document.getElementById('screen-app').style.display   = 'flex';
    _renderShell();
  }

  function _renderShell() {
    var user = Auth.getUser();
    var role = Auth.getEffectiveRole();

    // Header user info
    var headerUser = document.getElementById('header-user');
    if (headerUser) {
      headerUser.innerHTML =
        '<span class="header-name">' + user.name + '</span>' +
        '<span class="header-role role-' + _roleClass(role) + '">' + role + '</span>';
    }

    // Sidebar
    _renderSidebar(role, user);

    // Toggle button (admin/supervisor only)
    var toggleBtn = document.getElementById('toggle-mode-btn');
    if (toggleBtn) {
      if (Auth.canToggleMode()) {
        toggleBtn.style.display = 'flex';
        _updateToggleBtn(toggleBtn);
        toggleBtn.onclick = function() {
          Auth.toggleMode();
          var newRole = Auth.getEffectiveRole();
          _updateToggleBtn(toggleBtn);
          _renderSidebar(newRole, user);
          navigate('dashboard');
          _showHeaderRole(newRole);
        };
      } else {
        toggleBtn.style.display = 'none';
      }
    }

    // Logout
    var logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) logoutBtn.onclick = function() {
      if (confirm('تأكيد تسجيل الخروج؟')) { Auth.logout(); showLogin(); }
    };

    // Notifications badge
    _loadNotifBadge();
  }

  function _showHeaderRole(role) {
    var el = document.getElementById('header-user');
    if (!el) return;
    var badge = el.querySelector('.header-role');
    if (badge) {
      badge.className = 'header-role role-' + _roleClass(role);
      badge.textContent = role;
    }
  }

  function _updateToggleBtn(btn) {
    var isAdmin = Auth.isAdminMode();
    btn.textContent = isAdmin ? '👤 وضع الموظف' : '🛡️ وضع الإدارة';
    btn.title = isAdmin ? 'انتقل إلى واجهة الموظف' : 'انتقل إلى واجهة الإدارة';
  }

  function _renderSidebar(role, user) {
    var nav = document.getElementById('sidebar-nav');
    if (!nav) return;

    var items = [
      { id:'dashboard',    icon:'🏠', label:'الرئيسية',        always:true },
      { id:'calendar',     icon:'📅', label:'التقويم',          always:true },
      { id:'leaves',       icon:'🏖️', label:'طلبات الإجازات',   always:true },
      { id:'overtime',     icon:'⏱️', label:'الأوفرتايم',       always:true },
      { id:'employees',    icon:'👥', label:'الموظفون',         roles:['مدير','مشرف','اداري'] },
      { id:'notifications',icon:'🔔', label:'الإشعارات',        always:true },
      { id:'settings',     icon:'⚙️', label:'الإعدادات',        roles:['مدير'] }
    ];

    nav.innerHTML = items.map(function(item) {
      if (!item.always && item.roles && item.roles.indexOf(role) === -1) return '';
      return '<button class="nav-item" data-view="' + item.id + '" title="' + item.label + '">' +
        '<span class="nav-icon">' + item.icon + '</span>' +
        '<span class="nav-label">' + item.label + '</span>' +
        (item.id === 'notifications' ? '<span class="notif-dot" id="notif-dot" style="display:none"></span>' : '') +
      '</button>';
    }).join('');

    nav.querySelectorAll('.nav-item').forEach(function(btn) {
      btn.onclick = function() { navigate(this.dataset.view); };
    });
  }

  function _updateNav(viewName) {
    document.querySelectorAll('.nav-item').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });
  }

  function _loadNotifBadge() {
    API.getNotifications().then(function(res) {
      if (!res.ok) return;
      var unread = res.data.filter(function(n) { return n.status === 'unread'; }).length;
      var dot    = document.getElementById('notif-dot');
      if (dot) dot.style.display = unread > 0 ? 'block' : 'none';
    });
  }

  // ---- View rendering ----

  function _renderView(viewName, params) {
    var main = document.getElementById('main-content');
    if (!main) return;

    var role = Auth.getEffectiveRole();
    var html = _viewHTML(viewName, role);
    main.innerHTML = html;

    switch (viewName) {
      case 'dashboard':
        Dashboard.render('view-content');
        break;
      case 'calendar':
        Calendar.init('view-content');
        break;
      case 'employees':
        _renderEmployeeList('view-content');
        break;
      case 'employee-form':
        Forms.renderEmployeeForm('view-content', params ? params.emp : null, !!params);
        break;
      case 'employee-view':
        _renderEmployeeProfile('view-content', params);
        break;
      case 'leaves':
        Forms.renderLeaveList('view-content');
        break;
      case 'leave-form':
        Forms.renderLeaveForm('view-content');
        break;
      case 'overtime':
        Forms.renderOvertimeList('view-content');
        break;
      case 'overtime-form':
        Forms.renderOvertimeForm('view-content');
        break;
      case 'notifications':
        _renderNotifications('view-content');
        break;
      case 'settings':
        _renderSettings('view-content');
        break;
      case 'profile':
        _renderProfile('view-content');
        break;
    }
  }

  function _viewHTML(viewName, role) {
    var titles = {
      dashboard:     'الرئيسية',
      calendar:      'التقويم',
      employees:     'الموظفون',
      'employee-form': 'بيانات الموظف',
      'employee-view': 'ملف الموظف',
      leaves:        'طلبات الإجازات',
      'leave-form':  'طلب إجازة',
      overtime:      'طلبات الأوفرتايم',
      'overtime-form':'طلب أوفرتايم',
      notifications: 'الإشعارات',
      settings:      'الإعدادات',
      profile:       'ملفي الشخصي'
    };
    var title  = titles[viewName] || viewName;
    var addBtn = '';
    if (viewName === 'employees' && (role === 'مدير' || role === 'مشرف')) {
      addBtn = '<button class="btn-add" onclick="App.navigate(\'employee-form\')">+ إضافة موظف</button>';
    }
    if (viewName === 'leaves') {
      addBtn = '<button class="btn-add" onclick="App.navigate(\'leave-form\')">+ طلب إجازة</button>';
    }
    if (viewName === 'overtime') {
      addBtn = '<button class="btn-add" onclick="App.navigate(\'overtime-form\')">+ طلب أوفرتايم</button>';
    }
    return '<div class="view-header"><h1 class="view-title">' + title + '</h1>' + addBtn + '</div>' +
           '<div id="view-content" class="view-body"></div>';
  }

  // ---- Employee list ----

  function _renderEmployeeList(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
    window._empCache = {};

    API.getEmployees().then(function(res) {
      if (!res.ok) { el.innerHTML = '<div class="error-state">' + _mapError(res.error) + '</div>'; return; }
      if (!res.data.length) { el.innerHTML = '<div class="empty-state">لا يوجد موظفون مسجلون</div>'; return; }

      // Filter bar
      var html = '<div class="list-filters">' +
        '<input type="text" id="emp-search" class="search-input" placeholder="بحث بالاسم أو الرقم...">' +
        '<select id="emp-shift-filter" class="filter-select">' +
          '<option value="">كل الورديات</option>' +
          ['a','b','c','d'].map(function(k) {
            return '<option value="' + CONFIG.SHIFTS[k].label + '">وردية ' + CONFIG.SHIFTS[k].label + '</option>';
          }).join('') +
        '</select>' +
      '</div>';

      html += '<div class="emp-cards-grid" id="emp-grid">';
      res.data.forEach(function(emp) {
        window._empCache[String(emp.empId)] = emp;
        html += _empCard(emp);
      });
      html += '</div>';
      el.innerHTML = html;

      // Search filter
      document.getElementById('emp-search').oninput = function() {
        _filterEmpCards(res.data);
      };
      document.getElementById('emp-shift-filter').onchange = function() {
        _filterEmpCards(res.data);
      };
    });
  }

  function _empCard(emp) {
    var shiftKey  = _shiftLetterToKey(emp.shift);
    var shiftCfg  = CONFIG.SHIFTS[shiftKey] || CONFIG.SHIFTS.a;
    var fadeStyle = emp.transferFade > 0 ?
      'box-shadow:0 0 0 3px rgba(255,152,0,' + emp.transferFade + ')' : '';

    var workColor  = CONFIG.expiryColor(emp.workDaysLeft);
    var srcColor   = CONFIG.expiryColor(emp.srcDaysLeft);
    var recvColor  = CONFIG.expiryColor(emp.recvDaysLeft);

    return '<div class="emp-card" data-name="' + emp.name + '" data-shift="' + emp.shift + '" style="' + fadeStyle + '">' +
      '<div class="emp-card-header" style="background:' + shiftCfg.solid + '">' +
        '<span class="emp-shift-badge">وردية ' + emp.shift + '</span>' +
        '<span class="emp-name">' + emp.name + '</span>' +
        '<span class="emp-id">' + emp.empId + '</span>' +
      '</div>' +
      '<div class="emp-card-body">' +
        '<div class="emp-field"><span class="ef-label">الجوال</span><span>' + (emp.phone||'—') + '</span></div>' +
        '<div class="emp-field"><span class="ef-label">المنطقة</span><span>' + (emp.region||'—') + '</span></div>' +
        '<div class="emp-field"><span class="ef-label">المركز</span><span>' + (emp.center||'—') + '</span></div>' +
      '</div>' +
      '<div class="emp-card-expiry">' +
        (emp.workDaysLeft !== null ? _expiryBadge('بطاقة العمل', emp.workDaysLeft, workColor) : '') +
        (emp.srcDaysLeft  !== null ? _expiryBadge('بطاقة المصدر', emp.srcDaysLeft, srcColor, '#FFCDD2') : '') +
        (emp.recvDaysLeft !== null ? _expiryBadge('بطاقة المستلم', emp.recvDaysLeft, recvColor, '#FFF9C4') : '') +
      '</div>' +
      '<div class="emp-card-footer">' +
        '<button class="btn-sm btn-view" onclick="App._viewEmp(\'' + emp.empId + '\')">عرض</button>' +
        (Auth.canManage() ? '<button class="btn-sm btn-edit" onclick="App._editEmp(\'' + emp.empId + '\')">تعديل</button>' : '') +
        (Auth.isAdmin()   ? '<button class="btn-sm btn-transfer" onclick="App._transferDialog(\'' + emp.empId + '\',\'' + emp.name + '\')">نقل</button>' : '') +
      '</div>' +
    '</div>';
  }

  function _expiryBadge(label, days, color, forceBg) {
    if (!color) return '';
    var bg = forceBg || color.bg;
    return '<span class="expiry-badge" style="background:' + bg + ';color:' + color.text + '">' +
      label + ': ' + (days >= 0 ? days + ' يوم' : 'منتهية') +
    '</span>';
  }

  function _filterEmpCards(data) {
    var q      = document.getElementById('emp-search').value.toLowerCase();
    var shift  = document.getElementById('emp-shift-filter').value;
    var cards  = document.querySelectorAll('.emp-card');
    var visible = 0;

    cards.forEach(function(card) {
      var name  = (card.dataset.name  || '').toLowerCase();
      var cs    = (card.dataset.shift || '');
      var show  = (!q || name.includes(q)) && (!shift || cs === shift);
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    var empty = document.getElementById('emp-empty');
    if (!empty) {
      empty = document.createElement('div');
      empty.id = 'emp-empty';
      empty.className = 'empty-state';
      empty.textContent = 'لا توجد نتائج';
      document.getElementById('emp-grid').appendChild(empty);
    }
    empty.style.display = visible === 0 ? 'block' : 'none';
  }

  function _viewEmp(empId) {
    var emp = (window._empCache || {})[String(empId)];
    navigate('employee-view', emp || { empId: empId });
  }

  function _editEmp(empId) {
    var emp = (window._empCache || {})[String(empId)];
    if (emp) navigate('employee-form', { emp: emp });
    else API.getEmployee(empId).then(function(r) {
      if (r.ok) navigate('employee-form', { emp: r.data });
    });
  }

  // Transfer dialog
  function _transferDialog(empId, name) {
    var newShift = prompt('نقل ' + name + '\nأدخل الوردية الجديدة (أ / ب / ج / د):');
    if (!newShift) return;
    if (['أ','ب','ج','د'].indexOf(newShift) === -1) {
      alert('الوردية يجب أن تكون: أ أو ب أو ج أو د'); return;
    }
    API.transferEmployee(empId, newShift).then(function(res) {
      _toast(res.ok ? 'تم النقل بنجاح' : _mapError(res.error), res.ok ? 'success' : 'error');
      if (res.ok) navigate('employees');
    });
  }

  // ---- Employee profile ----

  function _renderEmployeeProfile(containerId, emp) {
    var el = document.getElementById(containerId);
    if (!el) return;

    if (!emp) {
      API.getEmployee().then(function(res) {
        if (res.ok) _drawProfile(el, res.data);
      });
    } else {
      _drawProfile(el, emp);
    }
  }

  function _renderProfile(containerId) {
    _renderEmployeeProfile(containerId, null);
  }

  function _drawProfile(el, emp) {
    var shiftKey = _shiftLetterToKey(emp.shift);
    var sc       = CONFIG.SHIFTS[shiftKey] || CONFIG.SHIFTS.a;
    var todayStatus = _getLocalShiftStatus(emp.shift, _todayStr());
    var stc = CONFIG.STATUS[todayStatus] || CONFIG.STATUS.off;

    var html = '<div class="profile-card">' +
      '<div class="profile-header" style="background:' + sc.solid + '">' +
        '<div class="profile-avatar">' + (emp.name[0] || '؟') + '</div>' +
        '<div class="profile-info">' +
          '<h2>' + emp.name + '</h2>' +
          '<p>' + emp.empId + ' — ' + emp.role + '</p>' +
          '<div class="profile-today" style="background:' + stc.bg + ';color:' + stc.text + '">' +
            stc.icon + ' ' + stc.label + ' اليوم' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="profile-sections">';

    // Basic info
    html += _profileSection('البيانات الأساسية', [
      ['الوردية',  'وردية ' + emp.shift],
      ['الجوال',   emp.phone||'—'],
      ['المنطقة',  emp.region||'—'],
      ['المركز',   emp.center||'—'],
      ['السيارة',  emp.car||'—']
    ]);

    // Card expiry
    html += '<div class="profile-section">' +
      '<h3 class="section-title">صلاحية البطاقات</h3>' +
      '<div class="expiry-grid">' +
        _expiryRow('بطاقة العمل',    emp.workExpDate,  emp.workDaysLeft) +
        _expiryRow('بطاقة المصدر',   emp.srcExpDate,   emp.srcDaysLeft,  '#FFCDD2') +
        _expiryRow('بطاقة المستلم',  emp.recvExpDate,  emp.recvDaysLeft, '#FFF9C4') +
      '</div></div>';

    // Leave balances
    html += '<div class="profile-section">' +
      '<h3 class="section-title">أرصدة الإجازات</h3>' +
      '<div class="leave-grid">' +
        _leaveBal('السنوية',       emp.annLeave) +
        _leaveBal('المجدولة',      emp.schedLeave) +
        _leaveBal('المتبقي',       emp.remLeave, true) +
        _leaveBal('مرضي',          emp.sickLeave) +
        _leaveBal('زواج',          emp.marriageLeave) +
        _leaveBal('مولود',         emp.birthLeave) +
        _leaveBal('وفاة',          emp.deathLeave) +
        _leaveBal('اختبارات',      emp.examLeave) +
        _leaveBal('بدل دورة عمل',  emp.shiftSubLeave) +
      '</div></div>';

    // Equipment sizes
    html += _profileSection('المعدات والملابس', [
      ['مقاس CAT 2',          emp.cat2||'—'],
      ['مقاس البنطلون CAT 2', emp.pants||'—'],
      ['مقاس السفتي شوز',     emp.shoes||'—'],
      ['مقاس CAT 4',          emp.cat4||'—']
    ]);

    html += '</div>';  // profile-sections

    if (Auth.canManage() || (Auth.getUser() && Auth.getUser().empId == emp.empId)) {
      window._empCache = window._empCache || {};
      window._empCache[String(emp.empId)] = emp;
      html += '<div class="profile-actions">' +
        '<button class="btn-primary" onclick="App._editEmp(\'' + emp.empId + '\')">تعديل البيانات</button>' +
      '</div>';
    }

    html += '</div>';  // profile-card
    el.innerHTML = html;
  }

  function _profileSection(title, rows) {
    return '<div class="profile-section"><h3 class="section-title">' + title + '</h3>' +
      '<div class="profile-fields">' +
        rows.map(function(r) {
          return '<div class="pf-row"><span class="pf-label">' + r[0] + '</span><span class="pf-val">' + r[1] + '</span></div>';
        }).join('') +
      '</div></div>';
  }

  function _expiryRow(label, date, daysLeft, forceBg) {
    var color = CONFIG.expiryColor(daysLeft);
    if (!color) return '<div class="expiry-row"><span>' + label + '</span><span>—</span></div>';
    var bg = forceBg || color.bg;
    return '<div class="expiry-row" style="background:' + bg + ';color:' + color.text + '">' +
      '<span>' + label + '</span>' +
      '<span>' + (date||'') + '</span>' +
      '<span>' + (daysLeft >= 0 ? daysLeft + ' يوم' : 'منتهية') + '</span>' +
    '</div>';
  }

  function _leaveBal(label, val, highlight) {
    return '<div class="leave-bal' + (highlight ? ' leave-total' : '') + '">' +
      '<span class="lb-val">' + (val !== undefined ? val : '—') + '</span>' +
      '<span class="lb-label">' + label + '</span>' +
    '</div>';
  }

  // ---- Notifications ----

  function _renderNotifications(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

    API.getNotifications().then(function(res) {
      if (!res.ok || !res.data.length) {
        el.innerHTML = '<div class="empty-state">لا توجد إشعارات</div>'; return;
      }
      el.innerHTML = res.data.map(function(n) {
        var cssClass, dotClass;
        if (n.status === 'unread') {
          cssClass = 'notif-unread';
          dotClass = '';
        } else if (n.status === 'actioned') {
          cssClass = 'notif-done';
          dotClass = 'gray';
        } else {
          // read but no action yet — check if it's a request-type notification
          var isRequest = n.type === 'leave_request' || n.type === 'overtime_request';
          cssClass = isRequest ? 'notif-pending-action' : 'notif-done';
          dotClass = isRequest ? 'amber' : 'gray';
        }
        var navType = (n.type === 'overtime_request' || n.type === 'overtime_review') ? 'overtime' : 'leaves';
        return '<div class="notif-item ' + cssClass + '" onclick="App._readNotif(\'' + n.no + '\',\'' + n.type + '\',\'' + n.status + '\',this)">' +
          '<div class="notif-dot-indicator' + (dotClass ? ' ' + dotClass : '') + (n.status !== 'unread' && !dotClass ? ' hidden' : '') + '"></div>' +
          '<div class="notif-body">' +
            '<div class="notif-title">' + n.title + '</div>' +
            '<div class="notif-msg">' + n.msg + '</div>' +
            '<div class="notif-date">' + n.date + '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    });
  }

  function _readNotif(no, type, status, el) {
    if (status === 'unread') {
      API.markNotifRead(no);
      _loadNotifBadge();
    }
    // Navigate to relevant section for request-type notifications
    var dest = (type === 'overtime_request' || type === 'overtime_review') ? 'overtime' : 'leaves';
    navigate(dest);
  }

  // ---- Settings (admin only) ----

  function _renderSettings(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;

    API.getSettings().then(function(res) {
      if (!res.ok) { el.innerHTML = '<div class="error-state">غير مصرح</div>'; return; }
      var cfg = res.data;

      el.innerHTML =
        '<div class="settings-container">' +
          '<form id="settings-form" class="form-grid">' +
            '<div class="form-section-title">إعدادات الدورة</div>' +
            _settingField('تاريخ المرجع',       'ref_date',   cfg.ref_date,   'date') +
            _settingField('موضع وردية أ',        'shift_a_pos',cfg.shift_a_pos,'number') +
            _settingField('موضع وردية ب',        'shift_b_pos',cfg.shift_b_pos,'number') +
            _settingField('موضع وردية ج',        'shift_c_pos',cfg.shift_c_pos,'number') +
            _settingField('موضع وردية د',        'shift_d_pos',cfg.shift_d_pos,'number') +
            '<div class="form-section-title">حدود الطلبات</div>' +
            _settingField('الحد اليومي',         'daily_req_limit',  cfg.daily_req_limit,  'number') +
            _settingField('الحد الأسبوعي',       'weekly_req_limit', cfg.weekly_req_limit, 'number') +
            '<div class="form-section-title">رصيد الإجازات الافتراضي</div>' +
            _settingField('سنوية',               'annual_leave_days',   cfg.annual_leave_days,   'number') +
            _settingField('مرضية',               'sick_leave_days',     cfg.sick_leave_days,     'number') +
            _settingField('زواج',                'marriage_leave_days', cfg.marriage_leave_days, 'number') +
            _settingField('مولود',               'birth_leave_days',    cfg.birth_leave_days,    'number') +
            _settingField('وفاة',                'death_leave_days',    cfg.death_leave_days,    'number') +
            _settingField('اختبارات',            'exam_leave_days',     cfg.exam_leave_days,     'number') +
            '<div class="form-section-title">رموز الترقية (تُحفظ مشفّرة)</div>' +
            _settingField('رمز المدير',    'admin_code',      '', 'password', 'اتركه فارغاً إن لم تُرد تغييره') +
            _settingField('رمز المشرف',   'supervisor_code', '', 'password', 'اتركه فارغاً إن لم تُرد تغييره') +
            _settingField('رمز الإداري',  'viewer_code',     '', 'password', 'اتركه فارغاً إن لم تُرد تغييره') +
            '<div class="form-actions">' +
              '<button type="submit" class="btn-primary">حفظ الإعدادات</button>' +
            '</div>' +
          '</form>' +
        '</div>';

      document.getElementById('settings-form').onsubmit = function(e) {
        e.preventDefault();
        var updates = {};
        this.querySelectorAll('.setting-input').forEach(function(input) {
          if (input.value.trim()) updates[input.dataset.key] = input.value.trim();
        });
        API.updateSettings(updates).then(function(res) {
          _toast(res.ok ? 'تم حفظ الإعدادات' : _mapError(res.error), res.ok ? 'success' : 'error');
        });
      };
    });
  }

  function _settingField(label, key, val, type, placeholder) {
    return '<div class="form-field">' +
      '<label>' + label + '</label>' +
      '<input type="' + (type||'text') + '" class="form-input setting-input" data-key="' + key + '"' +
        ' value="' + (val||'') + '"' + (placeholder ? ' placeholder="' + placeholder + '"' : '') + '>' +
    '</div>';
  }

  // ---- Helpers ----

  function _shiftLetterToKey(letter) {
    return { 'أ':'a','ب':'b','ج':'c','د':'d' }[letter] || 'a';
  }

  var _CYCLE    = ['morning','morning','evening','evening','off','off','off','off'];
  var _REF_POS  = { 'أ':5,'ب':1,'ج':7,'د':3 };
  var _REF_DATE = '2026-05-26';

  function _getLocalShiftStatus(shift, dateStr) {
    var ref  = new Date(_REF_DATE); ref.setHours(0,0,0,0);
    var d    = new Date(dateStr);   d.setHours(0,0,0,0);
    var diff = Math.round((d - ref) / 86400000);
    var pos  = ((_REF_POS[shift] || 0) + diff % 8 + 8) % 8;
    return _CYCLE[pos];
  }

  function _todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + _p(d.getMonth()+1) + '-' + _p(d.getDate());
  }

  function _p(n) { return n < 10 ? '0'+n : String(n); }

  function _roleClass(role) {
    return {'مدير':'admin','مشرف':'supervisor','موظف':'employee','اداري':'viewer'}[role]||'employee';
  }

  function _hideAll() {}

  function _toast(msg, type) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className   = 'toast toast-' + type + ' show';
    setTimeout(function() { t.classList.remove('show'); }, 3500);
  }

  return {
    init: init, showLogin: showLogin, navigate: navigate, goBack: goBack,
    _viewEmp: _viewEmp, _editEmp: _editEmp,
    _transferDialog: _transferDialog, _readNotif: _readNotif
  };
})();

// Boot
document.addEventListener('DOMContentLoaded', function() { App.init(); });
