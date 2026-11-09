(function () {
  'use strict';

  var MEASUREMENT_ID = 'G-X0RVS4D5VV';
  var STORAGE_KEY = 'audiobook-analytics-choice';

  function readChoice() {
    try {
      var value = localStorage.getItem(STORAGE_KEY);
      if (value === 'accepted' || value === 'declined') return value;
    } catch (error) {
      return null;
    }
    return null;
  }

  function storeChoice(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
      return true;
    } catch (error) {
      return false;
    }
  }

  function loadAnalytics() {
    if (window.__audioGaLoaded) return;
    window.__audioGaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', MEASUREMENT_ID);
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
    document.head.appendChild(script);
  }

  function banner() {
    return document.getElementById('analytics-banner');
  }

  function showBanner() {
    var element = banner();
    if (element) element.hidden = false;
  }

  function hideBanner() {
    var element = banner();
    if (element) element.hidden = true;
  }

  function updateStatus() {
    var status = document.getElementById('analytics-choice-status');
    if (!status) return;
    var choice = readChoice();
    if (choice === 'accepted') {
      status.textContent = 'Saved in this browser: analytics accepted. Google Analytics can load on these pages.';
    } else if (choice === 'declined') {
      status.textContent = 'Saved in this browser: analytics declined. The Google Analytics tag is not added by this site.';
    } else {
      status.textContent = 'No analytics choice is saved in this browser yet.';
    }
  }

  function applyChoice(choice) {
    var saved = storeChoice(choice);
    if (choice === 'accepted') loadAnalytics();
    hideBanner();
    updateStatus();
    var note = document.getElementById('analytics-save-note');
    if (!note) return;
    note.textContent = saved
      ? 'That choice is stored in localStorage for this browser only.'
      : 'This browser blocked localStorage, so the choice lasts for this page view only.';
  }

  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.closest) return;
    var button = target.closest('[data-analytics-choice]');
    if (!button) return;
    var choice = button.getAttribute('data-analytics-choice');
    if (choice !== 'accepted' && choice !== 'declined') return;
    event.preventDefault();
    applyChoice(choice);
  });

  var existing = readChoice();
  if (existing === 'accepted') {
    loadAnalytics();
    hideBanner();
  } else if (existing === 'declined') {
    hideBanner();
  } else {
    showBanner();
  }
  updateStatus();
})();
