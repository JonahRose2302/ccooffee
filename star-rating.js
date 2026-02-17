// Star Rating System - Add this to app.js

// Initialize star rating for coffee shops
function initStarRating() {
    const modal = document.getElementById('shop-modal');
    if (!modal) return;

    // Find the rating input
    const ratingInput = modal.querySelector('input[type="range"]');
    if (!ratingInput) return;

    // Create star rating container
    const starContainer = document.createElement('div');
    starContainer.className = 'star-rating';
    starContainer.innerHTML = '★★★★★'.split('').map((star, index) =>
        `<span class="star" data-rating="${index + 1}">★</span>`
    ).join('');

    // Insert after label or replace input
    ratingInput.style.display = 'none';
    ratingInput.parentElement.appendChild(starContainer);

    // Add click handlers
    const stars = starContainer.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', function () {
            const rating = parseInt(this.dataset.rating);
            ratingInput.value = rating;

            // Update visual state
            stars.forEach((s, idx) => {
                if (idx < rating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });

        // Hover preview
        star.addEventListener('mouseenter', function () {
            const rating = parseInt(this.dataset.rating);
            stars.forEach((s, idx) => {
                if (idx < rating) {
                    s.style.color = 'var(--color-gold-bright)';
                }
            });
        });
    });

    starContainer.addEventListener('mouseleave', function () {
        const currentRating = parseInt(ratingInput.value) || 0;
        stars.forEach((s, idx) => {
            if (idx < currentRating) {
                s.style.color = 'var(--color-gold-bright)';
            } else {
                s.style.color = 'rgba(244, 196, 48, 0.2)';
            }
        });
    });
}

// Call this when opening the shop modal
// Add to the existing openAddShop or similar function
