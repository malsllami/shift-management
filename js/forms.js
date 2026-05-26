// ============================================================
// النماذج: الموظف + الإجازة + الأوفرتايم
// ============================================================

var Forms = (function () {

  // ==================== نموذج إضافة/تعديل موظف ====================

  function renderEmployeeForm(containerId, empData, isEdit) {
    var el   = document.getElementById(containerId);
    if (!el) return;
    var role        = Auth.getEffectiveRole();
    var isAdminEdit = (role === 'مدير' || role === 'مشرف');
    var title = isEdit ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد';

    el.innerHTML =
      '<div class="form-container">' +
        '<div class="form-header"><h2>' + title + '</h2></div>' +
        '<form id="emp-form" class="form-grid" novalidate>' +
          _field('الرقم الوظيفي', 'empId',  empData ? empData.empId   : '', 'text', isEdit, true) +
          _field('الاسم',          'name',   empData ? empData.name    : '', 'text', false, true) +
          _field('رقم الجوال',     'phone',  empData ? empData.phone   : '', 'tel') +
          _shiftSel(empData ? empData.shift : '', isAdminEdit) +
          (isAdminEdit ? _roleSel(empData ? empData.role : 'موظف') : '') +
          _regionSel(empData ? empData.region : '') +
          _field('اسم المركز',    'center', empData ? empData.center   : '') +
          _field('رقم السيارة',   'car',    empData ? empData.car      : '') +
          (!isEdit ? _field('كلمة المرور', 'password', '123456', 'password', false, true) : '') +
          '<div class="form-section-title">الملابس والمعدات</div>' +
          _field('مقاس CAT 2',           'cat2',  empData ? empData.cat2  : '') +
          _field('مقاس البنطلون CAT 2',  'pants', empData ? empData.pants : '') +
          _field('مقاس السفتي شوز',      'shoes', empData ? empData.shoes : '') +
          _field('مقاس CAT 4',           'cat4',  empData ? empData.cat4  : '') +
          '<div class="form-section-title">البطاقات</div>' +
          _field('تاريخ انتهاء بطاقة العمل',   'workExpDate', empData ? CONFIG.fmtDate(empData.workExpDate)  : '', 'date') +
          _field('تاريخ انتهاء بطاقة المصدر',  'srcExpDate',  empData ? CONFIG.fmtDate(empData.srcExpDate)   : '', 'date') +
          _field('تاريخ انتهاء بطاقة المستلم', 'recvExpDate', empData ? CONFIG.fmtDate(empData.recvExpDate)  : '', 'date') +
          (isEdit && isAdminEdit ?
            '<div class="form-section-title">الإجازات</div>' +
            (role === 'مدير' ? _field('رصيد الإجازات السنوية', 'annLeave', empData ? (empData.annLeave || 0) : '') : '') +
            _field('الإجازة المجدولة (مخصوم من المتبقي)', 'schedLeave', empData ? (empData.schedLeave || 0) : '') : '') +
          '<div class="form-actions">' +
            '<button type="submit" class="btn-primary">' + (isEdit ? 'حفظ التعديلات' : 'إضافة الموظف') + '</button>' +
            '<button type="button" class="btn-secondary" onclick="App.goBack()">إلغاء</button>' +
          '</div>' +
        '</form>' +
      '</div>';

    document.getElementById('emp-form').onsubmit = function(e) {
      e.preventDefault();
      if (isEdit) _submitUpdateEmp(empData ? empData.empId : '');
      else        _submitAddEmp();
    };

    var roleEl = document.getElementById('ef-role');
    if (roleEl) roleEl.onchange = function() {
      var codeField = document.getElementById('role-code-field');
      if (codeField) codeField.style.display = this.value !== 'موظف' ? '' : 'none';
    };
  }

  function _field(label, id, val, type, disabled, required) {
    var inputHtml = '<input type="' + (type || 'text') + '" id="ef-' + id + '" value="' + _esc(val || '') + '"' +
      (disabled ? ' disabled' : '') + (required ? ' required' : '') + ' class="form-input">';
    if (type === 'password') {
      inputHtml = '<div class="pw-wrap">' + inputHtml +
        '<button type="button" class="pw-eye" onclick="window._togglePw(\'ef-' + id + '\',this)" title="إظهار/إخفاء">👁</button>' +
        '</div>';
    }
    return '<div class="form-field">' +
      '<label>' + label + (required ? ' <span class="req">*</span>' : '') + '</label>' +
      inputHtml +
    '</div>';
  }

  function _shiftSel(val, enabled) {
    var opts = ['a','b','c','d'].map(function(k) {
      var s = CONFIG.SHIFTS[k];
      return '<option value="' + s.label + '"' + (val === s.label ? ' selected' : '') + '>وردية ' + s.label + '</option>';
    }).join('');
    return '<div class="form-field"><label>الوردية <span class="req">*</span></label>' +
      '<select id="ef-shift" class="form-input"' + (!enabled ? ' disabled' : '') + '>' + opts + '</select></div>';
  }

  function _roleSel(val) {
    var opts = CONFIG.ROLES.map(function(r) {
      return '<option value="' + r.label + '"' + (val === r.label ? ' selected' : '') + '>' + r.label + '</option>';
    }).join('');
    var showCode = val && val !== 'موظف';
    return '<div class="form-field"><label>الصلاحية <span class="req">*</span></label>' +
      '<select id="ef-role" class="form-input">' + opts + '</select></div>' +
      '<div class="form-field" id="role-code-field" style="' + (showCode ? '' : 'display:none') + '">' +
        '<label>رمز التحقق للصلاحية <span class="req">*</span></label>' +
        '<div class="pw-wrap">' +
          '<input type="password" id="ef-role-code" class="form-input" placeholder="أدخل رمز الصلاحية المحدد في الإعدادات">' +
          '<button type="button" class="pw-eye" onclick="window._togglePw(\'ef-role-code\',this)" title="إظهار/إخفاء">👁</button>' +
        '</div>' +
      '</div>';
  }

  function _regionSel(val) {
    var opts = CONFIG.REGIONS.map(function(r) {
      return '<option value="' + r.label + '"' + (val === r.label ? ' selected' : '') + '>' + r.label + '</option>';
    }).join('');
    return '<div class="form-field"><label>المنطقة</label>' +
      '<select id="ef-region" class="form-input"><option value="">اختر</option>' + opts + '</select></div>';
  }

  function _submitAddEmp() {
    var role = _val('ef-role') || 'موظف';
    var emp = {
      empId:      _val('ef-empId'),
      name:       _val('ef-name'),
      phone:      _val('ef-phone'),
      shift:      _val('ef-shift'),
      role:       role,
      roleCode:   role !== 'موظف' ? _val('ef-role-code') : '',
      region:     _val('ef-region'),
      center:     _val('ef-center'),
      car:        _val('ef-car'),
      password:   _val('ef-password'),
      cat2:       _val('ef-cat2'),
      pants:      _val('ef-pants'),
      shoes:      _val('ef-shoes'),
      cat4:       _val('ef-cat4'),
      workExpDate: _val('ef-workExpDate'),
      srcExpDate:  _val('ef-srcExpDate'),
      recvExpDate: _val('ef-recvExpDate')
    };
    if (!emp.empId || !emp.name || !emp.password) {
      _toast('الرجاء تعبئة الحقول المطلوبة', 'error'); return;
    }
    if (role !== 'موظف' && !emp.roleCode) {
      _toast('الرجاء إدخال رمز التحقق للصلاحية المحددة', 'error'); return;
    }
    _setLoading(true);
    API.addEmployee(emp).then(function(res) {
      _setLoading(false);
      if (res.ok) { _toast('تم إضافة الموظف', 'success'); App.navigate('employees'); }
      else _toast(_mapErr(res.error), 'error');
    });
  }

  function _submitUpdateEmp(empId) {
    var updates = {
      name:       _val('ef-name'),
      phone:      _val('ef-phone'),
      region:     _val('ef-region'),
      center:     _val('ef-center'),
      car:        _val('ef-car'),
      cat2:       _val('ef-cat2'),
      pants:      _val('ef-pants'),
      shoes:      _val('ef-shoes'),
      cat4:       _val('ef-cat4'),
      workExpDate: _val('ef-workExpDate'),
      srcExpDate:  _val('ef-srcExpDate'),
      recvExpDate: _val('ef-recvExpDate')
    };
    if (Auth.canManage()) {
      updates.shift = _val('ef-shift');
      var newRole = _val('ef-role');
      updates.role = newRole;
      if (newRole && newRole !== 'موظف') {
        updates.roleCode = _val('ef-role-code');
        if (!updates.roleCode) {
          _toast('الرجاء إدخال رمز التحقق للصلاحية المحددة', 'error');
          return;
        }
      }
      var schedVal = _val('ef-schedLeave');
      if (schedVal !== '') updates.schedLeave = parseFloat(schedVal) || 0;
      if (Auth.getEffectiveRole() === 'مدير') {
        var annVal = _val('ef-annLeave');
        if (annVal !== '') updates.annLeave = parseFloat(annVal) || 0;
      }
    }
    _setLoading(true);
    API.updateEmployee(empId, updates).then(function(res) {
      _setLoading(false);
      if (res.ok) { _toast('تم حفظ التعديلات', 'success'); App.goBack(); }
      else _toast(_mapErr(res.error), 'error');
    });
  }

  // ==================== نموذج الإجازة ====================

  function renderLeaveForm(containerId) {
    var el   = document.getElementById(containerId);
    if (!el) return;
    var user = Auth.getUser();

    var typeOpts = CONFIG.LEAVE_TYPES.map(function(t) {
      return '<option value="' + t.key + '">' + t.label + '</option>';
    }).join('');

    el.innerHTML =
      '<div class="form-container">' +
        '<div class="form-header"><h2>طلب إجازة</h2></div>' +
        '<div class="emp-info-banner">' +
          '<span>👤 ' + user.name + '</span>' +
          '<span>🪪 ' + user.empId + '</span>' +
          '<span>🔄 وردية ' + user.shift + '</span>' +
        '</div>' +
        '<form id="leave-form" class="form-grid" novalidate>' +
          '<div class="form-field">' +
            '<label>نوع الإجازة <span class="req">*</span></label>' +
            '<select id="lf-type" class="form-input" required>' + typeOpts + '</select>' +
          '</div>' +
          '<div class="form-field">' +
            '<label>تاريخ البداية <span class="req">*</span></label>' +
            '<input type="date" id="lf-start" class="form-input" required>' +
          '</div>' +
          '<div class="form-field">' +
            '<label>تاريخ النهاية <span class="req">*</span></label>' +
            '<input type="date" id="lf-end" class="form-input" required>' +
          '</div>' +
          '<div class="form-field full-width">' +
            '<label>ملاحظات</label>' +
            '<textarea id="lf-notes" class="form-input" rows="2"></textarea>' +
          '</div>' +
          '<div class="form-field full-width" id="leave-preview" style="display:none">' +
            '<div class="leave-preview-card" id="leave-preview-card"></div>' +
          '</div>' +
          '<div id="leave-balance-warning" class="balance-warning" style="display:none"></div>' +
          '<div class="form-actions">' +
            '<button type="submit" class="btn-primary" id="lf-submit">إرسال الطلب</button>' +
            '<button type="button" class="btn-secondary" onclick="App.goBack()">إلغاء</button>' +
          '</div>' +
        '</form>' +
      '</div>';

    API.getEmployee().then(function(res) {
      if (res.ok) window._leaveFormEmpData = res.data;
    });

    function onDateChange() {
      var start = _val('lf-start');
      var end   = _val('lf-end');
      var type  = _val('lf-type');
      if (start && end && end >= start) _renderLeavePreview(start, end, type);
    }
    document.getElementById('lf-start').onchange = onDateChange;
    document.getElementById('lf-end').onchange   = onDateChange;
    document.getElementById('lf-type').onchange  = onDateChange;

    document.getElementById('leave-form').onsubmit = function(e) {
      e.preventDefault();
      _submitLeave();
    };
  }

  var _BALANCE_KEY = {
    annual:    'annLeave',
    sick:      'sickLeave',
    marriage:  'marriageLeave',
    birth:     'birthLeave',
    death:     'deathLeave',
    exam:      'examLeave',
    shift_sub: 'shiftSubLeave'
  };

  function _renderLeavePreview(start, end, typeKey) {
    var previewEl = document.getElementById('leave-preview');
    var cardEl    = document.getElementById('leave-preview-card');
    var warnEl    = document.getElementById('leave-balance-warning');
    if (!previewEl || !cardEl) return;

    var startDate = new Date(start);
    var endDate   = new Date(end);
    var days      = Math.floor((endDate - startDate) / 86400000) + 1;

    var emp       = window._leaveFormEmpData;
    var balKey    = _BALANCE_KEY[typeKey];
    var balance   = emp && balKey ? (parseFloat(emp[balKey]) || 0) : 0;
    var hasEnough = balance >= days;

    // جدول الوردية خلال فترة الإجازة
    var calHtml = '<div class="mini-cal-title">المدة: ' + days + ' ' + (days === 1 ? 'يوم' : 'أيام') + '</div>' +
                  '<div class="mini-cal-grid">';

    for (var d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      var dStr   = d.getFullYear() + '-' + _pad(d.getMonth()+1) + '-' + _pad(d.getDate());
      var hijri  = Hijri.fromDate(new Date(d));
      var enSt   = _localShiftStatus(Auth.getUser().shift, dStr);
      var sc     = CONFIG.STATUS[enSt] || CONFIG.STATUS.off;
      calHtml += '<div class="mini-cal-day" style="background:' + sc.bg + ';border-color:' + sc.badge + '">' +
        '<div class="mcd-day-name">' + CONFIG.DAYS_AR[d.getDay()] + '</div>' +
        '<div class="mcd-date">' + d.getDate() + '</div>' +
        '<div class="mcd-hijri">' + hijri.day + ' ' + CONFIG.HIJRI_MONTHS[hijri.month-1] + '</div>' +
        '<div class="mcd-shift" style="color:' + sc.text + '">' + sc.icon + ' ' + sc.label + '</div>' +
      '</div>';
    }
    calHtml += '</div>';

    calHtml += '<div class="leave-balance-row">' +
      '<span>الرصيد المتاح: <b>' + balance + ' يوم</b></span>' +
      '<span>المطلوب: <b>' + days + ' يوم</b></span>' +
      '<span>بعد الطلب: <b' + (!hasEnough ? ' style="color:#B71C1C"' : '') + '>' + (balance - days) + ' يوم</b></span>' +
    '</div>';

    cardEl.innerHTML = calHtml;
    previewEl.style.display = 'block';

    if (!hasEnough) {
      warnEl.innerHTML = '⚠️ الرصيد غير كافٍ — متاح ' + balance + ' يوم والمطلوب ' + days + ' يوم';
      warnEl.style.display = 'block';
    } else {
      warnEl.style.display = 'none';
    }

    window._leaveDays    = days;
    window._leaveBalance = balance;
  }

  function _submitLeave() {
    var start = _val('lf-start');
    var end   = _val('lf-end');
    var type  = _val('lf-type');
    var notes = _val('lf-notes');

    if (!start || !end || !type) { _toast('الرجاء تعبئة الحقول المطلوبة', 'error'); return; }
    if (end < start)             { _toast('تاريخ النهاية يجب أن يكون بعد البداية', 'error'); return; }

    _setLoading(true);
    API.submitLeave({
      leaveType: type, startDate: start, endDate: end,
      days: window._leaveDays || 1,
      balance: window._leaveBalance || 0,
      notes: notes
    }).then(function(res) {
      _setLoading(false);
      if (res.ok) { _toast('تم إرسال الطلب', 'success'); App.navigate('leaves'); }
      else _toast(_mapErr(res.error), 'error');
    });
  }

  // ==================== نموذج الأوفرتايم ====================

  function renderOvertimeForm(containerId) {
    var el   = document.getElementById(containerId);
    if (!el) return;
    var user = Auth.getUser();

    el.innerHTML =
      '<div class="form-container">' +
        '<div class="form-header"><h2>طلب ساعات أوفرتايم</h2></div>' +
        '<div class="emp-info-banner">' +
          '<span>👤 ' + user.name + '</span>' +
          '<span>🪪 ' + user.empId + '</span>' +
          '<span>🔄 وردية ' + user.shift + '</span>' +
        '</div>' +
        '<form id="ot-form" class="form-grid" novalidate>' +
          '<div class="form-field">' +
            '<label>التاريخ <span class="req">*</span></label>' +
            '<input type="date" id="ot-date" class="form-input" required>' +
          '</div>' +
          '<div class="form-field">' +
            '<label>اليوم</label>' +
            '<input type="text" id="ot-day" class="form-input" readonly placeholder="يُحدَّد تلقائياً">' +
          '</div>' +
          '<div class="form-field">' +
            '<label>عدد الساعات <span class="req">*</span></label>' +
            '<div class="ot-hours-row">' +
              '<input type="text" id="ot-hours" class="form-input ot-hours-input" inputmode="decimal" placeholder="مثال: 1.5" required>' +
              '<span class="ot-hours-unit">ساعة</span>' +
            '</div>' +
          '</div>' +
          '<div class="form-field full-width">' +
            '<label>سبب وتفاصيل العمل الإضافي <span class="req">*</span></label>' +
            '<textarea id="ot-notes" class="form-input" rows="3" required placeholder="يجب ذكر سبب وتفاصيل العمل الإضافي"></textarea>' +
          '</div>' +
          '<div class="form-actions">' +
            '<button type="submit" class="btn-primary">إرسال الطلب</button>' +
            '<button type="button" class="btn-secondary" onclick="App.goBack()">إلغاء</button>' +
          '</div>' +
        '</form>' +
      '</div>';

    document.getElementById('ot-date').onchange = function() {
      var d = new Date(this.value);
      if (!isNaN(d)) document.getElementById('ot-day').value = CONFIG.DAYS_AR[d.getDay()];
    };

    document.getElementById('ot-form').onsubmit = function(e) {
      e.preventDefault();
      _submitOT();
    };
  }

  function _submitOT() {
    var date  = _val('ot-date');
    var day   = _val('ot-day');
    var hours = _val('ot-hours').replace(',', '.');
    var notes = _val('ot-notes');

    if (!date || !hours || !notes) { _toast('الرجاء تعبئة جميع الحقول المطلوبة', 'error'); return; }
    var hoursNum = parseFloat(hours);
    if (isNaN(hoursNum) || hoursNum <= 0) { _toast('عدد الساعات يجب أن يكون رقماً موجباً', 'error'); return; }
    hours = String(hoursNum);

    _setLoading(true);
    API.submitOvertime({ date: date, day: day, hours: hours, notes: notes })
      .then(function(res) {
        _setLoading(false);
        if (res.ok) { _toast('تم إرسال الطلب', 'success'); App.navigate('overtime'); }
        else _toast(_mapErr(res.error), 'error');
      });
  }

  // ==================== قائمة طلبات الإجازات ====================

  function renderLeaveList(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;

    el.innerHTML =
      '<div class="list-header"><h2>طلبات الإجازات</h2>' +
      (Auth.canManage() ?
        '<div class="filter-tabs" id="leave-filter">' +
          '<button class="tab active" data-s="">الكل</button>' +
          '<button class="tab" data-s="pending_review">قيد المراجعة</button>' +
          '<button class="tab" data-s="approved">معتمد</button>' +
          '<button class="tab" data-s="rejected">مرفوض</button>' +
        '</div>' : '') +
      '</div><div id="leave-list-body"></div>';

    _loadLeaveList('');

    if (Auth.canManage()) {
      el.querySelectorAll('.tab').forEach(function(btn) {
        btn.onclick = function() {
          el.querySelectorAll('.tab').forEach(function(b) { b.classList.remove('active'); });
          this.classList.add('active');
          _loadLeaveList(this.dataset.s);
        };
      });
    }
  }

  function _loadLeaveList(status) {
    var body = document.getElementById('leave-list-body');
    if (body) body.innerHTML = '<div class="cal-loading"><div class="spinner"></div><span>جارٍ التحميل...</span></div>';

    API.getLeaveReqs(status).then(function(res) {
      if (!body) return;
      if (!res.ok) { body.innerHTML = '<div class="cal-error">تعذر تحميل البيانات</div>'; return; }
      if (!res.data.length) { body.innerHTML = '<div class="empty-state">لا توجد طلبات</div>'; return; }

      // Find leave type label
      var typeLabel = function(key) {
        var t = CONFIG.LEAVE_TYPES.filter(function(x) { return x.key === key; })[0];
        return t ? t.label : key;
      };

      body.innerHTML = res.data.map(function(r) {
        var stLabel = CONFIG.STATUS_LABELS[r.status] || r.status;
        var stCls   = r.status === 'approved' ? 'status-approved' :
                      r.status === 'rejected' ? 'status-rejected' : 'status-pending';
        var canRev  = Auth.canManage() && r.status === 'pending_review';

        return '<div class="request-card">' +
          '<div class="req-card-header">' +
            '<span class="req-no">' + r.no + '</span>' +
            '<span class="req-status ' + stCls + '">' + stLabel + '</span>' +
          '</div>' +
          '<div class="req-card-body">' +
            '<div class="req-row"><span>الموظف:</span><b>' + r.name + '</b></div>' +
            '<div class="req-row"><span>الوردية:</span><b>وردية ' + r.shift + '</b></div>' +
            '<div class="req-row"><span>نوع الإجازة:</span><b>' + typeLabel(r.type) + '</b></div>' +
            '<div class="req-row"><span>المدة:</span><b>' + CONFIG.fmtDate(r.startDate) + ' — ' + CONFIG.fmtDate(r.endDate) + ' (' + r.days + ' يوم)</b></div>' +
            (r.empNotes ? '<div class="req-row"><span>ملاحظات:</span><span>' + r.empNotes + '</span></div>' : '') +
            (r.revNotes && r.status === 'rejected' ?
              '<div class="rev-note-block rev-reject"><span class="rev-note-icon">⚠</span><span class="rev-note-label">سبب الرفض:</span> ' + r.revNotes + '</div>' : '') +
            (r.revNotes && r.status === 'approved' ?
              '<div class="rev-note-block rev-approve"><span class="rev-note-icon">✓</span><span class="rev-note-label">ملاحظة:</span> ' + r.revNotes + '</div>' : '') +
            (r.reviewerName && r.status !== 'pending_review' ?
              '<div class="rev-by-row"><span class="rev-by-label">المراجع:</span>' +
                '<span class="rev-by-name">' + r.reviewerName + '</span>' +
                '<span class="rev-by-id">' + r.reviewer + '</span>' +
                '<span class="rev-by-role">' + r.reviewerRole + '</span>' +
              '</div>' : '') +
          '</div>' +
          (canRev ?
            '<div class="req-card-actions">' +
              '<button class="btn-approve" onclick="Forms.approveLeave(\'' + r.no + '\')">اعتماد</button>' +
              '<button class="btn-reject"  onclick="Forms.rejectLeave(\'' + r.no + '\')">رفض</button>' +
            '</div>' : '') +
        '</div>';
      }).join('');
    });
  }

  function approveLeave(no) {
    if (!confirm('تأكيد اعتماد الطلب ' + no + '؟')) return;
    API.reviewLeave(no, 'approved', '').then(function(res) {
      _toast(res.ok ? 'تم الاعتماد' : _mapErr(res.error), res.ok ? 'success' : 'error');
      if (res.ok) _loadLeaveList('');
    });
  }

  function rejectLeave(no) {
    var reason = prompt('سبب الرفض:');
    if (reason === null) return;
    API.reviewLeave(no, 'rejected', reason).then(function(res) {
      _toast(res.ok ? 'تم الرفض' : _mapErr(res.error), res.ok ? 'success' : 'error');
      if (res.ok) _loadLeaveList('');
    });
  }

  // ==================== قائمة طلبات الأوفرتايم ====================

  function renderOvertimeList(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;

    el.innerHTML =
      '<div class="list-header"><h2>طلبات الأوفرتايم</h2>' +
      (Auth.canManage() ?
        '<div class="filter-tabs" id="ot-filter">' +
          '<button class="tab active" data-s="">الكل</button>' +
          '<button class="tab" data-s="pending_review">قيد المراجعة</button>' +
          '<button class="tab" data-s="approved">معتمد</button>' +
          '<button class="tab" data-s="rejected">مرفوض</button>' +
        '</div>' : '') +
      '</div><div id="ot-list-body"></div>';

    _loadOTList('');

    if (Auth.canManage()) {
      el.querySelectorAll('.tab').forEach(function(btn) {
        btn.onclick = function() {
          el.querySelectorAll('.tab').forEach(function(b) { b.classList.remove('active'); });
          this.classList.add('active');
          _loadOTList(this.dataset.s);
        };
      });
    }
  }

  function _loadOTList(status) {
    var body = document.getElementById('ot-list-body');
    if (body) body.innerHTML = '<div class="cal-loading"><div class="spinner"></div><span>جارٍ التحميل...</span></div>';

    API.getOvertimeReqs(status).then(function(res) {
      if (!body) return;
      if (!res.ok) { body.innerHTML = '<div class="cal-error">تعذر تحميل البيانات</div>'; return; }
      if (!res.data.length) { body.innerHTML = '<div class="empty-state">لا توجد طلبات</div>'; return; }

      body.innerHTML = res.data.map(function(r) {
        var stLabel = CONFIG.STATUS_LABELS[r.status] || r.status;
        var stCls   = r.status === 'approved' ? 'status-approved' :
                      r.status === 'rejected' ? 'status-rejected' : 'status-pending';
        var canRev  = Auth.canManage() && r.status === 'pending_review';

        return '<div class="request-card">' +
          '<div class="req-card-header">' +
            '<span class="req-no">' + r.no + '</span>' +
            '<span class="req-status ' + stCls + '">' + stLabel + '</span>' +
          '</div>' +
          '<div class="req-card-body">' +
            '<div class="req-row"><span>الموظف:</span><b>' + r.name + '</b></div>' +
            '<div class="req-row"><span>الوردية:</span><b>وردية ' + r.shift + '</b></div>' +
            '<div class="req-row"><span>التاريخ:</span><b>' + r.day + ' ' + CONFIG.fmtDate(r.date) + '</b></div>' +
            '<div class="req-row"><span>الساعات:</span><b>' + _formatHours(r.hours) + '</b></div>' +
            '<div class="req-row"><span>الملاحظات:</span><span>' + r.notes + '</span></div>' +
            (r.status === 'rejected' ?
              '<div class="rev-note-block rev-reject"><span class="rev-note-icon">⚠</span><span class="rev-note-label">سبب الرفض:</span> ' + (r.revNotes||'—') + '</div>' : '') +
            (r.reviewerName && r.status !== 'pending_review' ?
              '<div class="rev-by-row"><span class="rev-by-label">المراجع:</span>' +
                '<span class="rev-by-name">' + r.reviewerName + '</span>' +
                '<span class="rev-by-id">' + r.reviewer + '</span>' +
                '<span class="rev-by-role">' + r.reviewerRole + '</span>' +
              '</div>' : '') +
          '</div>' +
          (canRev ?
            '<div class="req-card-actions">' +
              '<button class="btn-approve" onclick="Forms.approveOT(\'' + r.no + '\')">اعتماد</button>' +
              '<button class="btn-reject"  onclick="Forms.rejectOT(\'' + r.no + '\')">رفض</button>' +
            '</div>' : '') +
        '</div>';
      }).join('');
    });
  }

  function approveOT(no) {
    if (!confirm('تأكيد اعتماد الطلب ' + no + '؟')) return;
    API.reviewOvertime(no, 'approved').then(function(res) {
      _toast(res.ok ? 'تم الاعتماد' : _mapErr(res.error), res.ok ? 'success' : 'error');
      if (res.ok) _loadOTList('');
    });
  }

  function rejectOT(no) {
    var reason = prompt('سبب الرفض:');
    if (reason === null) return;
    API.reviewOvertime(no, 'rejected').then(function(res) {
      _toast(res.ok ? 'تم الرفض' : _mapErr(res.error), res.ok ? 'success' : 'error');
      if (res.ok) _loadOTList('');
    });
  }

  // ==================== حساب حالة الوردية محلياً ====================
  var _CYCLE_EN  = ['morning','morning','evening','evening','off','off','off','off'];
  var _REF_DATE  = '2026-05-26';
  var _REF_POS   = { 'أ': 5, 'ب': 1, 'ج': 7, 'د': 3 };

  function _localShiftStatus(shift, dateStr) {
    var ref  = new Date(_REF_DATE); ref.setHours(0,0,0,0);
    var d    = new Date(dateStr);   d.setHours(0,0,0,0);
    var diff = Math.round((d - ref) / 86400000);
    var pos  = ((_REF_POS[shift] || 0) + diff + 80000) % 8;
    return _CYCLE_EN[pos];
  }

  // ==================== مساعدات ====================

  function _formatHours(h) {
    var n = parseFloat(String(h).replace(',', '.'));
    if (isNaN(n)) return h + ' ساعة';
    if (n < 1) return (n * 60) + ' دقيقة';
    return n + ' ساعة';
  }

  function _val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function _esc(str) {
    return String(str).replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  function _pad(n) { return n < 10 ? '0' + n : String(n); }

  function _setLoading(on) {
    var btn = document.querySelector('#leave-form .btn-primary, #emp-form .btn-primary, #ot-form .btn-primary');
    if (btn) { btn.disabled = on; if (on) btn.textContent = 'جارٍ الإرسال...'; }
  }

  function _toast(msg, type) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className   = 'toast toast-' + type + ' show';
    setTimeout(function() { t.classList.remove('show'); }, 3500);
  }

  function _mapErr(code) {
    var map = {
      forbidden:        'غير مصرح لك بهذا الإجراء',
      duplicate_id:     'الرقم الوظيفي موجود مسبقاً',
      not_found:        'البيانات غير موجودة',
      same_shift:       'الموظف في نفس الوردية المحددة',
      forbidden_shift:  'لا يمكن الإضافة لوردية أخرى',
      invalid_role_code:'رمز التحقق للصلاحية غير صحيح'
    };
    return map[code] || (code || 'حدث خطأ غير متوقع');
  }

  return {
    renderEmployeeForm: renderEmployeeForm,
    renderLeaveForm:    renderLeaveForm,
    renderOvertimeForm: renderOvertimeForm,
    renderLeaveList:    renderLeaveList,
    renderOvertimeList: renderOvertimeList,
    approveLeave:  approveLeave,
    rejectLeave:   rejectLeave,
    approveOT:     approveOT,
    rejectOT:      rejectOT
  };
})();
