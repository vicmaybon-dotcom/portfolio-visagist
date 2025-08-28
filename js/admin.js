// js/admin.js
(() => {
  const MEDIA_URL = '/uploads';

  const API = {
    base: '/api',
    headers() {
      const keyInput = document.getElementById('admKey');
      const key = keyInput ? keyInput.value.trim() : '';
      return key ? { 'x-admin-key': key } : {};
    }
  };

  const els = {
    key: document.getElementById('admKey'),
    rebuild: document.getElementById('btnRebuild'),
    refresh: document.getElementById('btnRefresh'),
    crumbs: document.getElementById('admCrumbs'),
    listing: document.getElementById('admin-listing'),
    viewer: document.getElementById('admin-viewer'),
    preview: document.getElementById('admin-preview'),

    mkdirName: document.getElementById('mkdirName'),
    btnMkdir: document.getElementById('btnMkdir'),
    fileInput: document.getElementById('fileInput'),
    btnUpload: document.getElementById('btnUpload'),
    renameType: document.getElementById('renameType'),
    renameOld: document.getElementById('renameOld'),
    renameNew: document.getElementById('renameNew'),
    btnRename: document.getElementById('btnRename'),
    deleteType: document.getElementById('deleteType'),
    deleteName: document.getElementById('deleteName'),
    btnDelete: document.getElementById('btnDelete'),
  };

  // состояние
  let cwd = [];
  let lastListing = { folders: [], files: [] };

  // helpers
  const joinPath = (arr) => arr.join('/');
  const enc = (s) => encodeURIComponent(s);
  const isImage = (n) => /\.(jpe?g|png|webp|gif)$/i.test(n);
  const isVideo = (n) => /\.(mp4|mov|webm)$/i.test(n);

  function setKeyFromStorage() {
    const k = localStorage.getItem('admKey') || '';
    if (els.key) els.key.value = k;
  }

  function buildCrumbs() {
    els.crumbs.innerHTML = '';
    const root = document.createElement('a');
    root.textContent = '/';
    root.href = '#';
    root.onclick = (e) => { e.preventDefault(); cwd = []; loadList(); };
    els.crumbs.appendChild(root);

    cwd.forEach((seg, idx) => {
      const sep = document.createElement('span');
      sep.textContent = ' / ';
      els.crumbs.appendChild(sep);

      const a = document.createElement('a');
      a.textContent = seg;
      a.href = '#';
      a.onclick = (e) => { e.preventDefault(); cwd = cwd.slice(0, idx + 1); loadList(); };
      if (idx === cwd.length - 1) a.classList.add('active');
      els.crumbs.appendChild(a);
    });
  }

  async function apiGet(pathArr) {
    const url = `${API.base}/tree?path=${enc(joinPath(pathArr))}`;
    const res = await fetch(url, { headers: API.headers() });
    if (!res.ok) throw new Error(`GET /tree ${res.status}`);
    return res.json();
  }

  // создаёт .listing-wrap вокруг #admin-listing, если её ещё нет
  function ensureListingWrap() {
    const listing = els.listing;
    const parent = listing.parentElement;
    if (!parent || !parent.classList || !parent.classList.contains('listing-wrap')) {
      const wrap = document.createElement('div');
      wrap.className = 'listing-wrap';
      listing.replaceWith(wrap);
      wrap.appendChild(listing);
      return wrap;
    }
    return parent;
  }

  // карточки
  function createFolderCard(name) {
    const card = document.createElement('div');
    card.className = 'admin-card folder';
    card.innerHTML = `
      <div class="thumb"></div>
      <div class="meta">
        <span class="name">${name}</span>
        <span class="badge">папка</span>
      </div>
    `;
    card.onclick = () => { cwd.push(name); loadList(); };
    return card;
  }

  function createFileCard(name) {
    const filePath = `${MEDIA_URL}/${joinPath([...cwd, name])}`;
    const noImg = `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="96">
         <rect width="140" height="96" fill="#f3f3f3"/>
         <text x="50%" y="52%" font-size="12" fill="#666" text-anchor="middle">file</text>
       </svg>`
    )}`;
    const card = document.createElement('div');
    card.className = 'admin-card';
    card.onclick = () => previewFile(name);
    const bg = isImage(name) ? `url('${filePath}')` : `url('${noImg}')`;
    card.innerHTML = `
      <div class="thumb" style="background-image:${bg}"></div>
      <div class="meta">
        <span class="name">${name}</span>
        <span class="badge">файл</span>
      </div>
    `;
    return card;
  }

  // стрелки для горизонтальной ленты
 /* function addScrollerControls(container) {
    const wrap = ensureListingWrap();*/

    // убрать старые кнопки
    wrap.querySelectorAll('.scroll-btn').forEach(btn => btn.remove());

    const leftBtn = document.createElement('button');
    leftBtn.className = 'scroll-btn scroll-left';
    leftBtn.innerHTML = '◀';

    const rightBtn = document.createElement('button');
    rightBtn.className = 'scroll-btn scroll-right';
    rightBtn.innerHTML = '▶';

    function updateButtons() {
      const maxScroll = container.scrollWidth - container.clientWidth;
      leftBtn.disabled = container.scrollLeft <= 0;
      rightBtn.disabled = container.scrollLeft >= (maxScroll - 2);
    }

    // не накапливаем обработчики
   /* if (container._scrollHandler) {
      container.removeEventListener('scroll', container._scrollHandler);
    }
    container._scrollHandler = updateButtons;
    container.addEventListener('scroll', updateButtons);

    leftBtn.onclick = () => {
      container.scrollBy({ left: -240, behavior: 'smooth' });
      setTimeout(updateButtons, 260);
    };
    rightBtn.onclick = () => {
      container.scrollBy({ left: 240, behavior: 'smooth' });
      setTimeout(updateButtons, 260);
    };

    wrap.appendChild(leftBtn);
    wrap.appendChild(rightBtn);

    requestAnimationFrame(updateButtons);
  }

  function removeScrollerControls() {
    const wrap = ensureListingWrap();
    wrap.querySelectorAll('.scroll-btn').forEach(btn => btn.remove());
  }
*/
  async function loadList() {
    buildCrumbs();
    els.viewer.innerHTML = `<div class="preview-empty">Выберите файл, чтобы увидеть превью</div>`;

    const data = await apiGet(cwd);
    lastListing = data;

    // режим правой колонки
    const onlyFolders = data.files.length === 0;
    if (els.preview && els.preview.classList) {
      // соответствие ИМЕННО твоим стилям: .admin-preview.folders / .admin-preview.files
      els.preview.classList.toggle('folders', onlyFolders);
      els.preview.classList.toggle('files', !onlyFolders);
    }

    // сортировка
    data.folders.sort((a, b) => a.localeCompare(b, 'ru'));
    data.files.sort((a, b) => a.localeCompare(b, 'ru'));

    const listing = els.listing;
    listing.innerHTML = '';

    // папки
    data.folders.forEach(name => listing.appendChild(createFolderCard(name)));

    // файлы
    if (!onlyFolders) {
      data.files.forEach(name => listing.appendChild(createFileCard(name)));
      addScrollerControls(listing);
    } else {
      removeScrollerControls();
    }
  }

  function previewFile(name) {
    const filePath = `${MEDIA_URL}/${joinPath([...cwd, name])}`;
    if (isImage(name)) {
      els.viewer.innerHTML = `<img src="${filePath}" alt="${name}" />`;
    } else if (isVideo(name)) {
      els.viewer.innerHTML = `<video src="${filePath}" controls playsinline></video>`;
    } else {
      els.viewer.innerHTML = `<div class="preview-empty">Превью не доступно. Файл: ${name}</div>`;
    }
  }

  // действия
  async function doRebuild() {
    const res = await fetch(`${API.base}/rebuild`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...API.headers() }
    });
    if (!res.ok) return alert('Ошибка пересборки JSON');
    alert('portfolio.json пересобран');
  }

  async function doMkdir() {
    const name = els.mkdirName.value.trim();
    if (!name) return alert('Введите имя папки');
    const relPath = joinPath(cwd);
    const res = await fetch(`${API.base}/mkdir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...API.headers() },
      body: JSON.stringify({ path: relPath, name })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      return alert('Ошибка создания папки: ' + (err?.error || res.status));
    }
    els.mkdirName.value = '';
    await loadList();
  }

  async function doUpload() {
    const f = els.fileInput.files && els.fileInput.files[0];
    if (!f) return;
    const fd = new FormData();
    fd.append('file', f);
    fd.append('path', joinPath(cwd));

    const res = await fetch(`${API.base}/upload`, {
      method: 'POST',
      headers: { ...API.headers() },
      body: fd
    });
    if (!res.ok) return alert('Ошибка загрузки');
    els.fileInput.value = '';
    await loadList();
  }

  async function doRename() {
    const type = els.renameType.value;
    const oldName = els.renameOld.value.trim();
    const newName = els.renameNew.value.trim();
    if (!oldName || !newName) return;
    const res = await fetch(`${API.base}/rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...API.headers() },
      body: JSON.stringify({ path: joinPath(cwd), type, oldName, newName })
    });
    if (!res.ok) return alert('Ошибка переименования');
    els.renameOld.value = '';
    els.renameNew.value = '';
    await loadList();
  }

  async function doDelete() {
    const type = els.deleteType.value;
    const name = els.deleteName.value.trim();
    if (!name) return;
    const res = await fetch(`${API.base}/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...API.headers() },
      body: JSON.stringify({ path: joinPath(cwd), type, name })
    });
    if (!res.ok) return alert('Ошибка удаления');
    els.deleteName.value = '';
    await loadList();
  }

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

   
    // ===== Галерея с файлами =====
