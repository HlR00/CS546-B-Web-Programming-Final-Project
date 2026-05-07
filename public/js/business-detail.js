/* public/js/business-detail.js — AJAX stock reporting */
(function () {
  'use strict';

  document.querySelectorAll('.biz-stock-btns').forEach(function (container) {
    const businessId = container.dataset.businessId;
    const productId  = container.dataset.productId;
    const card       = container.closest('.biz-product-card');
    const badge      = card ? card.querySelector('.biz-stock-badge') : null;

    container.querySelectorAll('.biz-stock-btn').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        const inStock = btn.dataset.value === 'true';

        // Disable buttons while submitting
        container.querySelectorAll('.biz-stock-btn').forEach(function (b) {
          b.disabled = true;
        });

        try {
          const res = await fetch(
            `/api/businesses/${businessId}/products/${productId}/stock`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ inStock }),
            }
          );

          if (!res.ok) throw new Error('Server error');

          // Update badge text & style without page reload
          if (badge) {
            badge.className = 'biz-stock-badge ' +
              (inStock ? 'biz-stock-badge--in' : 'biz-stock-badge--out');
            badge.textContent = inStock ? '\u25CF In Stock' : '\u25CF Out of Stock';
          }

          // Visually highlight which button was chosen
          container.querySelectorAll('.biz-stock-btn').forEach(function (b) {
            b.classList.remove('biz-stock-btn--saved-in', 'biz-stock-btn--saved-out');
          });
          btn.classList.add(inStock ? 'biz-stock-btn--saved-in' : 'biz-stock-btn--saved-out');

        } catch (err) {
          alert('Could not save stock report. Please try again.');
        } finally {
          container.querySelectorAll('.biz-stock-btn').forEach(function (b) {
            b.disabled = false;
          });
        }
      });
    });
  });
})();
