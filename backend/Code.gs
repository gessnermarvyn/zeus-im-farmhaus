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
 * Reservierungen sind hier noch nicht angebunden. Dafür ist das Blatt
 * „Reservierungen“ vorgesehen; ausgelesen wird es später nur mit gültiger Sitzung.
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
    ['Reservierungen', ['created_at', 'name', 'phone', 'email', 'date', 'time', 'persons', 'message', 'status']]
  ];
  for (var i = 0; i < specs.length; i++) {
    var sh = ss.getSheetByName(specs[i][0]);
    if (!sh) {
      sh = ss.insertSheet(specs[i][0]);
      sh.appendRow(specs[i][1]);
      sh.setFrozenRows(1);
    }
  }
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
