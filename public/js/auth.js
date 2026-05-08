(function () {
  'use strict';

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  function showError(formEl, message) {
    const card = formEl.closest('.auth-card');
    let errorDiv = card ? card.querySelector('.auth-error') : null;
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'auth-error';
      errorDiv.setAttribute('role', 'alert');
      errorDiv.innerHTML =
        '<span class="auth-error-icon" aria-hidden="true">!</span><span></span>';
      formEl.insertAdjacentElement('beforebegin', errorDiv);
    }
    const textSpan = errorDiv.querySelector('span:last-child');
    if (textSpan) textSpan.textContent = message;
    errorDiv.removeAttribute('hidden');
  }

  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', function (e) {
      const firstName = registerForm.querySelector('[name="firstName"]').value;
      const lastName  = registerForm.querySelector('[name="lastName"]').value;
      const email     = registerForm.querySelector('[name="email"]').value;
      const password  = registerForm.querySelector('[name="password"]').value;

      if (!firstName || firstName.trim() === '') {
        e.preventDefault();
        showError(registerForm, 'First name is required.');
        return;
      }
      if (!lastName || lastName.trim() === '') {
        e.preventDefault();
        showError(registerForm, 'Last name is required.');
        return;
      }
      if (!email || !isValidEmail(email)) {
        e.preventDefault();
        showError(registerForm, 'Please enter a valid email address.');
        return;
      }
      if (!password || password.length < 8) {
        e.preventDefault();
        showError(registerForm, 'Password must be at least 8 characters.');
      }
    });
  }

  const toggleBtn = document.getElementById('togglePassword');
  const pwInput   = document.getElementById('login-password');
  if (toggleBtn && pwInput) {
    toggleBtn.addEventListener('click', function () {
      const isPassword = pwInput.type === 'password';
      pwInput.type = isPassword ? 'text' : 'password';
      this.textContent = isPassword ? '🙈' : '👁️';
    });
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      const email    = loginForm.querySelector('[name="email"]').value;
      const password = loginForm.querySelector('[name="password"]').value;

      if (!email || !isValidEmail(email)) {
        e.preventDefault();
        showError(loginForm, 'Please enter a valid email address.');
        return;
      }
      if (!password || password.trim() === '') {
        e.preventDefault();
        showError(loginForm, 'Password is required.');
      }
    });
  }
})();
