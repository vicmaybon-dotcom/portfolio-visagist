document.addEventListener('DOMContentLoaded', () => {

    /* ================================== */
    /* 1. Код для карусели на первом экране */
    /* ================================== */
    const slides = document.querySelectorAll('.carousel-slide');
    let currentSlide = 0;

    function showSlide(n) {
        slides.forEach(slide => slide.classList.remove('active'));
        if (slides[n]) {
            slides[n].classList.add('active');
        }
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
    /* 2. Код для мобильного меню (бургер) */
    /* ================================== */
    // Мы ищем бургеры и меню в обоих хедерах
    const mainHeaderNavToggle = document.querySelector('#header .nav-toggle');
    const mainHeaderNav = document.querySelector('#header nav');

    const stickyHeaderNavToggle = document.querySelector('#sticky-header .nav-toggle');
    const stickyHeaderNav = document.querySelector('#sticky-header nav');

    // Функция для переключения меню
    function setupNavToggle(toggleButton, navMenu) {
        if (toggleButton && navMenu) {
            toggleButton.addEventListener('click', () => {
                navMenu.classList.toggle('is-open');
            });

            document.addEventListener('click', (event) => {
                const isClickInsideNav = navMenu.contains(event.target);
                const isClickOnToggle = toggleButton.contains(event.target);

                if (!isClickInsideNav && !isClickOnToggle && navMenu.classList.contains('is-open')) {
                    navMenu.classList.remove('is-open');
                }
            });
        }
    }

    // Применяем функцию для обоих меню
    setupNavToggle(mainHeaderNavToggle, mainHeaderNav);
    setupNavToggle(stickyHeaderNavToggle, stickyHeaderNav);

    /* ================================== */
    /* 3. Код для слайдера услуг */
    /* ================================== */
    const servicesSlider = document.querySelector('.services-list');
    const servicesPrevArrow = document.querySelector('.prev-arrow');
    const servicesNextArrow = document.querySelector('.next-arrow');
    const dotsContainer = document.querySelector('.slider-dots');
    const serviceCards = document.querySelectorAll('.service-card');

    let servicesCurrentIndex = 0;
    const servicesTotalCards = serviceCards.length;

    if (servicesSlider && dotsContainer && serviceCards.length > 0) {
        // Создаем точки навигации
        for (let i = 0; i < servicesTotalCards; i++) {
            const dot = document.createElement('div');
            dot.classList.add('slider-dot');
            if (i === 0) dot.classList.add('active');
            dotsContainer.appendChild(dot);
            dot.addEventListener('click', () => {
                goToServiceSlide(i);
            });
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
            servicesPrevArrow.addEventListener('click', () => {
                goToServiceSlide(servicesCurrentIndex - 1);
            });
        }

        if (servicesNextArrow) {
            servicesNextArrow.addEventListener('click', () => {
                goToServiceSlide(servicesCurrentIndex + 1);
            });
        }
    }

    /* ================================== */
    /* 4. Код для прилипающего хедера */
    /* ================================== */
    const heroSection = document.getElementById('hero');
    const stickyHeader = document.getElementById('sticky-header');

    if (heroSection && stickyHeader) {
        const scrollPoint = heroSection.offsetHeight;

        window.addEventListener('scroll', () => {
            if (window.pageYOffset >= scrollPoint) {
                stickyHeader.classList.add('visible');
            } else {
                stickyHeader.classList.remove('visible');
            }
        });
    } else {
        console.error('Не найдены элементы для прилипающего хедера: #hero или #sticky-header.');
    }
});