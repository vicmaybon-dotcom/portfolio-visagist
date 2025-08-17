// portfolio.js
const params = new URLSearchParams(window.location.search);
const path = []; // массив с category, subcategory1, subcategory2...

if (params.get('category')) path.push(params.get('category'));
let i = 1;
while (params.get('subcategory' + i)) {
  path.push(params.get('subcategory' + i));
  i++;
}

// Загружаем JSON
fetch('data/portfolio.json')
  .then(res => res.json())
  .then(data => {
    let currentData = data;
    path.forEach(key => {
      if (currentData && typeof currentData === 'object') {
        currentData = currentData[key];
      }
    });

    // Заголовок
    const pageTitle = document.getElementById('pageTitle');
    pageTitle.textContent = path.length ? path.join(' → ').replace(/_/g, ' ') : 'Портфолио';

    // Хлебные крошки
    const bcContainer = document.getElementById('breadcrumbs');
    if (path.length) {
      let bcLink = `portfolio.html`;
      bcContainer.innerHTML = `<a href="${bcLink}">Портфолио</a>`;
      bcLink = `portfolio.html?category=${encodeURIComponent(path[0])}`;
      bcContainer.innerHTML += ` <span>›</span> <a href="${bcLink}">${path[0].replace(/_/g, ' ')}</a>`;

      for (let j = 1; j < path.length; j++) {
        bcLink += `&subcategory${j}=${encodeURIComponent(path[j])}`;
        bcContainer.innerHTML += ` <span>›</span> <a href="${bcLink}">${path[j].replace(/_/g, ' ')}</a>`;
      }
    }

    const container = document.getElementById('content');

    if (currentData.__files__ && currentData.__files__.length > 0) {
      // Галерея
      const gallery = document.createElement('div');
      gallery.className = 'gallery';
      currentData.__files__.forEach(file => {
        const ext = file.split('.').pop().toLowerCase();
        const filePath = `img/1_PORTFOLIO/${path.join('/')}/${file}`;
        if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
          const img = document.createElement('img');
          img.src = filePath;
          img.alt = file;
          img.onerror = () => { img.src = 'img/no-image.jpg'; };
          gallery.appendChild(img);
        } else if (['mp4', 'mov', 'webm'].includes(ext)) {
          const video = document.createElement('video');
          video.src = filePath;
          video.controls = true;
          gallery.appendChild(video);
        }
      });
      container.appendChild(gallery);
    }

    // Список карточек категорий / подкатегорий
    const subcategories = Object.keys(currentData).filter(sub => sub !== '__files__');
    if (subcategories.length > 0) {
      const list = document.createElement('div');
      list.className = 'category-list';

      subcategories.forEach(sub => {
        const subPath = [...path, sub];
        let previewFile = '';

        if (currentData[sub].__files__ && currentData[sub].__files__.length > 0) {
          previewFile = currentData[sub].__files__[0];
        }

        const imgPath = previewFile
          ? `img/1_PORTFOLIO/${subPath.join('/')}/${previewFile}`
          : 'img/no-image.jpg';

        let link = `portfolio.html?category=${encodeURIComponent(path[0] || sub)}`;
        for (let k = 1; k < path.length; k++) {
          link += `&subcategory${k}=${encodeURIComponent(path[k])}`;
        }
        if (path.length) {
          link += `&subcategory${path.length}=${encodeURIComponent(sub)}`;
        }

        const card = document.createElement('a');
        card.href = link;
        card.className = 'category-card';

        const testImg = new Image();
        testImg.onload = () => {
          card.innerHTML = `
            <div class="card-image" style="background-image: url('${imgPath}')"></div>
            <div class="card-title">${sub.replace(/_/g, ' ')}</div>
          `;
        };
        testImg.onerror = () => {
          card.innerHTML = `
            <div class="card-image" style="background-image: url('img/no-image.jpg')"></div>
            <div class="card-title">${sub.replace(/_/g, ' ')}</div>
          `;
        };
        testImg.src = imgPath;

        list.appendChild(card);
      });

      container.appendChild(list);
    }
  })
  .catch(err => console.error('Ошибка загрузки JSON:', err));
