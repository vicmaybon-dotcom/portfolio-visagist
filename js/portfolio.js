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
        const isLast = j === path.length - 1;
        bcContainer.innerHTML += ` <span>›</span> <a href="${bcLink}"${isLast ? ' class="active"' : ''}>${path[j].replace(/_/g, ' ')}</a>`;
      }
      
    }

    const container = document.getElementById('content');

    if (currentData.__files__ && currentData.__files__.length > 0) {
      // Галерея
      const gallery = document.createElement('div');
      gallery.className = 'gallery';
      currentData.__files__.forEach(file => {
        const ext = file.split('.').pop().toLowerCase();
        const filePath = `uploads/${path.join('/')}/${file}`;
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
          ? `uploads/${subPath.join('/')}/${previewFile}`
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

  // ===== Media Lightbox =====
(() => {
  const lbRoot    = document.getElementById('mediaLightbox');
  const lbStage   = document.getElementById('mlbStage');
  const lbCaption = document.getElementById('mlbCaption');
  const lbCounter = document.getElementById('mlbCounter');
  const btnPrev   = document.getElementById('mlbPrev');
  const btnNext   = document.getElementById('mlbNext');
  const btnClose  = document.getElementById('mlbClose');

  let items = [];      // {src, type, caption}
  let index = 0;
  let lastActive = null;

  function collectItems() {
    items = [];
    // 1) приоритет — явные превью с data-атрибутами
    document.querySelectorAll('.media-thumb[data-media-src]').forEach(el => {
      items.push({
        src: el.dataset.mediaSrc,
        type: (el.dataset.mediaType || guessType(el.dataset.mediaSrc)),
        caption: el.dataset.caption || el.getAttribute('aria-label') || ''
      });
    });

    // 2) fallback — все картинки внутри сетки, если .media-thumb нет
    if (items.length === 0) {
      document.querySelectorAll('#content img').forEach(img => {
        const src = img.dataset.full || img.src; // можно класть data-full для полноразм.
        items.push({ src, type: 'image', caption: img.alt || '' });
        img.classList.add('media-thumb'); // дадим класс, чтобы клик ловился делегированием
        img.dataset.mediaSrc = src;
        img.dataset.mediaType = 'image';
      });
    }
  }

  function guessType(url = '') {
    return /\.(mp4|mov|webm)$/i.test(url) ? 'video' : 'image';
  }

  function open(idx, fromEl) {
    if (!items.length) collectItems();
    index = Math.max(0, Math.min(idx, items.length - 1));
    lastActive = fromEl || document.activeElement;

    render();
    document.body.classList.add('mlb-open');
    lbRoot.hidden = false;
    lbRoot.setAttribute('aria-hidden', 'false');
    btnClose.focus();

    window.addEventListener('keydown', onKey);
    lbRoot.addEventListener('click', onBackdrop);
    attachSwipe(lbStage);
  }

  function close() {
    pauseVideo();
    lbRoot.setAttribute('aria-hidden', 'true');
    lbRoot.hidden = true;
    document.body.classList.remove('mlb-open');

    window.removeEventListener('keydown', onKey);
    lbRoot.removeEventListener('click', onBackdrop);
    detachSwipe(lbStage);

    if (lastActive && lastActive.focus) lastActive.focus();
  }

  function onKey(e) {
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  }

  function onBackdrop(e) {
    // клик по фону — закрыть; по слайду/кнопкам — игнор
    const onStage = e.target.closest('.mlb-stage, .mlb-btn');
    if (!onStage) close();
  }

  function next() { goTo(index + 1); }
  function prev() { goTo(index - 1); }

  function goTo(i) {
    if (!items.length) return;
    index = (i + items.length) % items.length;
    render(true);
  }

  function pauseVideo() {
    const v = lbStage.querySelector('video');
    if (v && !v.paused) v.pause();
  }

  function render(withFade) {
    const it = items[index];
    pauseVideo();
    lbStage.innerHTML = ''; // чистим

    let node;
    if (it.type === 'video') {
      node = document.createElement('video');
      node.src = it.src;
      node.controls = true;
      node.playsInline = true;
      node.preload = 'metadata';
      node.style.maxWidth = '100%';
    } else {
      node = document.createElement('img');
      node.src = it.src;
      node.alt = it.caption || '';
      node.decoding = 'async';
    }
    if (withFade) {
      node.style.opacity = '0';
      node.style.transition = 'opacity .2s ease';
      requestAnimationFrame(() => (node.style.opacity = '1'));
    }

    lbStage.appendChild(node);
    lbCaption.textContent = it.caption || '';
    lbCounter.textContent = `${index + 1} / ${items.length}`;

    // прелоад соседей (картинки)
    preloadNeighbors();
    // если один элемент — прячем стрелки
    btnPrev.style.display = btnNext.style.display = (items.length > 1 ? '' : 'none');
  }

  function preloadNeighbors() {
    const left = items[(index - 1 + items.length) % items.length];
    const right = items[(index + 1) % items.length];
    [left, right].forEach(it => {
      if (it && it.type === 'image') {
        const img = new Image();
        img.src = it.src;
      }
    });
  }

  // свайпы
  let touchX = null, touchY = null;
  function attachSwipe(el) {
    el.addEventListener('touchstart', onTs, { passive: true });
    el.addEventListener('touchend', onTe, { passive: true });
  }
  function detachSwipe(el) {
    el.removeEventListener('touchstart', onTs);
    el.removeEventListener('touchend', onTe);
  }
  function onTs(e) {
    const t = e.changedTouches[0];
    touchX = t.clientX; touchY = t.clientY;
  }
  function onTe(e) {
    const t = e.changedTouches[0];
    const dx = t.clientX - touchX;
    const dy = t.clientY - touchY;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      dx < 0 ? next() : prev();
    }
  }

  // кнопки
  btnClose.addEventListener('click', close);
  btnNext.addEventListener('click', next);
  btnPrev.addEventListener('click', prev);

  // делегирование кликов по превью внутри сетки
  document.addEventListener('click', (e) => {
    const t = e.target.closest('.media-thumb, #content img');
    if (!t) return;

    // при первом клике собираем список и находим индекс кликнутого
    collectItems();
    const src = t.dataset.mediaSrc || t.dataset.full || (t.tagName === 'IMG' ? t.src : '');
    const idx = items.findIndex(it => it.src === src);
    open(idx >= 0 ? idx : 0, t);
  });

  // публичный хук на случай программного открытия
  window.openMediaLightbox = (idx = 0) => { collectItems(); open(idx); };
})();