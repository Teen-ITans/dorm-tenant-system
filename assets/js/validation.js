/**
 * assets/js/validation.js
 * Client-side validation only. The server re-validates everything —
 * never trust the browser alone for data that ends up in the database.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const isLoginPage = loginForm !== null;

    // ---- Bootstrap's standard "needs-validation" pattern ---------------
    document.querySelectorAll('.needs-validation').forEach(function (form) {
      form.addEventListener('submit', function (event) {
        const isValid = form.checkValidity();
        if (!isValid) {
          event.preventDefault();
          event.stopPropagation();
        }
        if (!isLoginPage || form !== loginForm || !isValid) {
          form.classList.add('was-validated');
        }
      }, false);
    });

    // ---- Philippine mobile numbers: always "+63 " + up to 10 digits --
    // Applies to every phone-like field app-wide (see the selector
    // below) — register, admin's add-user and edit-tenant forms,
    // emergency contact, all of it — so the +63 behaves the same
    // everywhere instead of each page rolling its own.
    function phDigits(value) {
      let digits = String(value == null ? '' : value).replace(/\D+/g, '');
      // Whatever the person typed — with a leading 0 (09XX...), with
      // 63 already on it, or just the bare 9XX... — normalize down to
      // the 10-digit national number and let phFormat put +63 back on.
      if (digits.indexOf('63') === 0) {
        digits = digits.slice(2);
      } else if (digits.charAt(0) === '0') {
        digits = digits.slice(1);
      }
      return digits.slice(0, 10);
    }

    function phFormat(digits) {
      // An untouched/empty field stays truly empty — no stray "+63"
      // saved for an optional field nobody filled in — but the moment
      // there's at least one digit, +63 is forced back on and stays.
      return digits === '' ? '' : '+63 ' + digits;
    }

    function phValidity(input, digits) {
      if (digits === '') {
        input.setCustomValidity(input.required ? 'Please enter a contact number.' : '');
      } else if (digits.charAt(0) !== '9') {
        input.setCustomValidity('A Philippine mobile number starts with 9, e.g. +63 9171234567.');
      } else if (digits.length < 10) {
        input.setCustomValidity('Enter all 10 digits, e.g. +63 9171234567.');
      } else {
        input.setCustomValidity('');
      }
    }

    /** Re-render the field from its digits, keeping the caret in place. */
    function phRender(input, keepCaret) {
      const raw = input.value;
      const digits = phDigits(raw);
      const formatted = phFormat(digits);
      const prefixLen = 4; // "+63 "

      if (keepCaret) {
        const at = input.selectionStart === null ? raw.length : input.selectionStart;
        const before = phDigits(raw.slice(0, at)).length;
        if (formatted !== raw) {
          input.value = formatted;
        }
        const caret = before === 0 ? formatted.length : Math.min(prefixLen + before, formatted.length);
        try { input.setSelectionRange(caret, caret); } catch (e) { /* not a text input */ }
      } else if (formatted !== raw) {
        input.value = formatted;
      }

      phValidity(input, digits);
    }

    function phSetup(input) {
      if (input.dataset.phMaskReady) {
        return;
      }
      input.dataset.phMaskReady = '1';
      input.setAttribute('inputmode', 'tel');
      input.setAttribute('autocomplete', 'tel');
      input.setAttribute('maxlength', '14'); // "+63 " + 10 digits
      if (!input.getAttribute('placeholder')) {
        input.setAttribute('placeholder', '+63 9XXXXXXXXX');
      }

      phRender(input, false);

      input.addEventListener('input', function () { phRender(input, true); });
      input.addEventListener('blur', function () { phRender(input, false); });
    }

    // Anything explicitly marked, plus any phone/contact-number field —
    // so a form added later is covered without having to remember this.
    document.querySelectorAll(
      'input[data-ph-mobile], input[type="tel"], input[name*="phone"], input[name*="contact_number"], input[name*="contact_no"]'
    ).forEach(function (input) {
      if (input.tagName === 'INPUT' && !input.disabled && !input.readOnly) {
        phSetup(input);
      }
    });

    // Fields inside a modal are filled in from a button's data-* just
    // before it opens, which writes straight past the mask.
    document.addEventListener('shown.bs.modal', function (e) {
      e.target.querySelectorAll('input[data-ph-mobile]').forEach(function (input) {
        phSetup(input);
        phRender(input, false);
      });
    });

    // ---- Password confirmation must match, everywhere both fields exist
    const pw = document.getElementById('regPassword') || document.getElementById('userPassword') || document.getElementById('password');
    const confirm = document.getElementById('regConfirmPassword') || document.getElementById('userConfirmPassword') || document.getElementById('confirm_password');
    if (pw && confirm) {
      const checkMatch = function () {
        confirm.setCustomValidity(confirm.value !== pw.value ? 'Passwords do not match.' : '');
      };
      pw.addEventListener('input', checkMatch);
      confirm.addEventListener('input', checkMatch);
    }
  });
})();
