// js/admin-dev.js
(() => {
  const els = {
    key: document.getElementById('admKey'),
    reload: document.getElementById('reload'),
    goRoot: document.getElementById('goRoot'),
    crumbs: document.getElementById('crumbs'),
    listing: document.getElementById('listing'),
    currentPath: document.getElementById('currentPath'),

    newFolderName: document.getElementById('newFolderName'),
    createFolder: document.getElementById('createFolder'),

    uploadFile: document.getElementById('uploadFile'),
    uploadBtn: document.getElementById('uploadBtn'),

    oldName: document.getElementById('oldName'),
    newName: document.getElementById('newName'),
    renameType: document.getElementById('renameType'),
    renameBtn: document.getElementById('renameBtn'),

    deleteType: document.getElementById('deleteType'),
    deleteName: document.getElementById('deleteName'),
    deleteBtn: document.getElementById('deleteBtn'),
  };

  const API = {
    base: '/api',
    headers: () => els.key.value ? { 'x-admin-key': els.key.value } : {}
  };

  let cwd = [];

  const joinPath = (arr) => arr.join('/');
  const enc = (s) => encodeURIComponent(s);

  function crumbs() {
    els.crumbs.innerHTML = '';
    const root = document.createElement('a');
    root.textContent = '/';
    root.href = '#';
    root.onclick = (e) => { e.preventDefault(); cwd = []; load(); };
    els.crumbs.appendChild(root);

    cwd.forEach((seg, idx) => {
      const sep = document.createElement('span');
      sep.textContent = ' / ';
      els.crumbs.appendChild(sep);

      const a = document.createElement('a');
      a.textContent = seg;
      a.href = '#';
      a.onclick = (e) => { e.preventDefault(); cwd = cwd.slice(0, idx + 1); load(); };
      els.crumbs.appendChild(a);
    });

    els.currentPath.textContent = `/${joinPath(cwd)}`;
  }

  async function load() {
    crumbs();
    const res = await fetch(`${API.base}/tree?path=${enc(joinPath(cwd))}`, { headers: API.headers() });
    if (!res.ok) { els.listing.textContent = 'Ошибка загрузки'; return; }
    const data = await res.json();

    els.listing.innerHTML = '';
    data.folders.forEach(f => {
      const a = document.createElement('a');
      a.href = '#';
      a.textContent = `[DIR] ${f}`;
      a.onclick = (e) => { e.preventDefault(); cwd.push(f); load(); };
      els.listing.appendChild(a);
      els.listing.appendChild(document.createElement('br'));
    });
    data.files.forEach(f => {
      const span = document.createElement('span');
      span.textContent = f;
      els.listing.appendChild(span);
      els.listing.appendChild(document.createElement('br'));
    });
  }

  els.reload.addEventListener('click', async () => {
    const res = await fetch(`${API.base}/rebuild`, { method: 'POST', headers: API.headers() });
    alert(res.ok ? 'JSON пересобран' : 'Ошибка пересборки');
  });

  els.goRoot.addEventListener('click', () => { cwd = []; load(); });

  els.createFolder.addEventListener('click', async () => {
    const name = els.newFolderName.value.trim();
    if (!name) return;
    const res = await fetch(`${API.base}/mkdir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...API.headers() },
      body: JSON.stringify({ path: joinPath(cwd), name })
    });
    alert(res.ok ? 'Папка создана' : 'Ошибка');
    els.newFolderName.value = '';
    load();
  });

  els.uploadBtn.addEventListener('click', async () => {
    const f = els.uploadFile.files && els.uploadFile.files[0];
    if (!f) return;
    const fd = new FormData();
    fd.append('file', f);
    fd.append('path', joinPath(cwd));
    const res = await fetch(`${API.base}/upload`, { method: 'POST', headers: API.headers(), body: fd });
    alert(res.ok ? 'OK' : 'Ошибка');
    els.uploadFile.value = '';
    load();
  });

  els.renameBtn.addEventListener('click', async () => {
    const oldName = els.oldName.value.trim();
    const newName = els.newName.value.trim();
    if (!oldName || !newName) return;
    const type = els.renameType.value;
    const res = await fetch(`${API.base}/rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...API.headers() },
      body: JSON.stringify({ path: joinPath(cwd), type, oldName, newName })
    });
    alert(res.ok ? 'OK' : 'Ошибка');
    els.oldName.value = '';
    els.newName.value = '';
    load();
  });

  els.deleteBtn.addEventListener('click', async () => {
    const name = els.deleteName.value.trim();
    if (!name) return;
    const type = els.deleteType.value;
    const res = await fetch(`${API.base}/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...API.headers() },
      body: JSON.stringify({ path: joinPath(cwd), type, name })
    });
    alert(res.ok ? 'OK' : 'Ошибка');
    els.deleteName.value = '';
    load();
  });

  load();
})();
