document.addEventListener('DOMContentLoaded', () => {

    /* ================================== */
    /* 1. Универсальный липкий хедер */
    /* ================================== */
    const stickyHeader = document.querySelector('#sticky-header');
    if (stickyHeader) {
        const triggerId = stickyHeader.dataset.trigger;
        const triggerElem = document.getElementById(triggerId);

        let scrollPoint = 0; // по умолчанию липкий сразу в начале

        if (triggerElem) {
            if (stickyHeader.dataset.triggerPosition === 'bottom') {
                scrollPoint = triggerElem.offsetTop + triggerElem.offsetHeight;
            } else {
                scrollPoint = triggerElem.offsetTop;
            }
        }

        window.addEventListener('scroll', () => {
            if (window.scrollY >= scrollPoint) {
                stickyHeader.classList.add('visible');
            } else {
                stickyHeader.classList.remove('visible');
            }
        });
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

    // Для основного хедера (если есть)
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
