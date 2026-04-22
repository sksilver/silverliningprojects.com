// A++-C cookie consent banner state machine.
//
// Responsibilities:
//   1. Show the banner on pages that include #tk-consent-banner when the
//      user has not yet made a cookie decision.
//   2. Honor GPC / DNT privacy signals by revealing a prepended
//      disclosure sentence in the banner body (refinement b).
//   3. Translate Accept / Reject button clicks into Google Consent Mode
//      v2 updates plus a localStorage write so the choice survives reloads.
//   4. Expose window.tkConsent.manage() for the "Manage cookies" footer
//      link, which clears the stored choice and re-opens the banner
//      (refinement e).
//
// Known limitation (refinement d):
//   The very first pageview on the user's first visit fires AFTER gtag.js
//   loads but BEFORE the user has clicked Accept. The inline Consent Mode
//   v2 default-deny shim that runs BEFORE gtag.js prevents analytics_storage
//   cookies from being written on that pageview; GA4 still sends a
//   cookieless ping that Google models without identifier. Subsequent
//   pageviews after Accept are tracked normally. See
//   https://developers.google.com/tag-platform/security/guides/consent
//   for cookieless ping behavior.
//
// Storage: localStorage['tkConsent'] = 'accepted' | 'rejected'.

(function () {
  var STORAGE_KEY = 'tkConsent';
  var banner = document.getElementById('tk-consent-banner');
  if (!banner) return;

  function readConsent() {
    try { return localStorage.getItem(STORAGE_KEY); }
    catch (e) { return null; }
  }

  function writeConsent(value) {
    try { localStorage.setItem(STORAGE_KEY, value); }
    catch (e) { /* localStorage unavailable (private mode, quota) */ }
  }

  function clearConsent() {
    try { localStorage.removeItem(STORAGE_KEY); }
    catch (e) { /* no-op */ }
  }

  function detectPrivacySignal() {
    var gpc = (typeof navigator.globalPrivacyControl !== 'undefined')
              && navigator.globalPrivacyControl === true;
    var dnt = navigator.doNotTrack === '1'
              || navigator.doNotTrack === 'yes'
              || navigator.msDoNotTrack === '1'
              || window.doNotTrack === '1';
    return gpc || dnt;
  }

  function showBanner() {
    var signalEl = document.getElementById('tk-consent-signal');
    if (signalEl && detectPrivacySignal()) {
      signalEl.hidden = false;
    }
    banner.hidden = false;
  }

  function hideBanner() {
    banner.hidden = true;
  }

  function grantAnalytics() {
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        'analytics_storage': 'granted'
      });
    }
  }

  function denyAnalytics() {
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        'analytics_storage': 'denied'
      });
    }
  }

  var acceptBtn = document.getElementById('tk-consent-accept');
  var rejectBtn = document.getElementById('tk-consent-reject');

  if (acceptBtn) {
    acceptBtn.addEventListener('click', function () {
      writeConsent('accepted');
      grantAnalytics();
      hideBanner();
    });
  }
  if (rejectBtn) {
    rejectBtn.addEventListener('click', function () {
      writeConsent('rejected');
      denyAnalytics();
      hideBanner();
    });
  }

  window.tkConsent = {
    manage: function () {
      clearConsent();
      denyAnalytics();
      showBanner();
    }
  };

  document.querySelectorAll('[data-tk-consent-manage]').forEach(function (el) {
    el.addEventListener('click', function (ev) {
      ev.preventDefault();
      window.tkConsent.manage();
    });
  });

  var stored = readConsent();
  if (stored == null) {
    showBanner();
  }
  // If stored === 'accepted' the inline shim already granted analytics
  // before gtag.js loaded. If stored === 'rejected' the default-deny
  // from the shim stands. Either way, no banner needed on this load.
})();
