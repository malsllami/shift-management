// ============================================================
// إدارة الجلسة والمصادقة
// ============================================================

var Auth = (function () {
  var SESSION_KEY = 'se_session';
  var _user = null;
  var _adminMode = true; // للمدير والمشرف: true=وضع الإدارة، false=وضع الموظف

  function login(empId, password) {
    return API.login(empId, password).then(function(res) {
      if (res.success) {
        _user = res.user;
        _user.token = res.token;
        _adminMode = true;
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user: _user, adminMode: _adminMode }));
      }
      return res;
    });
  }

  function logout() {
    _user = null;
    sessionStorage.removeItem(SESSION_KEY);
  }

  function restore() {
    var stored = sessionStorage.getItem(SESSION_KEY);
    if (!stored) return false;
    try {
      var data = JSON.parse(stored);
      _user = data.user;
      _adminMode = data.adminMode !== false;
      return true;
    } catch(e) {
      return false;
    }
  }

  function getToken()     { return _user ? _user.token : null; }
  function getUser()      { return _user; }
  function isLoggedIn()   { return !!_user; }
  function isAdminMode()  { return _adminMode; }

  function getEffectiveRole() {
    if (!_user) return null;
    if (_adminMode) return _user.role;
    return 'موظف'; // وضع الموظف للمدير/المشرف
  }

  function canManage() {
    var role = getEffectiveRole();
    return role === 'مدير' || role === 'مشرف';
  }

  function isAdmin()       { return _user && _user.role === 'مدير'; }
  function isSupervisor()  { return _user && _user.role === 'مشرف'; }
  function isAdminView()   { return _user && _user.role === 'اداري'; }

  function toggleMode() {
    _adminMode = !_adminMode;
    var stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      var data = JSON.parse(stored);
      data.adminMode = _adminMode;
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
    }
    return _adminMode;
  }

  function canToggleMode() {
    return _user && (_user.role === 'مدير' || _user.role === 'مشرف');
  }

  return {
    login: login, logout: logout, restore: restore,
    getToken: getToken, getUser: getUser, isLoggedIn: isLoggedIn,
    isAdminMode: isAdminMode, getEffectiveRole: getEffectiveRole,
    canManage: canManage, isAdmin: isAdmin, isSupervisor: isSupervisor,
    isAdminView: isAdminView, toggleMode: toggleMode, canToggleMode: canToggleMode
  };
})();
