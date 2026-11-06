/**
 * Zeus im Farmhaus — Anmeldung für den Wirt.
 *
 * Gebunden an eine private Google-Tabelle. Das Web-App-Passwort liegt nur als
 * Salt + PBKDF2-HMAC-SHA256 vor, nie im Klartext. Sitzungen und
 * Zurücksetzen-Links werden nur als SHA-256 des Tokens gespeichert.
 *
 * Skripteigenschaften:
 *   OWNER_EMAIL       Empfänger für den Zurücksetzen-Link und später für Reservierungen
 *   SITE_URL          https://…/intern.html  (https, ohne #)
 *   INITIAL_PASSWORD  nur zum einmaligen Einrichten, wird danach gelöscht
 *   SPREADSHEET_ID    nur nötig, wenn das Skript nicht an der Tabelle hängt
 *
 * Im Editor einmal setupOwner ausführen, danach authorizeMail.
 * Bereitstellen: Ausführen als ich, Zugriff: Jeder. Die Tabelle selbst bleibt privat.
 *
 * Reservierungen liegen im Blatt „Reservierungen“. Der Storno-Link enthält nur
 * ein einmaliges Token; gespeichert wird der SHA-256. Tische: Skripteigenschaft
 * TABLES, z. B. 1:4,2:4,… (Nummer:Plätze). Leer = 16 Tische à 4 Plätze, 150 Minuten.
 */

var ITERATIONS = 10000;
var SESSION_MS = 12 * 60 * 60 * 1000;
var RESET_MS = 60 * 60 * 1000;
var LOGIN_MAX = 5;
var LOGIN_WINDOW_SEC = 15 * 60;
var RESET_MAX = 3;
var RESET_WINDOW_SEC = 60 * 60;
var MIN_PASSWORD = 10;
var MAX_PASSWORD = 200;
var SEAT_MINUTES = 150;
var RESERVE_MAX = 8;
var RESERVE_WINDOW_SEC = 60 * 60;
var RES_HEADERS = ['id', 'created_at', 'name', 'phone', 'email', 'date', 'time', 'persons', 'message', 'status', 'tables', 'lang', 'token_hash'];

function doGet() {
  return json({ ok: true, service: 'zeus-wirt', configured: !!readAuth() });
}

function doPost(e) {
  try {
    var raw = e && e.postData && e.postData.contents;
    var body = raw ? JSON.parse(raw) : {};
    return json(handle(body));
  } catch (err) {
    console.error(err && err.message ? err.message : err);
    return json({ ok: false, error: 'server' });
  }
}

function handle(body) {
  var action = String(body.action || '');
  if (action === 'login') return login(String(body.password || ''));
  if (action === 'logout') return logout(String(body.token || ''));
  if (action === 'session') return session(String(body.token || ''));
  if (action === 'change') return change(String(body.token || ''), String(body.oldPassword || ''), String(body.newPassword || ''));
  if (action === 'forgot') return forgot();
  if (action === 'reset') return reset(String(body.token || ''), String(body.newPassword || ''));
  if (action === 'reserve') return reserve(body);
  if (action === 'cancel-info') return cancelInfo(String(body.token || ''));
  if (action === 'cancel') return cancelBooking(String(body.token || ''));
  if (action === 'reservations') return listReservations(String(body.token || ''));
  if (action === 'set-tables') return setTables(String(body.token || ''), String(body.id || ''), String(body.tables || ''));
  return { ok: false, error: 'server' };
}

