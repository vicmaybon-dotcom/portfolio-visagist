// js/portfolio-main.js
document.addEventListener('DOMContentLoaded', () => {
  const GRID_SELECTOR = '.portfolio-grid';
  const JSON_PATH = 'data/portfolio.json'; // путь к сгенерированному JSON
  const IMG_BASE = 'img/1_PORTFOLIO'; // базовая папка с изображениями

  const isImage = (name) => /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(name);

  /**
   * Рекурсивно ищет первую картинку в дереве node.
   * node может быть:
   *  - массивом файлов -> ['a.jpg','b.png']
   *  - объектом { subfolder: {...}, __files__: [...] }
   *
   * pathArr — массив сегментов пути (ключи папок)
   * Возвращает { path: 'Top/Sub', file: 'img.jpg' } или null
   */
  function findFirstImage(node, pathArr = []) {
    if (!node) return null;

    // Если массив — ищем в нём картинку
    if (Array.isArray(node)) {
      const img = node.find(isImage) || node[0];
      if (img) return { path: pathArr.join('/'), file: img };
      return null;
    }

    // Если объект
    if (typeof node === 'object') {
      // сначала файлы в текущей папке (если есть __files__)
      if (Array.isArray(node.__files__) && node.__files__.length > 0) {
        const img = node.__files__.find(isImage) || node.__files__[0];
        if (img) return { path: pathArr.join('/'), file: img };
      }
      // рекурсивно проходим по подпапкам
      for (const key of Object.keys(node)) {
        if (key === '__files__') continue;
        const res = findFirstImage(node[key], [...pathArr, key]);
        if (res) return res;
      }
    }

    return null;
  }

  // Преобразует ключ в человекочитаемую подпись (замена _ и -)
  function niceTitle(key) {
    return String(key).replace(/[_\-]+/g, ' ').replace(/\b\w/g, s => s.toUpperCase());
  }

  // Строим карточку
  function buildCard(title, imgSrc, linkHref) {
    const item = document.createElement('div');
    item.className = 'portfolio-item';

    const a = document.createElement('a');
    a.href = linkHref;
    a.className = 'portfolio-link';
    a.setAttribute('aria-label', title);

    const img = document.createElement('img');
    img.src = imgSrc;
    img.alt = title;
    img.loading = 'lazy';

    const overlay = document.createElement('div');
    overlay.className = 'portfolio-overlay';

    const h3 = document.createElement('h3');
    h3.textContent = title;

    overlay.appendChild(h3);
    a.appendChild(img);
    a.appendChild(overlay);
    item.appendChild(a);

    return item;
  }

  // main
  (async function render() {
    const grid = document.querySelector(GRID_SELECTOR);
    if (!grid) {
      console.warn('portfolio-main.js: не найдена контейнер .portfolio-grid');
      return;
    }

    try {
      const resp = await fetch(JSON_PATH, {cache: "no-store"});
      if (!resp.ok) throw new Error(`Ошибка загрузки ${JSON_PATH}: ${resp.status}`);
      const data = await resp.json();

      // очищаем grid (если есть статичные заглушки)
      grid.innerHTML = '';

      // Для каждого первого уровня генерируем карточку
      for (const [topKey, topValue] of Object.entries(data)) {
        const found = findFirstImage(topValue, [topKey]);
        let imgSrc;
        if (found && found.path && found.file) {
          // путь составляем относительно img/1_PORTFOLIO
          imgSrc = `${IMG_BASE}/${found.path}/${found.file}`;
        } else if (found && found.file) {
          imgSrc = `${IMG_BASE}/${topKey}/${found.file}`;
        } else {
          imgSrc = 'img/placeholder-portfolio.jpg'; // убедись, что такой файл есть (или убери)
        }

        const title = niceTitle(topKey);
        const href = `portfolio-sub.html?category=${encodeURIComponent(topKey)}`;

        const card = buildCard(title, imgSrc, href);
        grid.appendChild(card);
      }

    } catch (err) {
      console.error('portfolio-main.js:', err);
      grid.innerHTML = '<p style="color:#c00">Ошибка загрузки портфолио. Проверьте data/portfolio.json</p>';
    }
  })();
});
