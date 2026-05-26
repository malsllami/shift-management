// ============================================================
// النماذج: الموظف + الإجازة + الأوفرتايم
// ============================================================

var Forms = (function () {

  // ==================== نموذج إضافة/تعديل موظف ====================

  function renderEmployeeForm(containerId, empData, isEdit) {
    var el   = document.getElementById(containerId);
    if (!el) return;
    var role = Auth.getEffectiveRole();
    var user = Auth.getUser();
    var isAdminEdit = (role === 'مدير' || role === 'مشرف');

    var title = isEdit ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد';

    el.innerHTML =
      '<div class="form-container">' +
        '<div class="form-header"><h2>' + title + '</h2></div>' +
        '<form id="emp-form" class="form-grid" novalidate>' +
          _empField('الرقم الوظيفي', 'empId', empData ? empData['الرقم الوظيفي'] : '', 'text', isEdit) +
          _empField('الاسم', 'name', empData ? empData['الاسم'] : '', 'text', false, true) +
          _empField('رقم الجوال', 'phone', empData ? empData['رقم الجوال'] : '', 'tel', false, true) +
          _shiftSelect(empData ? empData['الوردية'] : '', isAdminEdit) +
          (isAdminEdit ? _roleSelect(empData ? empData['الصلاحية'] : 'موظف') : '') +
          _regionSelect(empData ? empData['المنطقة'] : '') +
          _empField('اسم المركز', 'center', empData ? empData['اسم المركز'] : '', 'text') +
          _empField('رقم السيارة', 'carNo', empData ? empData['رقم السيارة'] : '', 'text') +
          (!isEdit ? _empField('كلمة المرور', 'password', '', 'password', false, true) : '') +
          '<div class="form-section-title">بيانات الملابس والمعدات</div>' +
          _empField('مقاس CAT 2', 'cat2', empData ? empData['مقاس CAT 2'] : '') +
          _empField('مقاس البنطلون CAT 2', 'pant2', empData ? empData['مقاس البنطلون CAT 2'] : '') +
          _empField('مقاس السفتي شوز', 'shoes', empData ? empData['مقاس السفتي شوز'] : '') +
          _empField('مقاس CAT 4', 'cat4', empData ? empData['مقاس CAT 4'] : '') +
          '<div class="form-section-title">البطاقات</div>' +
          _empField('تاريخ انتهاء بطاقة العمل', 'workCardDate', empData ? empData['تاريخ انتهاء بطاقة العمل'] : '', 'date') +
          _empField('تاريخ انتهاء بطاقة المصدر', 'sourceCardDate', empData ? empData['تاريخ انتهاء بطاقة المصدر'] : '', 'date') +
          _empField('تاريخ انتهاء بطاقة المستلم', 'recvCardDate', empData ? empData['تاريخ انتهاء بطاقة المستلم'] : '', 'date') +
          '<div class="form-actions">' +
            '<button type="submit" class="btn-primary">' + (isEdit ? 'حفظ التعديلات' : 'إضافة الموظف') + '</button>' +
            '<button type="button" class="btn-secondary" onclick="App.goBack()">إلغاء</button>' +
          '</div>' +
        '</form>' +
      '</div>';

    document.getElementById('emp-form').onsubmit = function(e) {
      e.preventDefault();
      isEdit ? _submitUpdateEmployee(empData ? empData['الرقم الوظيفي'] : '')
             : _submitAddEmployee();
    };
  }

  function _empField(label, id, val, type, disabled, required) {
    return '<div class="form-field">' +
      '<label>' + label + (required ? ' <span class="req">*</span>' : '') + '</label>' +
      '<input type="' + (type || 'text') + '" id="ef-' + id + '" value="' + _esc(val || '') + '"' +
        (disabled ? ' disabled' : '') +
        (required ? ' required' : '') +
        ' class="form-input">' +
    '</div>';
  }

  function _shiftSelect(val, enabled) {
    var opts = CONFIG.SHIFTS.map(function(s) {
      return '<option value="' + s + '"' + (val === s ? ' selected' : '') + '>وردية ' + s + '</option>';
    }).join('');
    return '<div class="form-field">' +
      '<label>الوردية <span class="req">*</span></label>' +
      '<select id="ef-shift" class="form-input"' + (!enabled ? ' disabled' : '') + '>' + opts + '</select>' +
    '</div>';
  }

  function _roleSelect(val) {
    var opts = CONFIG.ROLES.map(function(r) {
      return '<option value="' + r + '"' + (val === r ? ' selected' : '') + '>' + r + '</option>';
    }).join('');
    return '<div class="form-field">' +
      '<label>الصلاحية <span class="req">*</span></label>' +
      '<select id="ef-role" class="form-input">' + opts + '</select>' +
    '</div>';
  }

  function _regionSelect(val) {
    var opts = CONFIG.REGIONS.map(function(r) {
      return '<option value="' + r + '"' + (val === r ? ' selected' : '') + '>' + r + '</option>';
    }).join('');
    return '<div class="form-field">' +
      '<label>المنطقة</label>' +
      '<select id="ef-region" class="form-input"><option value="">اختر</option>' + opts + '</select>' +
    '</div>';
  }

  function _submitAddEmployee() {
    var emp = {
      'الرقم الوظيفي':    _val('ef-empId'),
      'الاسم':             _val('ef-name'),
      'رقم الجوال':        _val('ef-phone'),
      'الوردية':           _val('ef-shift'),
      'الصلاحية':          _val('ef-role') || 'موظف',
      'المنطقة':           _val('ef-region'),
      'اسم المركز':        _val('ef-center'),
      'رقم السيارة':       _val('ef-carNo'),
      'كلمة المرور':       _val('ef-password'),
      'مقاس CAT 2':        _val('ef-cat2'),
      'مقاس البنطلون CAT 2': _val('ef-pant2'),
      'مقاس السفتي شوز':  _val('ef-shoes'),
      'مقاس CAT 4':        _val('ef-cat4'),
      'تاريخ انتهاء بطاقة العمل':    _val('ef-workCardDate'),
      'تاريخ انتهاء بطاقة المصدر':   _val('ef-sourceCardDate'),
      'تاريخ انتهاء بطاقة المستلم':  _val('ef-recvCardDate')
    };

    if (!emp['الرقم الوظيفي'] || !emp['الاسم'] || !emp['كلمة المرور']) {
      _toast('الرجاء تعبئة الحقول المطلوبة', 'error'); return;
    }

    _setLoading(true);
    API.addEmployee(emp).then(function(res) {
      _setLoading(false);
      if (res.success) { _toast(res.message, 'success'); App.navigate('employees'); }
      else _toast(res.error, 'error');
    });
  }

  function _submitUpdateEmployee(empId) {
    var updates = {
      'الاسم':           _val('ef-name'),
      'رقم الجوال':      _val('ef-phone'),
      'المنطقة':         _val('ef-region'),
      'اسم المركز':      _val('ef-center'),
      'رقم السيارة':     _val('ef-carNo'),
      'مقاس CAT 2':      _val('ef-cat2'),
      'مقاس البنطلون CAT 2': _val('ef-pant2'),
      'مقاس السفتي شوز': _val('ef-shoes'),
      'مقاس CAT 4':      _val('ef-cat4'),
      'تاريخ انتهاء بطاقة العمل':    _val('ef-workCardDate'),
      'تاريخ انتهاء بطاقة المصدر':   _val('ef-sourceCardDate'),
      'تاريخ انتهاء بطاقة المستلم':  _val('ef-recvCardDate')
    };
    if (Auth.canManage()) {
      updates['الوردية']   = _val('ef-shift');
      updates['الصلاحية'] = _val('ef-role');
    }

    _setLoading(true);
    API.updateEmployee(empId, updates).then(function(res) {
      _setLoading(false);
      if (res.success) { _toast(res.message, 'success'); App.goBack(); }
      else _toast(res.error, 'error');
    });
  }

  // ==================== نموذج الإجازة ====================

  function renderLeaveForm(containerId) {
    var el   = document.getElementById(containerId);
    if (!el) return;
    var user = Auth.getUser();

    el.innerHTML =
      '<div class="form-container">' +
        '<div class="form-header"><h2>طلب إجازة</h2></div>' +
        '<div class="emp-info-banner">' +
          '<span>👤 ' + user.name + '</span>' +
          '<span>🪪 ' + user.empId + '</span>' +
          '<span>🔄 وردية ' + user.shift + '</span>' +
          '<span id="lf-region-center"></span>' +
        '</div>' +
        '<form id="leave-form" class="form-grid" novalidate>' +
          '<div class="form-field">' +
            '<label>نوع الإجازة <span class="req">*</span></label>' +
            '<select id="lf-type" class="form-input" required>' +
              CONFIG.LEAVE_TYPES.map(function(t) {
                return '<option value="' + t + '">' + t + '</option>';
              }).join('') +
            '</select>' +
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

    // تحميل بيانات الموظف
    API.getEmployee().then(function(res) {
      if (res.success) {
        var emp = res.data;
        var banner = document.getElementById('lf-region-center');
        if (banner) banner.innerHTML =
          '<span>📍 ' + (emp['المنطقة'] || '') + ' - ' + (emp['اسم المركز'] || '') + '</span>';
        window._leaveFormEmpData = emp;
      }
    });

    // مراقبة التواريخ لعرض المعاينة
    function onDateChange() {
      var start = _val('lf-start');
      var end   = _val('lf-end');
      var type  = _val('lf-type');
      if (start && end && end >= start) {
        _renderLeavePreview(start, end, type);
      }
    }
    document.getElementById('lf-start').onchange = onDateChange;
    document.getElementById('lf-end').onchange   = onDateChange;
    document.getElementById('lf-type').onchange  = onDateChange;

    document.getElementById('leave-form').onsubmit = function(e) {
      e.preventDefault();
      _submitLeave();
    };
  }

  function _renderLeavePreview(start, end, type) {
    var previewEl = document.getElementById('leave-preview');
    var cardEl    = document.getElementById('leave-preview-card');
    var warnEl    = document.getElementById('leave-balance-warning');
    if (!previewEl || !cardEl) return;

    var startDate = new Date(start);
    var endDate   = new Date(end);
    var days      = Math.floor((endDate - startDate) / 86400000) + 1;

    var emp = window._leaveFormEmpData;
    var balanceMap = {
      'سنوية':         'رصيد الاجازات السنوية',
      'مرضية':         'رصيد مرضي',
      'زواج':          'رصيد زواج',
      'مولود':         'رصيد مولود',
      'وفاة':          'رصيد وفاة',
      'اختبارات':      'رصيد اختبارات',
      'بدل دورة عمل':  'رصيد بدل دورة عمل'
    };
    var balanceKey = balanceMap[type];
    var balance    = emp && balanceKey ? (parseFloat(emp[balanceKey]) || 0) : 0;
    var hasBalance = balance >= days;

    // بناء التقويم المصغر
    var calHtml = '<div class="mini-cal-title">المدة: ' + days + ' يوم</div>';
    calHtml += '<div class="mini-cal-grid">';

    for (var d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      var dStr = d.getFullYear() + '-' + _pad(d.getMonth()+1) + '-' + _pad(d.getDate());
      var hijri = Hijri.fromDate(new Date(d));
      var shiftStatus = _getLocalShiftStatus(Auth.getUser().shift, dStr);
      var sc = CONFIG.STATUS_COLORS[shiftStatus] || CONFIG.STATUS_COLORS['إجازة'];
      var icon = shiftStatus === 'صباح' ? '☀' : (shiftStatus === 'مساء' ? '🌙' : '—');

      calHtml += '<div class="mini-cal-day" style="background:' + sc.bg + ';border:1px solid ' + sc.badge + '">' +
        '<div class="mcd-date">' + d.getDate() + '</div>' +
        '<div class="mcd-hijri">' + hijri.day + '/' + hijri.month + '</div>' +
        '<div class="mcd-shift" style="color:' + sc.text + '">' + icon + ' ' + shiftStatus + '</div>' +
      '</div>';
    }
    calHtml += '</div>';

    calHtml += '<div class="leave-balance-row">' +
      '<span>الرصيد المتاح: <b>' + balance + ' يوم</b></span>' +
      '<span>المطلوب: <b>' + days + ' يوم</b></span>' +
      '<span>بعد الطلب: <b' + (!hasBalance ? ' class="text-danger"' : '') + '>' + (balance - days) + ' يوم</b></span>' +
    '</div>';

    cardEl.innerHTML = calHtml;
    previewEl.style.display = 'block';

    if (!hasBalance) {
      warnEl.innerHTML = '⚠️ الرصيد غير كافٍ — الرصيد المتاح ' + balance + ' يوم والمطلوب ' + days + ' يوم';
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
    if (end < start) { _toast('تاريخ النهاية يجب أن يكون بعد تاريخ البداية', 'error'); return; }

    _setLoading(true);
    API.submitLeave({
      leaveType: type, startDate: start, endDate: end,
      days: window._leaveDays || 1,
      balance: window._leaveBalance || 0,
      notes: notes
    }).then(function(res) {
      _setLoading(false);
      if (res.success) { _toast(res.message, 'success'); App.navigate('leaves'); }
      else _toast(res.error, 'error');
    });
  }

  // ==================== نموذج الأوفرتايم ====================

  function renderOvertimeForm(containerId) {
    var el   = document.getElementById(containerId);
    if (!el) return;
    var user = Auth.getUser();

    var hoursOptions = CONFIG.OVERTIME_HOURS.map(function(h) {
      return '<option value="' + h + '">' + h + ' ساعة' + (h < 1 ? ' (' + (h*60) + ' دقيقة)' : '') + '</option>';
    }).join('');

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
            '<input type="text" id="ot-day" class="form-input" readonly>' +
          '</div>' +
          '<div class="form-field">' +
            '<label>عدد الساعات <span class="req">*</span></label>' +
            '<select id="ot-hours" class="form-input" required>' + hoursOptions + '</select>' +
          '</div>' +
          '<div class="form-field full-width">' +
            '<label>ملاحظات العمل الإضافي <span class="req">*</span></label>' +
            '<textarea id="ot-notes" class="form-input" rows="3" required placeholder="يجب ذكر سبب وتفاصيل العمل الإضافي"></textarea>' +
          '</div>' +
          '<div class="form-actions">' +
            '<button type="submit" class="btn-primary">إرسال الطلب</button>' +
            '<button type="button" class="btn-secondary" onclick="App.goBack()">إلغاء</button>' +
          '</div>' +
        '</form>' +
      '</div>';

    document.getElementById('ot-date').onchange = function() {
      var date = new Date(this.value);
      if (!isNaN(date)) {
        document.getElementById('ot-day').value = CONFIG.DAYS_AR[date.getDay()];
      }
    };

    document.getElementById('ot-form').onsubmit = function(e) {
      e.preventDefault();
      _submitOvertime();
    };
  }

  function _submitOvertime() {
    var date  = _val('ot-date');
    var day   = _val('ot-day');
    var hours = _val('ot-hours');
    var notes = _val('ot-notes');

    if (!date || !hours || !notes) { _toast('الرجاء تعبئة جميع الحقول المطلوبة', 'error'); return; }

    _setLoading(true);
    API.submitOvertime({ date: date, day: day, hours: hours, notes: notes })
      .then(function(res) {
        _setLoading(false);
        if (res.success) { _toast(res.message, 'success'); App.navigate('overtime'); }
        else _toast(res.error, 'error');
      });
  }

  // ==================== قائمة الطلبات ====================

  function renderLeaveList(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '<div class="list-header"><h2>طلبات الإجازات</h2>' +
      (Auth.canManage() ? '<div class="filter-tabs" id="leave-filter">' +
        '<button class="tab active" data-s="">الكل</button>' +
        '<button class="tab" data-s="قيد المراجعة">قيد المراجعة</button>' +
        '<button class="tab" data-s="معتمد">معتمد</button>' +
        '<button class="tab" data-s="مرفوض">مرفوض</button>' +
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
    if (body) body.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

    API.getLeaveReqs(status).then(function(res) {
      if (!res.success) return;
      if (!body) return;
      if (!res.data.length) { body.innerHTML = '<div class="empty-state">لا توجد طلبات</div>'; return; }

      body.innerHTML = res.data.map(function(r) {
        var statusCls = r['الحالة'] === 'معتمد' ? 'status-approved' :
                        r['الحالة'] === 'مرفوض'  ? 'status-rejected' : 'status-pending';
        var canReview = Auth.canManage() && r['الحالة'] === 'قيد المراجعة';

        return '<div class="request-card">' +
          '<div class="req-card-header">' +
            '<span class="req-no">' + r['رقم الطلب'] + '</span>' +
            '<span class="req-status ' + statusCls + '">' + r['الحالة'] + '</span>' +
          '</div>' +
          '<div class="req-card-body">' +
            '<div class="req-row"><span>الموظف:</span><b>' + r['الاسم'] + '</b></div>' +
            '<div class="req-row"><span>الوردية:</span><b>وردية ' + r['الوردية'] + '</b></div>' +
            '<div class="req-row"><span>نوع الإجازة:</span><b>' + r['نوع الاجازة'] + '</b></div>' +
            '<div class="req-row"><span>المدة:</span><b>' + r['تاريخ البداية'] + ' — ' + r['تاريخ النهاية'] + ' (' + r['عدد الايام'] + ' يوم)</b></div>' +
            (r['ملاحظات الموظف'] ? '<div class="req-row"><span>ملاحظات:</span><span>' + r['ملاحظات الموظف'] + '</span></div>' : '') +
          '</div>' +
          (canReview ? '<div class="req-card-actions">' +
            '<button class="btn-approve" onclick="Forms.approveLeave(\'' + r['رقم الطلب'] + '\')">اعتماد</button>' +
            '<button class="btn-reject" onclick="Forms.rejectLeave(\'' + r['رقم الطلب'] + '\')">رفض</button>' +
          '</div>' : '') +
        '</div>';
      }).join('');
    });
  }

  function approveLeave(reqNo) {
    if (!confirm('تأكيد اعتماد الطلب ' + reqNo + '؟')) return;
    API.reviewLeave(reqNo, 'معتمد', '').then(function(res) {
      _toast(res.success ? 'تم الاعتماد' : res.error, res.success ? 'success' : 'error');
      if (res.success) _loadLeaveList('');
    });
  }

  function rejectLeave(reqNo) {
    var reason = prompt('سبب الرفض:');
    if (reason === null) return;
    API.reviewLeave(reqNo, 'مرفوض', reason).then(function(res) {
      _toast(res.success ? 'تم الرفض' : res.error, res.success ? 'success' : 'error');
      if (res.success) _loadLeaveList('');
    });
  }

  function renderOvertimeList(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '<div class="list-header"><h2>طلبات الأوفرتايم</h2></div>' +
                   '<div id="ot-list-body"></div>';

    API.getOvertimeReqs('').then(function(res) {
      var body = document.getElementById('ot-list-body');
      if (!res.success || !body) return;
      if (!res.data.length) { body.innerHTML = '<div class="empty-state">لا توجد طلبات</div>'; return; }

      body.innerHTML = res.data.map(function(r) {
        var statusCls = r['الحالة'] === 'معتمد' ? 'status-approved' :
                        r['الحالة'] === 'مرفوض'  ? 'status-rejected' : 'status-pending';
        var canReview = Auth.canManage() && r['الحالة'] === 'قيد المراجعة';

        return '<div class="request-card">' +
          '<div class="req-card-header">' +
            '<span class="req-no">' + r['رقم الطلب'] + '</span>' +
            '<span class="req-status ' + statusCls + '">' + r['الحالة'] + '</span>' +
          '</div>' +
          '<div class="req-card-body">' +
            '<div class="req-row"><span>الموظف:</span><b>' + r['الاسم'] + '</b></div>' +
            '<div class="req-row"><span>التاريخ:</span><b>' + r['اليوم'] + ' ' + r['التاريخ'] + '</b></div>' +
            '<div class="req-row"><span>الساعات:</span><b>' + r['عدد الساعات'] + ' ساعة</b></div>' +
            '<div class="req-row"><span>الملاحظات:</span><span>' + r['الملاحظات'] + '</span></div>' +
          '</div>' +
          (canReview ? '<div class="req-card-actions">' +
            '<button class="btn-approve" onclick="Forms.approveOT(\'' + r['رقم الطلب'] + '\')">اعتماد</button>' +
            '<button class="btn-reject"  onclick="Forms.rejectOT(\'' + r['رقم الطلب'] + '\')">رفض</button>' +
          '</div>' : '') +
        '</div>';
      }).join('');
    });
  }

  function approveOT(reqNo) {
    API.reviewOvertime(reqNo, 'معتمد').then(function(res) {
      _toast(res.success ? 'تم الاعتماد' : res.error, res.success ? 'success' : 'error');
      if (res.success) renderOvertimeList(document.getElementById('ot-list-body').closest('.view').id);
    });
  }

  function rejectOT(reqNo) {
    API.reviewOvertime(reqNo, 'مرفوض').then(function(res) {
      _toast(res.success ? 'تم الرفض' : res.error, res.success ? 'success' : 'error');
    });
  }

  // ==================== مساعدة ====================

  function _val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function _esc(str) {
    return String(str).replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  function _pad(n) { return n < 10 ? '0' + n : String(n); }

  function _setLoading(on) {
    var btn = document.querySelector('.btn-primary');
    if (btn) { btn.disabled = on; btn.textContent = on ? 'جارٍ الإرسال...' : btn.dataset.orig || btn.textContent; }
  }

  function _toast(msg, type) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className   = 'toast toast-' + type + ' show';
    setTimeout(function() { t.classList.remove('show'); }, 3500);
  }

  // حساب حالة الوردية محلياً (للمعاينة السريعة)
  var _CYCLE     = ['صباح','صباح','مساء','مساء','إجازة','إجازة','إجازة','إجازة'];
  var _REF_DATE  = '2026-05-26';
  var _REF_POS   = { 'أ': 5, 'ب': 1, 'ج': 7, 'د': 3 };

  function _getLocalShiftStatus(shift, dateStr) {
    var ref  = new Date(_REF_DATE); ref.setHours(0,0,0,0);
    var d    = new Date(dateStr);   d.setHours(0,0,0,0);
    var diff = Math.round((d - ref) / 86400000);
    var pos  = ((_REF_POS[shift] || 0) + diff + 8000) % 8;
    return _CYCLE[pos];
  }

  return {
    renderEmployeeForm: renderEmployeeForm,
    renderLeaveForm:    renderLeaveForm,
    renderOvertimeForm: renderOvertimeForm,
    renderLeaveList:    renderLeaveList,
    renderOvertimeList: renderOvertimeList,
    approveLeave:       approveLeave,
    rejectLeave:        rejectLeave,
    approveOT:          approveOT,
    rejectOT:           rejectOT
  };
})();