function setupOwner() {
  var props = PropertiesService.getScriptProperties();
  var password = props.getProperty('INITIAL_PASSWORD') || '';
  var email = String(props.getProperty('OWNER_EMAIL') || '').trim();
  var site = String(props.getProperty('SITE_URL') || '').trim();
  if (!password || !email || !site) {
    throw new Error('OWNER_EMAIL, SITE_URL und INITIAL_PASSWORD in den Skripteigenschaften setzen.');
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('OWNER_EMAIL ist keine E-Mail-Adresse.');
  if (!/^https:\/\/[^\s#]+\/intern\.html$/.test(site)) {
    throw new Error('SITE_URL muss https://…/intern.html sein, ohne #.');
  }
  if (!strong(password)) throw new Error('INITIAL_PASSWORD mindestens 10 und höchstens 200 Zeichen.');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    ensureSheets();
    var salt = randomBytes(16);
    var hash = pbkdf2(password, salt, ITERATIONS, 32);
    writeAuth(salt, hash, ITERATIONS);
    clearSheetRows('Sitzungen');
    clearSheetRows('Resets');
    props.deleteProperty('INITIAL_PASSWORD');
  } finally {
    lock.releaseLock();
  }
  console.log('Passwort nur als Hash gespeichert. INITIAL_PASSWORD wurde gelöscht.');
}

function authorizeMail() {
  var email = String(PropertiesService.getScriptProperties().getProperty('OWNER_EMAIL') || '').trim();
  if (!email) throw new Error('OWNER_EMAIL fehlt.');
  MailApp.sendEmail(
    email,
    'Zeus im Farmhaus · E-Mail-Versand bereit',
    'Diese Nachricht prüft nur, ob der Versand klappt. Es ist kein Link zum Zurücksetzen.\n\nZeus im Farmhaus'
  );
}

function login(password) {
  return withLock(function () {
    var gate = rateLimited('login', LOGIN_MAX, LOGIN_WINDOW_SEC);
    if (gate.limited) return { ok: false, error: 'rate_limited', retryAfterSec: gate.retryAfterSec };
    var rec = readAuth();
    if (!rec) return { ok: false, error: 'not_configured' };
    var hash = pbkdf2(password, rec.salt, rec.iterations, 32);
    if (!timingEqual(bytesToBase64(hash), rec.hash)) {
      rateFail('login', LOGIN_WINDOW_SEC);
      return { ok: false, error: 'invalid' };
    }
    rateClear('login');
    return issueSession();
  });
}

function logout(token) {
  return withLock(function () {
    if (token) deleteHash('Sitzungen', sha256Text(token));
    return { ok: true };
  });
}

function session(token) {
  if (!token) return { ok: false, error: 'session' };
  var row = findHash('Sitzungen', sha256Text(token));
  if (!row || asTime(row.values[1]) <= Date.now()) {
    if (row) deleteHash('Sitzungen', sha256Text(token));
    return { ok: false, error: 'session' };
  }
  return { ok: true, expiresAt: asTime(row.values[1]) };
}

function change(token, oldPassword, newPassword) {
  return withLock(function () {
    var current = session(token);
    if (!current.ok) return current;
    var gate = rateLimited('change', LOGIN_MAX, LOGIN_WINDOW_SEC);
    if (gate.limited) return { ok: false, error: 'rate_limited', retryAfterSec: gate.retryAfterSec };
    if (!strong(newPassword)) return { ok: false, error: 'weak' };
    if (oldPassword === newPassword) return { ok: false, error: 'same' };
    var rec = readAuth();
    if (!rec) return { ok: false, error: 'not_configured' };
    var oldHash = pbkdf2(oldPassword, rec.salt, rec.iterations, 32);
    if (!timingEqual(bytesToBase64(oldHash), rec.hash)) {
      rateFail('change', LOGIN_WINDOW_SEC);
      return { ok: false, error: 'invalid' };
    }
    var salt = randomBytes(16);
    var hash = pbkdf2(newPassword, salt, ITERATIONS, 32);
    writeAuth(salt, hash, ITERATIONS);
    clearSheetRows('Sitzungen');
    rateClear('change');
    return issueSession();
  });
}

function forgot() {
  var pending = withLock(function () {
    var gate = rateLimited('reset', RESET_MAX, RESET_WINDOW_SEC);
    if (gate.limited) return { ok: false, error: 'rate_limited', retryAfterSec: gate.retryAfterSec };
    rateFail('reset', RESET_WINDOW_SEC);
    var props = PropertiesService.getScriptProperties();
    var email = String(props.getProperty('OWNER_EMAIL') || '').trim();
    var site = String(props.getProperty('SITE_URL') || '').trim();
    var rec = readAuth();
    if (!rec || !email || !/^https:\/\/[^\s#]+\/intern\.html$/.test(site)) {
      return { ok: false, error: 'not_configured' };
    }
    clearSheetRows('Resets');
    var token = bytesToBase64Url(randomBytes(32));
    var expires = Date.now() + RESET_MS;
    sheet('Resets').appendRow([sha256Text(token), String(expires), 'nein']);
    return { ok: true, email: email, link: site + '#reset=' + token };
  });
  if (!pending.ok) return { ok: false, error: pending.error, retryAfterSec: pending.retryAfterSec };
  MailApp.sendEmail(
    pending.email,
    'Passwort zurücksetzen · Zeus im Farmhaus',
    'Guten Tag,\n\n' +
    'für die Wirt-Anmeldung von Zeus im Farmhaus wurde ein neues Passwort angefordert.\n\n' +
    'Dieser Link gilt eine Stunde und funktioniert nur einmal:\n' + pending.link + '\n\n' +
    'Wenn Sie das nicht waren, ignorieren Sie diese E-Mail. Das bisherige Passwort bleibt dann gültig.\n\n' +
    'Zeus im Farmhaus'
  );
  return { ok: true, sent: true };
}

function reset(token, newPassword) {
  return withLock(function () {
    if (!token) return { ok: false, error: 'expired' };
    if (!strong(newPassword)) return { ok: false, error: 'weak' };
    var rec = readAuth();
    if (!rec) return { ok: false, error: 'not_configured' };
    var row = findHash('Resets', sha256Text(token));
    if (!row || String(row.values[2]) === 'ja' || asTime(row.values[1]) <= Date.now()) {
      return { ok: false, error: 'expired' };
    }
    sheet('Resets').getRange(row.index, 3).setValue('ja');
    var salt = randomBytes(16);
    var hash = pbkdf2(newPassword, salt, ITERATIONS, 32);
    writeAuth(salt, hash, ITERATIONS);
    clearSheetRows('Sitzungen');
    clearSheetRows('Resets');
    return { ok: true };
  });
}

function issueSession() {
  purgeExpired('Sitzungen', 1);
  var token = bytesToBase64Url(randomBytes(32));
  var expires = Date.now() + SESSION_MS;
  sheet('Sitzungen').appendRow([sha256Text(token), String(expires), String(Date.now())]);
  return { ok: true, token: token, expiresAt: expires };
}

function withLock(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function propsDb() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  return SpreadsheetApp.getActiveSpreadsheet();
}

function sheet(name) {
  var ss = propsDb();
  if (!ss) throw new Error('no spreadsheet');
  var sh = ss.getSheetByName(name);
  if (!sh) throw new Error('missing sheet ' + name);
  return sh;
}

function ensureSheets() {
  var ss = propsDb();
  if (!ss) throw new Error('Keine Tabelle. Skript an die Tabelle binden oder SPREADSHEET_ID setzen.');
  var specs = [
    ['Zugang', ['salt_b64', 'hash_b64', 'iterations', 'updated_at']],
    ['Sitzungen', ['token_hash', 'expires_at', 'created_at']],
    ['Resets', ['token_hash', 'expires_at', 'used']],
    ['Reservierungen', RES_HEADERS]
  ];
  for (var i = 0; i < specs.length; i++) {
    var sh = ss.getSheetByName(specs[i][0]);
    if (!sh) {
      sh = ss.insertSheet(specs[i][0]);
      sh.getRange(1, 1, 1, specs[i][1].length).setValues([specs[i][1]]);
      sh.setFrozenRows(1);
    } else {
      ensureHeaders(sh, specs[i][1]);
    }
  }
}

function ensureHeaders(sh, headers) {
  var width = Math.max(sh.getLastColumn(), 1);
  var have = sh.getRange(1, 1, 1, width).getValues()[0].map(function (h) { return String(h || ''); }).filter(String);
  if (!have.length) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.setFrozenRows(1);
    return;
  }
  var missing = headers.filter(function (h) { return have.indexOf(h) === -1; });
  if (missing.length) sh.getRange(1, have.length + 1, 1, missing.length).setValues([missing]);
}

function writeAuth(salt, hash, iterations) {
  var sh = sheet('Zugang');
  sh.clear();
  sh.getRange(1, 1, 1, 4).setValues([['salt_b64', 'hash_b64', 'iterations', 'updated_at']]);
  sh.getRange(2, 1, 1, 4).setNumberFormats([['@', '@', '@', '@']]);
  sh.getRange(2, 1, 1, 4).setValues([[bytesToBase64(salt), bytesToBase64(hash), String(iterations), String(Date.now())]]);
  sh.setFrozenRows(1);
}

function readAuth() {
  var ss = propsDb();
  if (!ss) return null;
  var sh = ss.getSheetByName('Zugang');
  if (!sh || sh.getLastRow() < 2) return null;
  var row = sh.getRange(2, 1, 1, 4).getValues()[0];
  var iterations = Number(row[2]);
  if (!row[0] || !row[1] || iterations < 10000 || iterations > 20000) return null;
  return { salt: base64ToBytes(String(row[0])), hash: String(row[1]), iterations: iterations };
}

function clearSheetRows(name) {
  var sh = sheet(name);
  var last = sh.getLastRow();
  if (last > 1) sh.deleteRows(2, last - 1);
}

function findHash(name, hash) {
  var sh = sheet(name);
  var values = sh.getDataRange().getValues();
  for (var r = 1; r < values.length; r++) {
    if (timingEqual(String(values[r][0]), hash)) return { index: r + 1, values: values[r] };
  }
  return null;
}

function deleteHash(name, hash) {
  var found = findHash(name, hash);
  if (found) sheet(name).deleteRow(found.index);
}

function purgeExpired(name, timeCol) {
  var sh = sheet(name);
  var values = sh.getDataRange().getValues();
  var now = Date.now();
  for (var r = values.length - 1; r >= 1; r--) {
    if (asTime(values[r][timeCol]) <= now) sh.deleteRow(r + 1);
  }
}

function asTime(value) {
  if (Object.prototype.toString.call(value) === '[object Date]') return value.getTime();
  return Number(value);
}

function strong(password) {
  return typeof password === 'string' && password.length >= MIN_PASSWORD && password.length <= MAX_PASSWORD;
}

function rateKey(bucket) {
  return 'rl:' + bucket;
}

function rateState(bucket) {
  var raw = CacheService.getScriptCache().get(rateKey(bucket));
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

function rateLimited(bucket, max, windowSec) {
  var state = rateState(bucket);
  if (!state) return { limited: false };
  var now = Date.now();
  if (now - state.start >= windowSec * 1000) return { limited: false };
  if (state.count >= max) {
    return { limited: true, retryAfterSec: Math.max(1, Math.ceil((state.start + windowSec * 1000 - now) / 1000)) };
  }
  return { limited: false };
}

function rateFail(bucket, windowSec) {
  var now = Date.now();
  var state = rateState(bucket);
  if (!state || now - state.start >= windowSec * 1000) state = { count: 0, start: now };
  state.count += 1;
  CacheService.getScriptCache().put(rateKey(bucket), JSON.stringify(state), windowSec);
}

function rateClear(bucket) {
  CacheService.getScriptCache().remove(rateKey(bucket));
}

function sha256Text(text) {
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(text), Utilities.Charset.UTF_8);
  return Utilities.base64Encode(raw);
}

function randomBytes(n) {
  var out = [];
  var guard = 0;
  while (out.length < n && guard < 8) {
    guard++;
    var digest = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      Utilities.getUuid() + '|' + Utilities.getUuid() + '|' + guard
    );
    for (var i = 0; i < digest.length && out.length < n; i++) {
      out.push(digest[i] < 0 ? digest[i] + 256 : digest[i]);
    }
  }
  if (out.length < n) throw new Error('entropy');
  return out;
}

