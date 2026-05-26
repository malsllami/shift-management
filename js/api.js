// ============================================================
// API layer — communicates with Google Apps Script
// All keys: English internally, Arabic only in display
// ============================================================

var API = (function () {

  // Normalize Arabic-Indic and Persian numerals to Western
  function normalize(str) {
    if (typeof str !== 'string') return str;
    return str
      .replace(/[٠١٢٣٤٥٦٧٨٩]/g, function(c) { return c.charCodeAt(0) - 0x0660; })
      .replace(/[۰۱۲۳۴۵۶۷۸۹]/g, function(c) { return c.charCodeAt(0) - 0x06F0; });
  }

  function _call(params) {
    var url = new URL(CONFIG.API_URL);
    Object.keys(params).forEach(function(k) {
      var v = params[k];
      if (typeof v === 'object') v = JSON.stringify(v);
      url.searchParams.set(k, normalize(String(v)));
    });
    var token = Auth.getToken();
    if (token) url.searchParams.set('token', token);

    return fetch(url.toString())
      .then(function(res) {
        if (!res.ok) throw new Error('network_error_' + res.status);
        return res.json();
      })
      .then(function(data) {
        if (!data.ok && data.error === 'session_expired') {
          Auth.logout();
          if (typeof App !== 'undefined') App.showLogin();
        }
        return data;
      })
      .catch(function(err) {
        return { ok: false, error: err.message };
      });
  }

  return {
    login:            function(empId, password) { return _call({ action:'login', empId:empId, password:password }); },
    getSchedule:      function(year, month)     { return _call({ action:'getSchedule', year:year, month:month }); },
    getEmployees:     function()                { return _call({ action:'getEmployees' }); },
    getEmployee:      function(empId)           { return _call({ action:'getEmployee', empId:empId||'' }); },
    addEmployee:      function(emp)             { return _call({ action:'addEmployee',  employee:emp }); },
    updateEmployee:   function(empId, updates)  { return _call({ action:'updateEmployee', empId:empId, updates:updates }); },
    transferEmployee: function(empId, newShift) { return _call({ action:'transferEmployee', empId:empId, newShift:newShift }); },
    getLeaveReqs:     function(status)          { return _call({ action:'getLeaveReqs', status:status||'' }); },
    submitLeave:      function(d)               { return _call(Object.assign({ action:'submitLeave' }, d)); },
    reviewLeave:      function(no, status, notes) { return _call({ action:'reviewLeave', no:no, status:status, notes:notes||'' }); },
    getOvertimeReqs:  function(status)          { return _call({ action:'getOvertimeReqs', status:status||'' }); },
    submitOvertime:   function(d)               { return _call(Object.assign({ action:'submitOvertime' }, d)); },
    reviewOvertime:   function(no, status)      { return _call({ action:'reviewOvertime', no:no, status:status }); },
    getNotifications: function()                { return _call({ action:'getNotifications' }); },
    markNotifRead:    function(no)              { return _call({ action:'markNotifRead', no:no }); },
    getDashboard:     function()                { return _call({ action:'getDashboard' }); },
    getSettings:      function()                { return _call({ action:'getSettings' }); },
    updateSettings:   function(settings)        { return _call({ action:'updateSettings', settings:settings }); },
    changePassword:   function(newPassword)     { return _call({ action:'changePassword', newPassword:newPassword }); },
    yearlyLeaveReset: function()               { return _call({ action:'yearlyLeaveReset' }); }
  };
})();
