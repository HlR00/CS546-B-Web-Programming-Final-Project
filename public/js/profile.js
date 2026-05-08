(function () {
  'use strict';

  function showFormError(form, message) {
    let err = form.querySelector('.profile-form-error');
    if (!err) {
      err = document.createElement('p');
      err.className = 'profile-form-error';
      err.setAttribute('role', 'alert');
      err.style.cssText = 'color:#c0392b;font-size:.8125rem;margin:.25rem 0 0;';
      form.appendChild(err);
    }
    err.textContent = message;
  }

  function attachValidation(formId, fieldName, label, maxLen) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('submit', function (e) {
      const input = form.querySelector('[name="' + fieldName + '"]');
      if (!input) return;
      const val = input.value.trim();
      if (!val) {
        e.preventDefault();
        showFormError(form, label + ' cannot be empty.');
        input.focus();
        return;
      }
      if (maxLen && val.length > maxLen) {
        e.preventDefault();
        showFormError(form, label + ' must be ' + maxLen + ' characters or fewer.');
        input.focus();
      }
    });
  }

  attachValidation('culture-add-form', 'culture', 'Culture name', 100);
  attachValidation('mustbuy-add-form', 'item', 'Item name', 200);
})();