function hmacSha256(messageUnsigned, password) {
  var signed = [];
  for (var i = 0; i < messageUnsigned.length; i++) {
    var n = messageUnsigned[i] & 255;
    signed.push(n > 127 ? n - 256 : n);
  }
  var raw = Utilities.computeHmacSha256Signature(signed, password);
  var out = [];
  for (var j = 0; j < raw.length; j++) out.push(raw[j] < 0 ? raw[j] + 256 : raw[j]);
  return out;
}

function pbkdf2(password, salt, iterations, dkLen) {
  var u = hmacSha256(salt.concat([0, 0, 0, 1]), password);
  var t = u.slice();
  for (var i = 1; i < iterations; i++) {
    u = hmacSha256(u, password);
    for (var j = 0; j < t.length; j++) t[j] = (t[j] ^ u[j]) & 255;
  }
  return t.slice(0, dkLen);
}

function bytesToBase64(unsigned) {
  var signed = [];
  for (var i = 0; i < unsigned.length; i++) {
    var n = unsigned[i] & 255;
    signed.push(n > 127 ? n - 256 : n);
  }
  return Utilities.base64Encode(signed);
}

function base64ToBytes(b64) {
  var signed = Utilities.base64Decode(b64);
  var out = [];
  for (var i = 0; i < signed.length; i++) out.push(signed[i] < 0 ? signed[i] + 256 : signed[i]);
  return out;
}

