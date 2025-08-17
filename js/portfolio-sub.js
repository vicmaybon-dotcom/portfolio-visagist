const params = new URLSearchParams(window.location.search);
const path = []; // массив путей из параметров

// Собираем category, subcategory1, subcategory2, ...
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
    document.getElementById('pageTitle').textContent = path.join(' → ').replace(/_/g, ' ');

    // Хлебные крошки
    const bcContainer = document.getElementById('breadcrumbs');
    let bcLink = 'portfolio-sub.html?category=' + encodeURIComponent(path[0]);
    bcContainer.innerHTML = `<a href="${bcLink}">${path[0].replace(/_/g, ' ')}</a>`;
    for (let j = 1; j < path.length; j++) {
      bcLink += `&subcategory${j}=` + encodeURIComponent(path[j]);
      bcContainer.innerHTML += ` <span>›</span> <a href="${bcLink}">${path[j].replace(/_/g, ' ')}</a>`;
    }

    const container = document.getElementById('content');

    if (Array.isArray(currentData)) {
      // Галерея медиа (фото + видео)
      const gallery = document.createElement('div');
      gallery.className = 'gallery';

      currentData.forEach(file => {
        const ext = file.split('.').pop().toLowerCase();

        if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
          const img = document.createElement('img');
          img.src = `img/1_PORTFOLIO/${path.join('/')}/${file}`;
          img.alt = file;
          gallery.appendChild(img);
        }
        else if (['mp4', 'mov', 'webm'].includes(ext)) {
          const video = document.createElement('video');
          video.src = `img/1_PORTFOLIO/${path.join('/')}/${file}`;
          video.controls = true;
          video.className = 'video-item';
          gallery.appendChild(video);
        }
      });

      container.appendChild(gallery);
    }
    else if (typeof currentData === 'object') {
      // Список подкатегорий
      const list = document.createElement('div');
      list.className = 'list';
      Object.keys(currentData).forEach(sub => {

        // 🔹 Пропускаем служебное поле с файлами
        if (sub === '__files__') return;

        let link = `portfolio-sub.html?category=${encodeURIComponent(path[0])}`;
        for (let k = 1; k < path.length; k++) {
          link += `&subcategory${k}=` + encodeURIComponent(path[k]);
        }
        link += `&subcategory${path.length}=` + encodeURIComponent(sub);

        const a = document.createElement('a');
        a.href = link;
        a.textContent = sub.replace(/_/g, ' ');
        a.className = 'item';
        list.appendChild(a);
      });
      container.appendChild(list);
    }
    else {
      container.textContent = 'Нет данных для отображения';
    }
  })
  .catch(err => console.error('Ошибка JSON:', err));
