(function () {
  var cfg = window.ZEUS_SOCIAL || {};
  var igOk = /^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._]+\/?$/;
  var fbOk = /^https:\/\/(www\.)?facebook\.com\/[A-Za-z0-9.\-]+\/?$/;
  var items = [];
  if (igOk.test(String(cfg.instagram || ''))) items.push({ href: cfg.instagram, label: 'Instagram', kind: 'ig' });
  if (fbOk.test(String(cfg.facebook || ''))) items.push({ href: cfg.facebook, label: 'Facebook', kind: 'fb' });
  if (!items.length) return;
  var icons = {
    ig: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="3.8" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="17.4" cy="6.6" r=".9" fill="currentColor"/></svg>',
    fb: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14.2 8.5h2.6V5.7h-2.6c-2.1 0-3.7 1.7-3.7 3.8v1.8H8.2v2.8h2.3V21h3.1v-6.9h2.4l.4-2.8h-2.8V9.6c0-.6.4-1.1 1-1.1z"/></svg>'
  };
  document.querySelectorAll('[data-social]').forEach(function (box) {
    box.hidden = false;
    box.innerHTML = items.map(function (it) {
      return '<a href="' + it.href + '" target="_blank" rel="noopener noreferrer">' + icons[it.kind] + '<span>' + it.label + '</span></a>';
    }).join('');
  });
})();