function bytesToBase64Url(unsigned) {
  return bytesToBase64(unsigned).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function timingEqual(a, b) {
  a = String(a);
  b = String(b);
  var diff = a.length ^ b.length;
  var n = Math.max(a.length, b.length);
  for (var i = 0; i < n; i++) {
    var ca = i < a.length ? a.charCodeAt(i) : 0;
    var cb = i < b.length ? b.charCodeAt(i) : 0;
    diff |= ca ^ cb;
  }
  return diff === 0;
}

var WEEK = {
  de: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  el: ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο', 'Κυριακή']
};
var MONTH = {
  de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  el: ['Ιανουαρίου', 'Φεβρουαρίου', 'Μαρτίου', 'Απριλίου', 'Μαΐου', 'Ιουνίου', 'Ιουλίου', 'Αυγούστου', 'Σεπτεμβρίου', 'Οκτωβρίου', 'Νοεμβρίου', 'Δεκεμβρίου']
};

function reserve(body) {
  var gate = rateLimited('reserve', RESERVE_MAX, RESERVE_WINDOW_SEC);
  if (gate.limited) return { ok: false, error: 'rate_limited', retryAfterSec: gate.retryAfterSec };
  rateFail('reserve', RESERVE_WINDOW_SEC);
  if (cleanLine(body.company, 80)) return { ok: true };
  var name = cleanLine(body.name, 80);
  var tel = cleanLine(body.tel, 40);
  var email = cleanLine(body.email, 120);
  var date = cleanLine(body.date, 10);
  var time = cleanLine(body.time, 5);
  var persons = Number(body.persons);
  var message = cleanLine(body.message, 500);
  var lang = body.lang === 'en' || body.lang === 'el' ? body.lang : 'de';
  if (name.length < 2 || !/^[+0-9 ()\/-]{6,}$/.test(tel) || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: 'invalid' };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return { ok: false, error: 'invalid' };
  if (!(persons >= 1 && persons <= 20)) return { ok: false, error: 'invalid' };
  var mailKey = sha256Text(email.toLowerCase()).replace(/[^A-Za-z0-9]/g, '').slice(0, 20);
  var mailGate = rateLimited('reserve-mail-' + mailKey, 3, RESERVE_WINDOW_SEC);
  if (mailGate.limited) return { ok: false, error: 'rate_limited', retryAfterSec: mailGate.retryAfterSec };
  if (!publicBase() || !ownerEmail() || !readAuth()) return { ok: false, error: 'not_configured' };
  var start = berlinMillis(date, time);
  if (!start) return { ok: false, error: 'invalid' };
  var weekday = Number(Utilities.formatDate(new Date(start), 'Europe/Berlin', 'u'));
  if (weekday === 2) return { ok: false, error: 'closed' };
  var minutes = timeToMinutes(time);
  if (minutes < 17 * 60 + 30 || minutes > 22 * 60) return { ok: false, error: 'invalid' };
  var todayKey = Utilities.formatDate(new Date(), 'Europe/Berlin', 'yyyy-MM-dd');
  if (date < todayKey || start <= Date.now()) return { ok: false, error: 'past' };
  return withLock(function () {
    var tables = loadTables();
    var existing = activeBookings().filter(function (r) { return r.date === date; });
    var found = assignTables(tables, existing, minutes, persons);
    if (!found.ok) return { ok: false, error: 'full' };
    var id = bytesToBase64Url(randomBytes(9));
    var token = bytesToBase64Url(randomBytes(32));
    var record = {
      id: id,
      created_at: String(Date.now()),
      name: name,
      phone: tel,
      email: email,
      date: date,
      time: time,
      persons: String(persons),
      message: message,
      status: 'bestätigt',
      tables: found.label,
      lang: lang,
      token_hash: sha256Text(token)
    };
    appendByHeader('Reservierungen', record);
    var link = publicBase() + 'storno.html#' + token;
    var guest = guestMail('book', lang, name, date, time, persons, found.label, link);
    var owner = ownerEmail();
    try {
      MailApp.sendEmail(email, guest.subject, guest.body);
    } catch (err) {
      deleteReservation(id);
      throw err;
    }
    try {
      MailApp.sendEmail(owner, 'Neue Reservierung: ' + name + ' am ' + shortDate(date, 'de') + ' ' + time, ownerBody('neu', record));
    } catch (err) {
      console.error(err && err.message ? err.message : err);
    }
    rateFail('reserve-mail-' + mailKey, RESERVE_WINDOW_SEC);
    return { ok: true, tables: found.label };
  });
}

function cancelInfo(token) {
  if (!token) return { ok: false, error: 'expired' };
  var row = findBookingByToken(token);
  if (!row) return { ok: false, error: 'expired' };
  return { ok: true, booking: publicBooking(row) };
}

function cancelBooking(token) {
  var gate = rateLimited('cancel-guess', 30, RESERVE_WINDOW_SEC);
  if (gate.limited) return { ok: false, error: 'rate_limited', retryAfterSec: gate.retryAfterSec };
  if (!token) return { ok: false, error: 'expired' };
  return withLock(function () {
    var row = findBookingByToken(token);
    if (!row) {
      rateFail('cancel-guess', RESERVE_WINDOW_SEC);
      return { ok: false, error: 'expired' };
    }
    var view = publicBooking(row);
    if (view.status === 'storniert') return { ok: true, booking: view, already: true };
    if (!view.canCancel) return { ok: false, error: 'late', booking: view };
    setField(row.sheet, row.index, row.map, 'status', 'storniert');
    view.status = 'storniert';
    view.canCancel = false;
    var guest = guestMail('cancel', view.lang, view.name, view.date, view.time, Number(view.persons), view.tables, '');
    try { MailApp.sendEmail(row.email, guest.subject, guest.body); } catch (err) { console.error(err && err.message ? err.message : err); }
    try {
      MailApp.sendEmail(ownerEmail(), 'Stornierung: ' + view.name + ' am ' + shortDate(view.date, 'de') + ' ' + view.time, ownerBody('storno', {
        name: view.name, phone: row.phone, email: row.email, date: view.date, time: view.time, persons: view.persons, tables: view.tables, message: row.message, lang: view.lang
      }));
    } catch (err) { console.error(err && err.message ? err.message : err); }
    return { ok: true, booking: view };
  });
}

function listReservations(token) {
  var current = session(token);
  if (!current.ok) return current;
  var tables = loadTables();
  var from = Utilities.formatDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), 'Europe/Berlin', 'yyyy-MM-dd');
  var rows = activeBookings(true).filter(function (r) { return r.date >= from; }).map(function (r) {
    return { id: r.id, name: r.name, phone: r.phone, email: r.email, date: r.date, time: r.time, persons: r.persons, message: r.message, status: r.status, tables: r.tables };
  });
  return { ok: true, tables: tables.map(function (t) { return t.n; }), seats: tables.map(function (t) { return t.seats; }), seatMinutes: SEAT_MINUTES, rows: rows };
}