if (currentData.__files__ && currentData.__files__.length > 0) {
  const files = currentData.__files__;
  const gallery = document.createElement('div');

  // Если файлов мало — не растягиваем на всю ширину
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


    // ===== Список карточек категорий / подкатегорий =====
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
  
  // init
  /*function bind() {
    setKeyFromStorage();

    if (els.rebuild) els.rebuild.addEventListener('click', doRebuild);
    if (els.refresh) els.refresh.addEventListener('click', loadList);

    els.btnMkdir.addEventListener('click', doMkdir);
    els.btnUpload.addEventListener('click', doUpload);
    els.btnRename.addEventListener('click', doRename);
    els.btnDelete.addEventListener('click', doDelete);

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('admKey');
        alert('Вы вышли из админки');
        location.reload();
      });
    }
  }

  bind();
  loadList().catch(err => console.error(err));
*/
  // === Модалка логина ===
 /* const loginModal = document.getElementById('loginModal');
  const passwordInput = document.getElementById('passwordInput');
  const loginBtn = document.getElementById('loginBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const loginError = document.getElementById('loginError');
  const togglePasswordBtn = document.getElementById('togglePassword');

  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.setAttribute('aria-pressed', 'false');
    togglePasswordBtn.setAttribute('aria-label', 'Показать пароль');
    togglePasswordBtn.addEventListener('click', () => {
      const show = passwordInput.type === 'password';
      passwordInput.type = show ? 'text' : 'password';
      togglePasswordBtn.setAttribute('aria-pressed', show ? 'true' : 'false');
      togglePasswordBtn.setAttribute('aria-label', show ? 'Скрыть пароль' : 'Показать пароль');
      togglePasswordBtn.innerHTML = show
        ? '<i class="fa-solid fa-eye-slash" aria-hidden="true"></i>'
        : '<i class="fa-solid fa-eye" aria-hidden="true"></i>';
      passwordInput.focus();
    });
  }

  window.openLoginModal = () => {
    loginError.textContent = '';
    passwordInput.value = '';
    loginModal.style.display = 'flex';
    passwordInput.focus();
  };

  function closeLoginModal() {
    loginModal.style.display = 'none';
  }

  async function doLogin() {
    const pass = passwordInput.value.trim();
    if (!pass) return;
    try {
      const res = await fetch(`${API.base}/tree?path=`, { headers: { 'x-admin-key': pass } });
      if (res.ok) {
        localStorage.setItem('admKey', pass);
        els.key.value = pass;
        closeLoginModal();
        await loadList();
      } else {
        loginError.textContent = 'Неверный пароль';
      }
    } catch {
      loginError.textContent = 'Ошибка соединения';
    }
  }

  loginBtn.addEventListener('click', doLogin);
  cancelBtn.addEventListener('click', () => { window.location.href = 'portfolio.html'; });
  passwordInput.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

  (async function initLogin() {
    const savedKey = localStorage.getItem('admKey');
    if (savedKey) {
      try {
        const res = await fetch(`${API.base}/tree?path=`, { headers: { 'x-admin-key': savedKey } });
        if (res.ok) {
          els.key.value = savedKey;
          await loadList();
          return;
        } else {
          localStorage.removeItem('admKey');
        }
      } catch {
        localStorage.removeItem('admKey');
      }
    }
    if (!localStorage.getItem('admKey')) openLoginModal();
  })();
})();
*/