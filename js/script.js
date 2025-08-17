document.addEventListener('DOMContentLoaded', () => {

    /* ================================== */
    /* 1. Карусель на первом экране index.html */
    /* ================================== */
    const slides = document.querySelectorAll('.carousel-slide');
    let currentSlide = 0;

    function showSlide(n) {
        slides.forEach(slide => slide.classList.remove('active'));
        if (slides[n]) slides[n].classList.add('active');
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }

    if (slides.length > 0) {
        showSlide(currentSlide);
        setInterval(nextSlide, 5000);
    }

    /* ================================== */
    /* 3. Карусель на первом экране Services.html */
    /* ================================== */
    const servicesSlider = document.querySelector('.services-list');
    const servicesPrevArrow = document.querySelector('.prev-arrow');
    const servicesNextArrow = document.querySelector('.next-arrow');
    const dotsContainer = document.querySelector('.slider-dots');
    const serviceCards = document.querySelectorAll('.service-card');

    let servicesCurrentIndex = 0;
    const servicesTotalCards = serviceCards.length;

    if (servicesSlider && dotsContainer && serviceCards.length > 0) {
        // точки навигации
        for (let i = 0; i < servicesTotalCards; i++) {
            const dot = document.createElement('div');
            dot.classList.add('slider-dot');
            if (i === 0) dot.classList.add('active');
            dotsContainer.appendChild(dot);
            dot.addEventListener('click', () => goToServiceSlide(i));
        }

        const dots = document.querySelectorAll('.slider-dot');

        function updateServiceDots() {
            dots.forEach(dot => dot.classList.remove('active'));
            if (dots[servicesCurrentIndex]) {
                dots[servicesCurrentIndex].classList.add('active');
            }
        }

        function goToServiceSlide(index) {
            if (index < 0) {
                servicesCurrentIndex = servicesTotalCards - 1;
            } else if (index >= servicesTotalCards) {
                servicesCurrentIndex = 0;
            } else {
                servicesCurrentIndex = index;
            }
            const offset = -servicesCurrentIndex * 100;
            servicesSlider.style.transform = `translateX(${offset}%)`;
            updateServiceDots();
        }

        if (servicesPrevArrow) {
            servicesPrevArrow.addEventListener('click', () => goToServiceSlide(servicesCurrentIndex - 1));
        }

        if (servicesNextArrow) {
            servicesNextArrow.addEventListener('click', () => goToServiceSlide(servicesCurrentIndex + 1));
        }
    }

 


});