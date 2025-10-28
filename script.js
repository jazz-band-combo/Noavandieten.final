/* ===== NAV + DROPDOWNS + SMOOTH SCROLL (matches your HTML) ===== */
'use strict';

/* ---------- helpers ---------- */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- refs ---------- */
const siteNav = $('#siteNav');        // <header id="siteNav">
const heroImg = $('#home');           // element with id="home" (hero)
let   heroReleaseAt = Infinity;       // y-position where nav releases

/* ---------- sizes / offsets ---------- */
function navHeight() {
  return siteNav ? siteNav.offsetHeight : 0;
}
function currentOffset() {
  return document.body.classList.contains('released') ? 0 : navHeight();
}

/* ---------- smooth scroll (linear) ---------- */
function smoothScrollToLinear(targetY, duration = 1700) {
  const startY   = window.scrollY || window.pageYOffset;
  const distance = targetY - startY;
  const t0       = performance.now();

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || duration <= 0) {
    window.scrollTo({ top: targetY, behavior: 'auto' });
    return;
  }

  function step(t) {
    const p = Math.min((t - t0) / duration, 1); // linear 0→1
    window.scrollTo({ top: startY + distance * p, left: 0 });
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ---------- anchor clicks with correct offset ---------- */
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-scroll]');
  if (!a) return;

  const href = a.getAttribute('href');
  if (!href || !href.startsWith('#')) return;

  const target = document.querySelector(href);
  if (!target) return;

  e.preventDefault();

  const rect = target.getBoundingClientRect();
  const y    = rect.top + window.pageYOffset - currentOffset() + 1;
  smoothScrollToLinear(y, 700);

  // Close any open dropdown after navigating
  closeAllDropdowns();
});

/* ---------- dropdown logic (click to toggle) ---------- */
function getDropdownParts(btn) {
  const container = btn.closest('.dropdown');
  if (!container) return {};
  const menuId = btn.getAttribute('aria-controls');
  // Prefer aria-controls, else use the first .dropdown__menu inside the container
  const menu   = menuId ? document.getElementById(menuId) : container.querySelector('.dropdown__menu');
  return { container, menu };
}

function openDropdown(btn) {
  const { container, menu } = getDropdownParts(btn);
  if (!container || !menu) return;
  closeAllDropdowns(container);
  container.classList.add('open');
  btn.setAttribute('aria-expanded', 'true');
}

function closeDropdown(container) {
  if (!container) return;
  container.classList.remove('open');
  const btn = container.querySelector('.dropdown__toggle');
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

function closeAllDropdowns(except = null) {
  $$('.dropdown.open').forEach(d => { if (d !== except) closeDropdown(d); });
}

/* Toggle on button click (.dropdown__toggle in your HTML) */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.dropdown__toggle');
  if (!btn) return;
  e.stopPropagation();
  const container = btn.closest('.dropdown');
  if (!container) return;
  container.classList.contains('open') ? closeDropdown(container) : openDropdown(btn);
});

/* Close when clicking outside */
document.addEventListener('click', (e) => {
  if (!e.target.closest('.dropdown')) closeAllDropdowns();
});

/* Close on ESC */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeAllDropdowns();
});

/* ---------- nav release logic ---------- */
function computeHeroRelease() {
  if (!heroImg) { heroReleaseAt = Infinity; return; }
  const rect = heroImg.getBoundingClientRect();
  const top  = window.pageYOffset + rect.top;
  heroReleaseAt = top + heroImg.offsetHeight - 1;
}

function shouldReleaseNav() {
  const y = window.scrollY || window.pageYOffset;
  return y >= heroReleaseAt;
}

function applyReleasedState(isReleased) {
  document.body.classList.toggle('released', isReleased);
  if (siteNav) siteNav.classList.toggle('nav--off', isReleased);
  document.documentElement.style.scrollPaddingTop = isReleased ? '0px' : `${navHeight()}px`;
}

/* ---------- scroll handler (rAF-throttled) ---------- */
let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    applyReleasedState(shouldReleaseNav());
    ticking = false;
  });
}

/* ---------- init ---------- */
function init() {
  // prevent CSS smooth-scroll from fighting this script
  document.documentElement.style.scrollBehavior = 'auto';

  computeHeroRelease();
  onScroll();

  if (heroImg && heroImg.tagName === 'IMG' && !heroImg.complete) {
    heroImg.addEventListener('load', () => { computeHeroRelease(); onScroll(); }, { once: true });
  }
}

/* ---------- listeners ---------- */
window.addEventListener('DOMContentLoaded', init);
window.addEventListener('resize', () => { computeHeroRelease(); onScroll(); });
window.addEventListener('scroll', onScroll, { passive: true });