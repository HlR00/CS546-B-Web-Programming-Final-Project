/* NYC Roots & Flavors — Nav interactions */
(function () {
  'use strict';

  /* ---- User dropdown ---- */
  const menuBtn    = document.getElementById('user-menu-btn');
  const dropdown   = document.getElementById('user-dropdown');
  const menuWrap   = document.getElementById('user-menu-container');

  if (menuBtn && dropdown) {
    menuBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      const isOpen = dropdown.hidden === false;
      dropdown.hidden = isOpen;
      menuBtn.setAttribute('aria-expanded', String(!isOpen));
    });

    document.addEventListener('click', function (e) {
      if (menuWrap && !menuWrap.contains(e.target)) {
        dropdown.hidden = true;
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !dropdown.hidden) {
        dropdown.hidden = true;
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.focus();
      }
    });
  }

  /* ---- Mobile hamburger ---- */
  const hamburger = document.getElementById('hamburger-btn');
  const mobileNav = document.getElementById('mobile-nav');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', function () {
      const isOpen = mobileNav.hidden === false;
      mobileNav.hidden = isOpen;
      hamburger.setAttribute('aria-expanded', String(!isOpen));
      hamburger.setAttribute('aria-label', isOpen ? 'Open navigation menu' : 'Close navigation menu');
    });
  }

  /* ---- Highlight active nav link ---- */
  const path = window.location.pathname;
  document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(function (link) {
    const href = link.getAttribute('href');
    if (href && path.startsWith(href) && href !== '/') {
      link.classList.add('nav-link--active');
      link.classList.add('mobile-nav-link--active');
    }
  });
})();
