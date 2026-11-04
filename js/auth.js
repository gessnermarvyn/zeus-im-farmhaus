(function (global) {
  var KEY = 'zeus-owner-session';
  var MSG = {
    inactive: 'Die Anmeldung ist noch nicht aktiv. Es ist noch keine Verbindung eingerichtet, und auf dieser Website ist kein Passwort hinterlegt.',
    not_configured: 'Die Anmeldung ist auf dem Server noch nicht eingerichtet.',
    invalid: 'Das Passwort ist nicht richtig.',
    rate_limited: 'Zu viele Versuche. Bitte warten Sie eine Weile und versuchen Sie es dann erneut.',
    expired: 'Dieser Link ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen an.',
    session: 'Die Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.',
    weak: 'Das neue Passwort braucht mindestens 10 Zeichen.',
    mismatch: 'Die beiden neuen Passwörter stimmen nicht überein.',
    same: 'Das neue Passwort muss sich vom alten unterscheiden.',
    unreachable: 'Die Anmeldung ist gerade nicht erreichbar. Bitte versuchen Sie es später noch einmal.',
    server: 'Das hat nicht geklappt. Bitte versuchen Sie es später noch einmal.',
    sent: 'Wenn die Anmeldung eingerichtet ist, wurde ein Link an die hinterlegte E-Mail-Adresse gesendet. Er gilt eine Stunde und funktioniert nur einmal.',
    changed: 'Das Passwort ist geändert.',
    reset_ok: 'Das Passwort ist geändert. Sie können sich jetzt anmelden.'
  };

  function cfg() {
    return global.ZEUS_AUTH || { BACKEND_URL: '', OWNER_EMAIL: '' };
  }

  function configured() {
    return !!String(cfg().BACKEND_URL || '').trim();
  }

  function readSession() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var session = JSON.parse(raw);
      if (!session || !session.token || !session.expiresAt || session.expiresAt <= Date.now()) {
        localStorage.removeItem(KEY);
        return null;
      }
      return session;
    } catch (e) {
      try { localStorage.removeItem(KEY); } catch (err) {}
      return null;
    }
  }

  function writeSession(session) {
    localStorage.setItem(KEY, JSON.stringify({ token: session.token, expiresAt: session.expiresAt }));
  }

  function clearSession() {
    try { localStorage.removeItem(KEY); } catch (e) {}
  }

  async function call(payload) {
    var url = String(cfg().BACKEND_URL || '').trim();
    if (!url) {
      var inactive = new Error('inactive');
      inactive.code = 'inactive';
      throw inactive;
    }
    var res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      var down = new Error('unreachable');
      down.code = 'unreachable';
      throw down;
    }
    var text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      var bad = new Error('unreachable');
      bad.code = 'unreachable';
      throw bad;
    }
  }

  global.ZeusAuth = {
    KEY: KEY,
    MSG: MSG,
    cfg: cfg,
    configured: configured,
    readSession: readSession,
    writeSession: writeSession,
    clearSession: clearSession,
    call: call
  };
})(window);