function setTables(token, id, label) {
  var current = session(token);
  if (!current.ok) return current;
  return withLock(function () {
    var row = findBookingById(id);
    if (!row) return { ok: false, error: 'invalid' };
    var ids = expandTables(label);
    var known = {};
    loadTables().forEach(function (t) { known[t.n] = true; });
    if (!ids.length || ids.some(function (n) { return !known[n]; })) return { ok: false, error: 'invalid' };
    var nums = ids.map(Number);
    var contiguous = nums.every(function (n, i) { return i === 0 || n === nums[i - 1] + 1; });
    var pretty = ids.length === 1 ? ids[0] : (contiguous ? ids[0] + '–' + ids[ids.length - 1] : ids.join(', '));
    setField(row.sheet, row.index, row.map, 'tables', pretty);
    return { ok: true, tables: pretty };
  });
}

function publicBooking(row) {
  var persons = Number(row.persons);
  var start = berlinMillis(row.date, row.time);
  var deadline = start - (persons <= 6 ? 24 : 48) * 60 * 60 * 1000;
  var cancelled = row.status === 'storniert';
  return {
    name: row.name,
    date: row.date,
    time: row.time,
    persons: persons,
    tables: row.tables,
    lang: row.lang || 'de',
    status: row.status,
    canCancel: !cancelled && Date.now() < deadline,
    deadline: deadline
  };
}

