// public-or-admin-portfolio-render.js
// Используй и на публичной странице, и в админке.
// Достаточно поменять BASE_PAGE под имя текущего HTML:

const BASE_PAGE = 'admin-portfolio.html'; 
// на публичной странице поставь: const BASE_PAGE = 'portfolio.html';

(function () {
  const params = new URLSearchParams(window.location.search);
  const path = [];
  if (params.get('category')) path.push(params.get('category'));
  let i = 1;
  while (params.get('subcategory' + i)) {
    path.push(params.get('subcategory' + i));
    i++;
  }

  fetch('data/portfolio.json')
    .then(r => r.json())
    .then(data => {
      let currentData = data;
      path.forEach(key => {
        if (currentData && typeof currentData === 'object') currentData = currentData[key];
      });

      // Заголовок
      const pageTitle = document.getElementById('pageTitle');
      if (pageTitle) {
        pageTitle.textContent = path.length ? path.join(' → ').replace(/_/g, ' ') : 'Портфолио';
      }

      // Крошки
      const bc = document.getElementById('breadcrumbs');
      if (bc) {
        bc.innerHTML = '';
        if (path.length) {
          let link = `${BASE_PAGE}`;
          bc.innerHTML = `<a href="${link}">Портфолио</a>`;
          link = `${BASE_PAGE}?category=${encodeURIComponent(path[0])}`;
          bc.innerHTML += ` <span>›</span> <a href="${link}">${path[0].replace(/_/g, ' ')}</a>`;
          for (let j = 1; j < path.length; j++) {
            link += `&subcategory${j}=${encodeURIComponent(path[j])}`;
            const isLast = j === path.length - 1;
            bc.innerHTML += ` <span>›</span> <a href="${link}"${isLast ? ' class="active"' : ''}>${path[j].replace(/_/g, ' ')}</a>`;
          }
        }
      }

      const container = document.getElementById('content');
      if (!container) return;
      container.innerHTML = '';

      // Галерея файлов
      if (currentData.__files__ && currentData.__files__.length > 0) {
        const files = currentData.__files__;
        const gallery = document.createElement('div');
        gallery.className = files.length <= 2 ? 'gallery gallery--compact' : 'gallery';

        files.forEach(file => {
          const ext = file.split('.').pop().toLowerCase();
          const filePath = `uploads/${path.join('/')}/${file}`;
          const cell = document.createElement('div');
          cell.className = 'cell';

          if (['jpg','jpeg','png','webp','gif'].includes(ext)) {
            const img = document.createElement('img');
            img.src = filePath;
            img.alt = file;
            img.onerror = () => { img.src = 'img/no-image.jpg'; };
            cell.appendChild(img);
          } else if (['mp4','mov','webm'].includes(ext)) {
            const video = document.createElement('video');
            video.src = filePath;
            video.controls = true;
            cell.appendChild(video);
          }

          gallery.appendChild(cell);
        });

        container.appendChild(gallery);
      }

      // Список подкатегорий
      const subs = Object.keys(currentData).filter(k => k !== '__files__');
      if (subs.length > 0) {
        const list = document.createElement('div');
        list.className = 'category-list';

        subs.forEach(sub => {
          const subPath = [...path, sub];
          let previewFile = '';
          if (currentData[sub].__files__?.length) {
            previewFile = currentData[sub].__files__[0];
          }

          const imgPath = previewFile
            ? `uploads/${subPath.join('/')}/${previewFile}`
            : 'img/no-image.jpg';

          // собираем ссылку в один проход
          let link = `${BASE_PAGE}?category=${encodeURIComponent(path[0] || sub)}`;
          for (let k = 1; k < path.length; k++) {
            link += `&subcategory${k}=${encodeURIComponent(path[k])}`;
          }
          if (path.length) {
            link += `&subcategory${path.length}=${encodeURIComponent(sub)}`;
          }

          const card = document.createElement('a');
          card.href = link;
          card.className = 'category-card';

          const t = new Image();
          t.onload = () => {
            card.innerHTML = `
              <div class="card-image" style="background-image: url('${imgPath}')"></div>
              <div class="card-title">${sub.replace(/_/g, ' ')}</div>
            `;
          };
          t.onerror = () => {
            card.innerHTML = `
              <div class="card-image" style="background-image: url('img/no-image.jpg')"></div>
              <div class="card-title">${sub.replace(/_/g, ' ')}</div>
            `;
          };
          t.src = imgPath;

          list.appendChild(card);
        });

        container.appendChild(list);
      }
    })
    .catch(e => console.error('Ошибка загрузки JSON:', e));
})();
