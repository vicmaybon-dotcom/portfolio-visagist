// admin-portfolio.js
// Используется и в админке, и в публичном портфолио (только BASE_PAGE меняется).

const BASE_PAGE = 'admin-portfolio.html'; 
// На публичной странице ставь: const BASE_PAGE = 'portfolio.html';

// --- глобальное состояние активного поля ---
let lastActiveInput = null;
let lastDeletedItem = null;

// следим за фокусом в полях
document.addEventListener('DOMContentLoaded', () => {
  // 1. Находим нужные поля ввода по их ID
  const inputRenameOld = document.getElementById('renameOld');
  const inputDeleteName = document.getElementById('deleteName');


   // 2. Добавляем слушатель события "focus" к каждому полю
   if (inputRenameOld) {
    inputRenameOld.addEventListener('focus', () => {
        lastActiveInput = inputRenameOld;
    });
}
if (inputDeleteName) {
    inputDeleteName.addEventListener('focus', () => {
        lastActiveInput = inputDeleteName;
    });
}
// 3. Добавляем слушатель события "клик" на родительский контейнер
    // Это позволяет нам ловить клики на всех файлах и папках,
    // не добавляя слушатель к каждому элементу по отдельности.
    const portfolioGrid = document.getElementById('content'); 
    if (portfolioGrid) {
        portfolioGrid.addEventListener('click', (event) => {
            const clickedItem = event.target.closest('.item-container'); // Находим ближайший контейнер
            if (clickedItem) {
                // Получаем имя из атрибута data-name или другого места
                const itemName = clickedItem.dataset.name; 
                if (itemName) {
                    insertFileName(itemName);
                }
            }
        });
    }


// 4. Обновляем функцию insertFileName
// Она теперь будет работать только с тем полем, которое было активным последним.
function insertFileName(name) {
    if (lastActiveInput) {
        lastActiveInput.value = name;
        lastActiveInput.focus(); // Возвращаем фокус для удобства
    }
}
 
 // --- resize панели предпросмотра ---
const workspace = document.getElementById("workspace");
const previewPane = document.getElementById("previewPane");
const resizer = document.getElementById("previewResizer");

let isResizing = false;

// Добавляем event listener для начала перетаскивания
resizer.addEventListener("mousedown", (e) => {
  isResizing = true;
  document.body.style.cursor = "ew-resize";
  // Отключаем выделение текста, чтобы избежать нежелательного поведения
  document.body.style.userSelect = "none";
});

// Добавляем event listener для отслеживания движения мыши
document.addEventListener("mousemove", (e) => {
  if (!isResizing) return;

  const workspaceRect = workspace.getBoundingClientRect();
  const minWidth = 280; // Минимальная ширина панели
  const maxWidth = workspaceRect.width * 0.8; // Максимальная ширина 80% от workspace
  const newWidth = workspaceRect.right - e.clientX;

  // Ограничиваем ширину панели, чтобы она не выходила за пределы
  if (newWidth >= minWidth && newWidth <= maxWidth) {
    previewPane.style.width = `${newWidth}px`;
    previewPane.style.flex = "0 0 auto"; // Важно: устанавливаем auto, чтобы flex не мешал
  }
});

// Добавляем event listener для окончания перетаскивания
document.addEventListener("mouseup", () => {
  if (isResizing) {
    isResizing = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }
});


});

// функция вставки имени
function insertFileName(name) {
  if (lastActiveInput) {
    lastActiveInput.value = name;
  } else {
    const inputOldName = document.querySelector('input[placeholder="Старое имя"]');
    if (inputOldName) inputOldName.value = name;
  }
}

