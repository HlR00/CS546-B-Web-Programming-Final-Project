(function () {
  'use strict';

  document.querySelectorAll('.holiday-card-img').forEach(function (img) {
    img.addEventListener('error', function () {
      this.style.display = 'none';
      const grad = this.dataset.grad;
      if (grad) {
        this.parentElement.classList.add(grad);
        const overlay = this.parentElement.querySelector('.holiday-card-overlay');
        if (overlay) overlay.classList.add(grad);
      }
    });
  });
})();
