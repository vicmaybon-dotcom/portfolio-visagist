document.addEventListener('DOMContentLoaded', () => {

    /* ================================== */
    /* 1. Липкий хедер с исчезновением при обратном скролле */
    /* ================================== */
    const stickyHeader = document.querySelector('#sticky-header');
    if (stickyHeader) {
        const triggerId = stickyHeader.dataset.trigger || document.getElementById('portfolio-container')?.dataset.trigger;
        const triggerElem = document.getElementById(triggerId);

        if (triggerElem) {
            const triggerPosition = triggerElem.dataset.triggerPosition || 'top';
            const headerHeight = document.getElementById('header')?.offsetHeight || 0;

            // Точка появления
            const startPoint = 
                triggerPosition === 'bottom'
                    ? triggerElem.offsetTop + triggerElem.offsetHeight - headerHeight
                    : triggerElem.offsetTop - headerHeight;

            // Точка исчезновения (низ секции)
            const endPoint = triggerElem.offsetTop + triggerElem.offsetHeight - headerHeight;

            window.addEventListener('scroll', () => {
                const scrollY = window.scrollY;

                if (scrollY >= startPoint) {
                    stickyHeader.classList.add('visible');
                } else {
                    stickyHeader.classList.remove('visible');
                }
                
            });
        }
    }

    /* ================================== */
    /* 2. Мобильное меню (бургер) */
    /* ================================== */
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

    // Для липкого хедера
    setupNavToggle(
        document.querySelector('#sticky-header .nav-toggle'),
        document.querySelector('#sticky-header nav')
    );

    // Для основного хедера
    setupNavToggle(
        document.querySelector('#header .nav-toggle'),
        document.querySelector('#header nav')
    );

    /* ================================== */
    /* 3. Подсветка активной ссылки */
    /* ================================== */
    const navLinks = document.querySelectorAll('#sticky-header nav a, #header nav a');
    const currentPath = window.location.pathname.split('/').pop();

    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath === currentPath || (linkPath === 'index.html' && currentPath === '')) {
            link.classList.add('active-link');
        }
    });

});