async function renderPortfolio() {
  const params = new URLSearchParams(window.location.search);
  const path = [];
  if (params.get('category')) path.push(params.get('category'));
  let i = 1;
  while (params.get('subcategory' + i)) {
    path.push(params.get('subcategory' + i));
    i++;
  }

  try {
    const r = await fetch('data/portfolio.json');
    const data = await r.json();

    // Ищем в дереве по path
    let currentNode = { children: data }; 
    for (const segment of path) {
      const next = currentNode.children?.find(
        item => item.type === "folder" && item.name === segment
      );
      if (!next) { currentNode = null; break; }
      currentNode = next;
    }

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
        let subLink = '';
        path.forEach((seg, idx) => {
          subLink += (idx === 0) 
            ? `?category=${encodeURIComponent(seg)}` 
            : `&subcategory${idx}=${encodeURIComponent(seg)}`;
          const isLast = idx === path.length - 1;
          bc.innerHTML += ` <span>›</span> <a href="${BASE_PAGE}${subLink}"${isLast ? ' class="active"' : ''}>${seg.replace(/_/g, ' ')}</a>`;
        });
      }
    }

    const container = document.getElementById('content');
    if (!container) return;
    container.innerHTML = '';

    if (!currentNode) {
      container.textContent = "❌ Папка не найдена";
      return;
    }

    // === Галерея файлов ===
    const files = (currentNode.children || []).filter(c => c.type === "file");
    if (files.length > 0) {
      const gallery = document.createElement('div');
      gallery.className = files.length <= 2 ? 'gallery gallery--compact' : 'gallery';

      files.forEach(fileNode => {
        const file = fileNode.name;
        const ext = file.split('.').pop().toLowerCase();
        const filePath = `uploads/${path.join('/')}/${file}`;
        const cell = document.createElement('div');
        cell.className = 'cell';

        if (['jpg','jpeg','png','webp','gif'].includes(ext)) {
          const img = document.createElement('img');
          img.src = filePath;
          img.alt = file;
          img.dataset.name = file;
          img.classList.add('js-file');
        
          img.onerror = () => { img.src = 'img/no-image.jpg'; };
        
          const caption = document.createElement('div');
          caption.className = 'file-caption';
          caption.textContent = file;
        
          cell.appendChild(img);
          cell.appendChild(caption);
        }
         else if (['mp4','mov','webm'].includes(ext)) {
          const video = document.createElement('video');
          video.src = filePath;
          video.controls = true;
          cell.appendChild(video);
        }

        gallery.appendChild(cell);
      });

      

      container.appendChild(gallery);
    }

    // === Подкатегории ===
    const subs = (currentNode.children || []).filter(c => c.type === "folder");
    if (subs.length > 0) {
      const list = document.createElement('div');
      list.className = 'category-list';

      subs.forEach(subNode => {
        const subPath = [...path, subNode.name];

        let previewFile = '';
        const firstFile = (subNode.children || []).find(c => c.type === "file");
        if (firstFile) previewFile = firstFile.name;

        const imgPath = previewFile
          ? `uploads/${subPath.join('/')}/${previewFile}`
          : 'img/no-image.jpg';

        let link = `${BASE_PAGE}?category=${encodeURIComponent(path[0] || subNode.name)}`;
        for (let k = 1; k < path.length; k++) {
          link += `&subcategory${k}=${encodeURIComponent(path[k])}`;
        }
        if (path.length) {
          link += `&subcategory${path.length}=${encodeURIComponent(subNode.name)}`;
        }

        const card = document.createElement('a');
        card.href = link;
        card.className = 'category-card';

        const t = new Image();
        t.onload = () => {
          card.innerHTML = `
            <div class="card-image" style="background-image: url('${imgPath}')"></div>
            <div class="card-title">${subNode.name.replace(/_/g, ' ')}</div>
          `;
        };
        t.onerror = () => {
          card.innerHTML = `
            <div class="card-image" style="background-image: url('img/no-image.jpg')"></div>
            <div class="card-title">${subNode.name.replace(/_/g, ' ')}</div>
          `;
        };
        t.src = imgPath;

        list.appendChild(card);
      });

      container.appendChild(list);
    }

    // --- обработчики кликов ---
    function attachPreviewHandlers() {
      function clearSelection() {
        document.querySelectorAll('#content .selected').forEach(el => {
          el.classList.remove('selected');
        });
      }

      // файлы
      document.querySelectorAll('#content .js-file').forEach(el => {
        const name = el.dataset.name;
        el.addEventListener('click', (e) => {
          e.preventDefault();
          clearSelection();
          el.classList.add('selected');
          insertFileName(name);
        });
        el.addEventListener('dblclick', () => showPreview(name));
      });

      // папки
      document.querySelectorAll('#content .category-card').forEach(card => {
        card.addEventListener('click', (e) => {
          e.preventDefault();
          clearSelection();
          card.classList.add('selected');
          const folderName = card.querySelector('.card-title')?.textContent.trim();
          insertFileName(folderName);
        });
        card.addEventListener('dblclick', (e) => {
          e.preventDefault();
          window.location.href = card.href;
        });
      });

      // крестик
      const closeBtn = document.getElementById('previewCloseBtn');
      if (closeBtn) closeBtn.onclick = hidePreview;
    }

    attachPreviewHandlers();

  } catch (e) {
    console.error('Ошибка загрузки JSON:', e);
  }
}

// --- функции предпросмотра ---
function previewUrlFor(name) {
  const p = getCurrentPath();
  return `uploads/${p ? p + '/' : ''}${name}`;
}

function showPreview(name) {
  const pane   = document.getElementById('previewPane');
 
  const img    = document.getElementById('previewImage');
  const errBox = document.getElementById('previewError');
  
  errBox.hidden = true;

  img.onload = () => { 
    errBox.hidden = true; 
    pane.style.display = 'flex';
    pane.classList.add("active");   // 👉 добавляем класс при открытии
    previewPane.removeAttribute("hidden");
  };
  img.onerror = () => {
    img.removeAttribute('src');
    errBox.hidden = false;
    pane.style.display = 'flex';
    pane.classList.add("active");   // 👉 и здесь тоже, если ошибка
  };

  img.src = previewUrlFor(name);
}

function hidePreview() {
  const pane = document.getElementById('previewPane');
  const img  = document.getElementById('previewImage');
  if (img) img.removeAttribute('src');
  pane.style.display = 'none';
  pane.classList.remove("active");   // 👉 убираем класс при закрытии
}

document.getElementById('previewCloseBtn')?.addEventListener('click', hidePreview);

// старт
renderPortfolio();
