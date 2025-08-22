document.addEventListener('DOMContentLoaded', () => {

   

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

    

    // Для основного хедера
    setupNavToggle(
        document.querySelector('#header .nav-toggle'),
        document.querySelector('#header nav')
    );

    

});
