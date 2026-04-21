// Shared nav-toggle handler for all pages that include the header
// markup with `<button class="nav-toggle" aria-expanded="false"
// aria-controls="nav-links-list">`.
//
// A++-S1 (WCAG 4.1.2 + 1.3.1): flip aria-expanded in step with the
// visual .open class so screen-reader users know when the menu
// disclosure is open vs collapsed. Replaces the pre-A++ inline
// onclick handler that only toggled the CSS class.
(function () {
  document.querySelectorAll('.nav-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      var list = document.querySelector('.nav-links');
      if (list) list.classList.toggle('open');
    });
  });
})();
