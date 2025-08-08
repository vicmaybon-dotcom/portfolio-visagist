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
	
	// Код для слайдера услуг
    const slider = document.querySelector('.services-list');
    const prevArrow = document.querySelector('.prev-arrow');
    const nextArrow = document.querySelector('.next-arrow');
    const dotsContainer = document.querySelector('.slider-dots');
    const cards = document.querySelectorAll('.service-card');

    let currentIndex = 0;
    const totalCards = cards.length;

    // Создаем точки навигации
    for (let i = 0; i < totalCards; i++) {
        const dot = document.createElement('div');
        dot.classList.add('slider-dot');
        if (i === 0) dot.classList.add('active');
        dotsContainer.appendChild(dot);
        dot.addEventListener('click', () => {
            goToSlide(i);
        });
    }

    const dots = document.querySelectorAll('.slider-dot');

    function updateDots() {
        dots.forEach(dot => dot.classList.remove('active'));
        dots[currentIndex].classList.add('active');
    }

    function goToSlide(index) {
        if (index < 0) {
            currentIndex = totalCards - 1;
        } else if (index >= totalCards) {
            currentIndex = 0;
        } else {
            currentIndex = index;
        }
        const offset = -currentIndex * 100;
        slider.style.transform = `translateX(${offset}%)`;
        updateDots();
    }

    prevArrow.addEventListener('click', () => {
        goToSlide(currentIndex - 1);
    });

    nextArrow.addEventListener('click', () => {
        goToSlide(currentIndex + 1);
    });
});