/**
 * Aviation News - Main Application JavaScript
 * Dark-themed news site with vanilla JS interactions.
 */

(function () {
  'use strict';

  // ─── 1. Mobile Menu Toggle ──────────────────────────────────────────
  function initMobileMenu() {
    var btn = document.querySelector('.mobile-menu-btn');
    var nav = document.querySelector('.mobile-nav');
    if (!btn || !nav) return;

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = nav.classList.toggle('active');
      btn.classList.toggle('active', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close when clicking a nav link
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('active');
        btn.classList.remove('active');
        document.body.style.overflow = '';
      });
    });

    // Close when clicking outside
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('active') && !nav.contains(e.target) && !btn.contains(e.target)) {
        nav.classList.remove('active');
        btn.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // ─── 2. Scroll Reveal Animations ───────────────────────────────────
  function initScrollReveal() {
    var elements = document.querySelectorAll('.reveal');
    if (!elements.length) return;

    if (!('IntersectionObserver' in window)) {
      elements.forEach(function (el) { el.classList.add('revealed'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;

        // Stagger children delays via CSS variable
        var children = el.querySelectorAll(':scope > *');
        children.forEach(function (child, i) {
          child.style.setProperty('--delay', i * 80 + 'ms');
        });

        el.classList.add('revealed');
        observer.unobserve(el);
      });
    }, { threshold: 0.1 });

    elements.forEach(function (el) { observer.observe(el); });
  }

  // ─── 3. Navbar Scroll Effect ────────────────────────────────────────
  function initNavbarScroll() {
    var navbar = document.querySelector('.navbar');
    if (!navbar) return;

    var onScroll = function () {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ─── 4. Search Functionality ────────────────────────────────────────
  function initSearch() {
    var form = document.querySelector('.search-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        var input = form.querySelector('input[type="search"], input[name="q"]');
        if (input && !input.value.trim()) {
          e.preventDefault();
          input.focus();
        }
      });
    }

    // Auto-focus search input on search page
    var searchPageInput = document.querySelector('.search-page-input');
    if (searchPageInput) searchPageInput.focus();
  }

  // ─── 5. Lazy Loading Images ─────────────────────────────────────────
  function initLazyImages() {
    var images = document.querySelectorAll('img[data-src]');
    if (!images.length) return;

    var loadImage = function (img) {
      img.src = img.getAttribute('data-src');
      img.removeAttribute('data-src');
      img.addEventListener('load', function () { img.classList.add('loaded'); });
      img.addEventListener('error', function () { img.classList.add('loaded'); });
    };

    if (!('IntersectionObserver' in window)) {
      images.forEach(loadImage);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          loadImage(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '100px' });

    images.forEach(function (img) { observer.observe(img); });
  }

  // ─── 6. Shorts Video Modal ─────────────────────────────────────────
  function initShortsModal() {
    var cards = document.querySelectorAll('.short-card');
    if (!cards.length) return;

    var modal = null;

    var createModal = function () {
      var overlay = document.createElement('div');
      overlay.className = 'shorts-modal';
      overlay.innerHTML =
        '<div class="shorts-modal__backdrop"></div>' +
        '<div class="shorts-modal__content">' +
          '<button class="shorts-modal__close" aria-label="Close">&times;</button>' +
          '<iframe class="shorts-modal__player" frameborder="0" allowfullscreen ' +
            'allow="autoplay; encrypted-media"></iframe>' +
        '</div>';

      overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;';
      overlay.querySelector('.shorts-modal__backdrop').style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,.85);';
      overlay.querySelector('.shorts-modal__content').style.cssText = 'position:relative;width:100%;max-width:400px;aspect-ratio:9/16;z-index:1;';
      overlay.querySelector('.shorts-modal__close').style.cssText = 'position:absolute;top:-40px;right:0;background:none;border:none;color:#fff;font-size:28px;cursor:pointer;padding:4px 8px;';
      overlay.querySelector('.shorts-modal__player').style.cssText = 'width:100%;height:100%;border-radius:12px;';

      document.body.appendChild(overlay);
      return overlay;
    };

    var openModal = function (videoId) {
      if (!modal) modal = createModal();
      var iframe = modal.querySelector('.shorts-modal__player');
      iframe.src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1&rel=0';
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    };

    var closeModal = function () {
      if (!modal) return;
      modal.querySelector('.shorts-modal__player').src = '';
      modal.style.display = 'none';
      document.body.style.overflow = '';
    };

    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        var videoId = card.getAttribute('data-video-id') || card.getAttribute('data-id');
        if (videoId) openModal(videoId);
      });
    });

    document.addEventListener('click', function (e) {
      if (e.target.classList.contains('shorts-modal__backdrop') || e.target.classList.contains('shorts-modal__close')) {
        closeModal();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  // ─── 7. Flight Tracker Enhancements ────────────────────────────────
  function initFlightTracker() {
    var form = document.querySelector('.flight-tracker-form');
    if (!form) return;

    // Default date picker to today
    var dateInput = form.querySelector('input[type="date"]');
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }

    form.addEventListener('submit', function (e) {
      var flightInput = form.querySelector('input[name="flight_number"], input[name="flight"]');
      if (flightInput && !flightInput.value.trim()) {
        e.preventDefault();
        flightInput.focus();
        return;
      }

      // Loading state
      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.setAttribute('data-original-text', submitBtn.textContent);
        submitBtn.innerHTML = '<span class="spinner"></span> Searching...';
      }
    });

    // Animate progress bar on load
    var progressBar = document.querySelector('.flight-progress-fill');
    if (progressBar) {
      var target = progressBar.getAttribute('data-progress') || '0';
      requestAnimationFrame(function () {
        progressBar.style.width = target + '%';
      });
    }
  }

  // ─── 8. Back to Top Button ─────────────────────────────────────────
  function initBackToTop() {
    var btn = document.querySelector('.back-to-top');
    if (!btn) return;

    var toggleVisibility = function () {
      btn.classList.toggle('visible', window.scrollY > 500);
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    toggleVisibility();

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ─── 9. Smooth Scroll for Anchor Links ─────────────────────────────
  function initSmoothScroll() {
    var NAVBAR_OFFSET = 64;

    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;

      var targetId = link.getAttribute('href');
      if (targetId === '#') return;

      var target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - NAVBAR_OFFSET;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  }

  // ─── 10. Copy Article URL ──────────────────────────────────────────
  function initShareButton() {
    var btn = document.querySelector('.share-btn');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var url = window.location.href;

      var showTooltip = function () {
        var tip = document.createElement('span');
        tip.textContent = 'Copied!';
        tip.style.cssText = 'position:absolute;top:-32px;left:50%;transform:translateX(-50%);' +
          'background:#10b981;color:#fff;padding:4px 10px;border-radius:6px;font-size:13px;' +
          'white-space:nowrap;pointer-events:none;';
        btn.style.position = 'relative';
        btn.appendChild(tip);
        setTimeout(function () { tip.remove(); }, 1500);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(showTooltip);
      } else {
        var input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        input.remove();
        showTooltip();
      }
    });
  }

  // ─── 11. Dark/Light Mode Toggle ────────────────────────────────────
  function initThemeToggle() {
    var STORAGE_KEY = 'aviation_theme';
    var btn = document.querySelector('.theme-toggle');
    if (!btn) return;

    var savedTheme = localStorage.getItem(STORAGE_KEY);
    if (savedTheme === 'light') {
      document.body.classList.add('light-mode');
    }

    var updateIcon = function () {
      var isLight = document.body.classList.contains('light-mode');
      btn.innerHTML = isLight ? '&#9790;' : '&#9728;';
      btn.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
    };

    updateIcon();

    btn.addEventListener('click', function () {
      document.body.classList.toggle('light-mode');
      var isLight = document.body.classList.contains('light-mode');
      localStorage.setItem(STORAGE_KEY, isLight ? 'light' : 'dark');
      updateIcon();
    });
  }

  // ─── 12. Newsletter Form ───────────────────────────────────────────
  function initNewsletter() {
    var form = document.querySelector('.newsletter-form');
    if (!form) return;

    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var submitting = false;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (submitting) return;

      var input = form.querySelector('input[type="email"]');
      if (!input || !emailRegex.test(input.value.trim())) {
        if (input) input.focus();
        return;
      }

      submitting = true;
      var btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;

      var msg = document.createElement('p');
      msg.textContent = 'Thanks for subscribing!';
      msg.style.cssText = 'color:#10b981;margin-top:8px;font-size:14px;';
      form.appendChild(msg);
      input.value = '';

      setTimeout(function () {
        msg.remove();
        submitting = false;
        if (btn) btn.disabled = false;
      }, 3000);
    });
  }

  // ─── 13. Skeleton Loading Helpers ──────────────────────────────────
  window.SkeletonLoader = {
    show: function (container) {
      if (typeof container === 'string') container = document.querySelector(container);
      if (!container) return;
      container.classList.add('skeleton-loading');
    },
    hide: function (container) {
      if (typeof container === 'string') container = document.querySelector(container);
      if (!container) return;
      container.classList.remove('skeleton-loading');
    }
  };

  // ─── Initialize Everything on DOM Ready ────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
    initScrollReveal();
    initNavbarScroll();
    initSearch();
    initLazyImages();
    initShortsModal();
    initFlightTracker();
    initBackToTop();
    initSmoothScroll();
    initShareButton();
    initThemeToggle();
    initNewsletter();
  });

})();
