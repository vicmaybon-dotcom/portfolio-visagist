document.addEventListener("DOMContentLoaded", () => {
    // ... ваш существующий код ...
  
    const headers = document.querySelectorAll('.accordion-header');
  
    headers.forEach(header => {
      header.addEventListener('click', () => {
        const content = header.nextElementSibling;
  
        // Закрываем все другие блоки аккордеона
        headers.forEach(h => {
          if (h !== header) {
            h.nextElementSibling.classList.remove('active');
          }
        });
  
        // Открываем или закрываем текущий блок
        content.classList.toggle('active');
      });
    });
  });