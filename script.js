document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.carousel-slide');
    let currentSlide = 0;

    function showSlide(n) {
        slides.forEach(slide => slide.classList.remove('active'));
        slides[n].classList.add('active');
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }

    // Показываем первый слайд при загрузке
    showSlide(currentSlide);

    // Автоматическая смена слайдов каждые 5 секунд
    setInterval(nextSlide, 5000);
	
	// Код для мобильного меню
    const navToggle = document.querySelector('.nav-toggle');
    const mainNav = document.querySelector('header nav');

    if (navToggle && mainNav) {
        navToggle.addEventListener('click', () => {
            mainNav.classList.toggle('is-open');
        });
    }
});