function guestMail(kind, lang, name, date, time, persons, tables, link) {
  var when = prettyDate(date, lang);
  var people = String(persons);
  var hours = lang === 'en'
    ? 'Wednesday–Monday 17:30–23:00\nClosed on Tuesdays'
    : lang === 'el'
      ? 'Τετάρτη–Δευτέρα 17:30–23:00\nΤρίτη κλειστά'
      : 'Mittwoch–Montag 17:30–23:00\nDienstag Ruhetag';
  var sign = 'Zeus im Farmhaus\nZum Teich 1\n49536 Lienen\n' + hours;
  if (kind === 'cancel') {
    var cSubject = lang === 'en'
      ? 'Cancellation at Zeus im Farmhaus on ' + shortDate(date, 'en')
      : lang === 'el'
        ? 'Ακύρωση στο Zeus im Farmhaus στις ' + shortDate(date, 'el')
        : 'Stornierung im Zeus im Farmhaus am ' + shortDate(date, 'de');
    var cBody = (lang === 'el' ? 'Καλημέρα ' : 'Kalimera ') + name + ',\n\n' +
      (lang === 'en'
        ? 'Your reservation has been cancelled.\n\n'
        : lang === 'el'
          ? 'Η κράτησή σας ακυρώθηκε.\n\n'
          : 'Ihre Reservierung ist storniert.\n\n') +
      when + '\n' + time + '\n' + people + '\n\n' + sign;
    return { subject: cSubject, body: cBody };
  }
  var subject = lang === 'en'
    ? 'Your reservation at Zeus im Farmhaus on ' + shortDate(date, 'en')
    : lang === 'el'
      ? 'Η κράτησή σας στο Zeus im Farmhaus στις ' + shortDate(date, 'el')
      : 'Ihre Reservierung im Zeus im Farmhaus am ' + shortDate(date, 'de');
  var intro = lang === 'en'
    ? 'we are looking forward to seeing you.'
    : lang === 'el'
      ? 'χαρήκαμε για την κράτησή σας.'
      : 'wir freuen uns auf Sie.';
  var labels = lang === 'en'
    ? ['Date', 'Time', 'Guests', 'Table']
    : lang === 'el'
      ? ['Ημερομηνία', 'Ώρα', 'Άτομα', 'Τραπέζι']
      : ['Datum', 'Uhrzeit', 'Personen', 'Tisch'];
  var rule = lang === 'en'
    ? 'If you cannot come, please cancel using this link: ' + link + '. For parties of up to 6, you can cancel until 24 hours before. For larger parties, please cancel at least 2 days before. After that, please call us on 05483 749534.'
    : lang === 'el'
      ? 'Αν δεν μπορέσετε να έρθετε, ακυρώστε από αυτόν τον σύνδεσμο: ' + link + '. Μέχρι 6 άτομα, η ακύρωση γίνεται έως 24 ώρες πριν. Για μεγαλύτερες παρέες, το αργότερο 2 ημέρες πριν. Μετά από αυτό καλέστε μας στο 05483 749534.'
      : 'Falls Sie nicht kommen können, stornieren Sie bitte über diesen Link: ' + link + '. Bei bis zu 6 Personen geht das bis 24 Stunden vorher, bei größeren Gruppen bis spätestens 2 Tage vorher. Danach erreichen Sie uns bitte telefonisch unter 05483 749534.';
  var hello = (lang === 'el' ? 'Καλημέρα ' : 'Kalimera ') + name + ',\n\n' + intro + '\n\n' +
    labels[0] + ': ' + when + '\n' + labels[1] + ': ' + time + '\n' + labels[2] + ': ' + people + '\n' + labels[3] + ': ' + tables + '\n\n' +
    rule + '\n\n' + sign;
  return { subject: subject, body: hello };
}

