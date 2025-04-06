// Fade-in animations for images and cards
gsap.from('.hero-image img', { opacity: 0, duration: 1, delay: 0.5 });
gsap.from('.product-card', { opacity: 0, y: 50, duration: 1, stagger: 0.2 });
gsap.from('.nutritious-bowl img', { opacity: 0, duration: 1, delay: 0.5 });
gsap.from('.offer-card', { opacity: 0, y: 50, duration: 1, stagger: 0.2 });
gsap.from('.review-card', { opacity: 0, y: 50, duration: 1, stagger: 0.2 });

// Bounce animation for heart-eyed characters
gsap.to('.heart-eyed', { y: -10, duration: 0.5, repeat: -1, yoyo: true });

// Hover effects for buttons
const buttons = document.querySelectorAll('button');
buttons.forEach(button => {
    button.addEventListener('mouseenter', () => {
        gsap.to(button, { scale: 1.1, duration: 0.2 });
    });
    button.addEventListener('mouseleave', () => {
        gsap.to(button, { scale: 1, duration: 0.2 });
    });
});