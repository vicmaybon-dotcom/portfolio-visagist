// js/admin.js
(() => {
  const API = {
    base: '/api',
    headers() {
    const keyInput = document.getElementById('admKey'); // или тот элемент, который у тебя для ключа
    const key = keyInput ? keyInput.value.trim() : '';
    return key ? { 'x-admin-key': key } : {};
  }
  };

  const els = {
    key: document.getElementById('admKey'),
    saveKey: document.getElementById('btnSaveKey'),
    rebuild: document.getElementById('btnRebuild'),
    refresh: document.getElementById('btnRefresh'),
    crumbs: document.getElementById('admCrumbs'),
    listing: document.getElementById('admin-listing'),
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
  let cwd = []; // массив сегментов пути
  let lastListing = { folders: [], files: [] };

  // helpers
  const joinPath = (arr) => arr.join('/');
  const enc = (s) => encodeURIComponent(s);
  const isImage = (n) => /\.(jpe?g|png|webp|gif)$/i.test(n);
  const isVideo = (n) => /\.(mp4|mov|webm)$/i.test(n);

  function setKeyFromStorage() {
    const k = localStorage.getItem('admKey') || '';
    els.key.value = k;
  }

  function buildCrumbs() {
    els.crumbs.innerHTML = '';
    const root = document.createElement('a');
    root.textContent = '/';
    root.href = '#';
    root.onclick = (e) => { e.preventDefault(); cwd = []; loadList(); };
    els.crumbs.appendChild(root);

    let acc = [];
    cwd.forEach((seg, idx) => {
      const sep = document.createElement('span');
      sep.textContent = ' / ';
      els.crumbs.appendChild(sep);

      acc.push(seg);
      const a = document.createElement('a');
      a.textContent = seg;
      a.href = '#';
      a.onclick = (e) => { e.preventDefault(); cwd = cwd.slice(0, idx + 1); loadList(); };
      els.crumbs.appendChild(a);
    });
  }

  async function apiGet(pathArr) {
    const url = `${API.base}/tree?path=${enc(joinPath(pathArr))}`;
    const res = await fetch(url, { headers: API.headers() });
    if (!res.ok) throw new Error(`GET /tree ${res.status}`);
    return res.json();
  }

  async function loadList() {
    buildCrumbs();
    els.preview.innerHTML = `<div class="preview-empty">Выберите файл, чтобы увидеть превью</div>`;

    const data = await apiGet(cwd);
    lastListing = data;

    els.listing.innerHTML = '';

    // папки
    data.folders.forEach(name => {
      const card = document.createElement('div');
      card.className = 'admin-card';
      card.onclick = () => { cwd.push(name); loadList(); };
      card.innerHTML = `
        <div class="thumb" style="background-image: url('img/no-image.jpg')"></div>
        <div class="meta"><span class="name">${name}</span><span class="badge">папка</span></div>
      `;
      els.listing.appendChild(card);
    });

    // файлы
    data.files.forEach(name => {
      const filePath = `img/1_PORTFOLIO/${joinPath([...cwd, name])}`;
      const card = document.createElement('div');
      card.className = 'admin-card';
      card.onclick = () => previewFile(name);

      const thumbStyle = isImage(name)
        ? `background-image: url('${filePath}')`
        : `background-image: url('img/no-image.jpg')`;

      card.innerHTML = `
        <div class="thumb" style="${thumbStyle}"></div>
        <div class="meta"><span class="name">${name}</span><span class="badge">файл</span></div>
      `;
      els.listing.appendChild(card);
    });
  }

  function previewFile(name) {
    const filePath = `img/1_PORTFOLIO/${joinPath([...cwd, name])}`;
    if (isImage(name)) {
      els.preview.innerHTML = `<img src="${filePath}" alt="${name}" style="max-width:100%; height:auto; display:block;" />`;
    } else if (isVideo(name)) {
      els.preview.innerHTML = `<video src="${filePath}" controls style="max-width:100%; display:block;"></video>`;
    } else {
      els.preview.innerHTML = `<div class="preview-empty">Превью не доступно. Файл: ${name}</div>`;
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
  try {
    const name = els.mkdirName.value.trim(); // твой input для имени папки
    if (!name) return alert('Введите имя папки');

    // текущий путь (cwd) — зависит от твоей логики; убедись, что joinPath(cwd) даёт нужную строку
    const relPath = joinPath(cwd); // если у тебя нет joinPath — используй просто '' или нужный rel

    const res = await fetch(`${API.base}/mkdir`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...API.headers()
      },
      body: JSON.stringify({ path: relPath, name })
    });

    // для отладки полезно распечатать ответ:
    let json;
    try { json = await res.json(); } catch(e){ json = null; }

    if (!res.ok) {
      console.error('mkdir failed', res.status, json);
      return alert('Ошибка создания папки: ' + (json && json.error ? json.error : res.status));
    }

    els.mkdirName.value = '';
    await loadList(); // обновляем список
  } catch (err) {
    console.error('doMkdir error', err);
    alert('Ошибка создания папки (см. консоль)');
  }
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

  // init
  function bind() {
    setKeyFromStorage();
    els.saveKey.addEventListener('click', () => {
      localStorage.setItem('admKey', els.key.value.trim());
      alert('API key сохранён');
    });

    els.rebuild.addEventListener('click', doRebuild);
    els.refresh.addEventListener('click', loadList);

    els.btnMkdir.addEventListener('click', doMkdir);
    els.btnUpload.addEventListener('click', doUpload);
    els.btnRename.addEventListener('click', doRename);
    els.btnDelete.addEventListener('click', doDelete);
  }

  bind();
  loadList().catch(err => console.error(err));
})();