function ownerBody(kind, record) {
  var head = kind === 'storno' ? 'Eine Reservierung wurde storniert.' : 'Neue Reservierung über die Website.';
  return head + '\n\n' +
    'Name: ' + record.name + '\n' +
    'Telefon: ' + record.phone + '\n' +
    'E-Mail: ' + record.email + '\n' +
    'Datum: ' + shortDate(record.date, 'de') + '\n' +
    'Uhrzeit: ' + record.time + '\n' +
    'Personen: ' + record.persons + '\n' +
    'Tisch: ' + record.tables + '\n' +
    'Sprache: ' + (record.lang || 'de') + '\n' +
    (record.message ? 'Nachricht: ' + record.message + '\n' : '');
}

function loadTables() {
  var raw = String(PropertiesService.getScriptProperties().getProperty('TABLES') || '').trim();
  if (!raw) {
    var out = [];
    for (var i = 1; i <= 16; i++) out.push({ n: String(i), seats: 4 });
    return out;
  }
  return raw.split(',').map(function (part, idx) {
    var bits = part.trim().split(':');
    if (bits.length === 2) return { n: bits[0].trim(), seats: Number(bits[1]) };
    return { n: String(idx + 1), seats: Number(part) };
  }).filter(function (t) { return t.n && t.seats > 0; });
}

function expandTables(label) {
  var s = String(label || '').replace(/Tisch/gi, '').trim();
  if (!s) return [];
  var ids = [];
  s.split(/[,/]/).forEach(function (part) {
    var range = part.trim().match(/^(\d+)\s*[–\-]\s*(\d+)$/);
    if (range) {
      var a = Number(range[1]), b = Number(range[2]);
      for (var i = Math.min(a, b); i <= Math.max(a, b); i++) ids.push(String(i));
    } else {
      var one = part.trim().match(/(\d+)/);
      if (one) ids.push(one[1]);
    }
  });
  return ids;
}

function assignTables(tables, existing, startMin, guests) {
  var busy = {};
  existing.forEach(function (r) {
    if (r.status === 'storniert') return;
    if (!(startMin < r.startMin + SEAT_MINUTES && r.startMin < startMin + SEAT_MINUTES)) return;
    expandTables(r.tables).forEach(function (id) { busy[id] = true; });
  });
  for (var i = 0; i < tables.length; i++) {
    var sum = 0;
    var span = [];
    for (var j = i; j < tables.length; j++) {
      if (busy[tables[j].n]) break;
      span.push(tables[j]);
      sum += tables[j].seats;
      if (sum >= guests) {
        var label = span.length === 1 ? span[0].n : span[0].n + '–' + span[span.length - 1].n;
        return { ok: true, label: label };
      }
    }
  }
  return { ok: false };
}

function activeBookings(includeCancelled) {
  var ss = propsDb();
  if (!ss || !ss.getSheetByName('Reservierungen')) return [];
  var sh = sheet('Reservierungen');
  ensureHeaders(sh, RES_HEADERS);
  var map = headerMap(sh);
  var values = sh.getDataRange().getValues();
  var out = [];
  for (var r = 1; r < values.length; r++) {
    var status = String(field(values[r], map, 'status') || '');
    if (!includeCancelled && status === 'storniert') continue;
    var date = asDateStr(field(values[r], map, 'date'));
    var time = asTimeStr(field(values[r], map, 'time'));
    if (!date || !time) continue;
    out.push({
      index: r + 1,
      sheet: sh,
      map: map,
      id: String(field(values[r], map, 'id') || ''),
      name: String(field(values[r], map, 'name') || ''),
      phone: String(field(values[r], map, 'phone') || ''),
      email: String(field(values[r], map, 'email') || ''),
      date: date,
      time: time,
      startMin: timeToMinutes(time),
      persons: Number(field(values[r], map, 'persons') || 0),
      message: String(field(values[r], map, 'message') || ''),
      status: status,
      tables: String(field(values[r], map, 'tables') || ''),
      lang: String(field(values[r], map, 'lang') || 'de'),
      tokenHash: String(field(values[r], map, 'token_hash') || '')
    });
  }
  return out;
}

function findBookingByToken(token) {
  var hash = sha256Text(token);
  var rows = activeBookings(true);
  for (var i = 0; i < rows.length; i++) if (timingEqual(rows[i].tokenHash, hash)) return rows[i];
  return null;
}

function findBookingById(id) {
  var rows = activeBookings(true);
  for (var i = 0; i < rows.length; i++) if (rows[i].id === id) return rows[i];
  return null;
}

function deleteReservation(id) {
  var row = findBookingById(id);
  if (row) row.sheet.deleteRow(row.index);
}

function appendByHeader(name, record) {
  ensureSheets();
  var sh = sheet(name);
  ensureHeaders(sh, RES_HEADERS);
  var headers = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), RES_HEADERS.length)).getValues()[0].map(function (h) { return String(h || ''); });
  var line = headers.map(function (h) { return record[h] != null ? String(record[h]) : ''; });
  var at = sh.getLastRow() + 1;
  sh.getRange(at, 1, 1, line.length).setNumberFormats([line.map(function () { return '@'; })]);
  sh.getRange(at, 1, 1, line.length).setValues([line]);
}

function headerMap(sh) {
  var headers = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0].map(function (h) { return String(h || ''); });
  var map = {};
  headers.forEach(function (h, i) { if (h) map[h] = i; });
  return map;
}

function field(row, map, name) {
  return map[name] === undefined ? '' : row[map[name]];
}

function setField(sh, index, map, name, value) {
  if (map[name] === undefined) return;
  sh.getRange(index, map[name] + 1).setNumberFormat('@').setValue(String(value));
}

function publicBase() {
  var site = String(PropertiesService.getScriptProperties().getProperty('SITE_URL') || '').trim();
  if (!/^https:\/\/[^\s#]+\/intern\.html$/.test(site)) return '';
  return site.replace(/intern\.html$/, '');
}

function ownerEmail() {
  return String(PropertiesService.getScriptProperties().getProperty('OWNER_EMAIL') || '').trim();
}

function cleanLine(value, max) {
  return String(value || '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);
}

function timeToMinutes(time) {
  var bits = String(time || '').split(':');
  return Number(bits[0]) * 60 + Number(bits[1] || 0);
}

function berlinMillis(date, time) {
  try {
    return Utilities.parseDate(date + ' ' + time, 'Europe/Berlin', 'yyyy-MM-dd HH:mm').getTime();
  } catch (err) {
    return 0;
  }
}

function asDateStr(value) {
  if (Object.prototype.toString.call(value) === '[object Date]') return Utilities.formatDate(value, 'Europe/Berlin', 'yyyy-MM-dd');
  var s = String(value || '');
  var m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  return m ? m[1] + '-' + m[2] + '-' + m[3] : s.slice(0, 10);
}

function asTimeStr(value) {
  if (Object.prototype.toString.call(value) === '[object Date]') return Utilities.formatDate(value, 'Europe/Berlin', 'HH:mm');
  var m = String(value || '').match(/(\d{1,2}):(\d{2})/);
  if (!m) return '';
  return (m[1].length === 1 ? '0' + m[1] : m[1]) + ':' + m[2];
}

function prettyDate(iso, lang) {
  var parsed = Utilities.parseDate(iso + ' 12:00', 'Europe/Berlin', 'yyyy-MM-dd HH:mm');
  var isoDow = Number(Utilities.formatDate(parsed, 'Europe/Berlin', 'u'));
  var day = Number(Utilities.formatDate(parsed, 'Europe/Berlin', 'd'));
  var month = Number(Utilities.formatDate(parsed, 'Europe/Berlin', 'M'));
  var year = Utilities.formatDate(parsed, 'Europe/Berlin', 'yyyy');
  var wd = (WEEK[lang] || WEEK.de)[isoDow - 1];
  var mo = (MONTH[lang] || MONTH.de)[month - 1];
  if (lang === 'de') return wd + ', ' + day + '. ' + mo + ' ' + year;
  return wd + ', ' + day + ' ' + mo + ' ' + year;
}

function shortDate(iso, lang) {
  var parsed = Utilities.parseDate(iso + ' 12:00', 'Europe/Berlin', 'yyyy-MM-dd HH:mm');
  var day = Number(Utilities.formatDate(parsed, 'Europe/Berlin', 'd'));
  var month = Number(Utilities.formatDate(parsed, 'Europe/Berlin', 'M'));
  var year = Utilities.formatDate(parsed, 'Europe/Berlin', 'yyyy');
  var mo = (MONTH[lang] || MONTH.de)[month - 1];
  if (lang === 'de') return day + '. ' + mo + ' ' + year;
  return day + ' ' + mo + ' ' + year;
}
