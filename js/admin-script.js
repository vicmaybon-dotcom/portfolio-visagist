// admin-script.js

// ==== Toast Notifications ====
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  // плавное появление
  setTimeout(() => toast.classList.add("show"), 10);

  // исчезновение через 3 секунды
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Панель управления портфолио (CRUD + пересборка JSON)

// ==== Elements ====
const els = {
  rebuild: document.getElementById('btnRebuild'),       // "Сохранить изменения"
  crumbs: document.getElementById('breadcrumbs'),       // хлебные крошки
  listing: document.getElementById('content'),          // сетка портфолио
  viewer: document.getElementById('adminViewer'),       // просмотрщик
  preview: document.getElementById('portfolio-container'),

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

  logout: document.getElementById('logoutBtn'),
};

// ==== State ====
let currentPath = ["portfolio"];

// ==== Helpers ====

// POST-запрос с JSON
async function apiPost(url, data) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

// Обертка: выполняет действие, логирует и обновляет UI
async function safeAction(label, fn) {
  try {
    const result = await fn();
    console.log(`✅ ${label} успешно:`, result);
    showToast(`${label}: выполнено`, "success");
    if (typeof renderPortfolio === "function") {
      await renderPortfolio();
    }
  } catch (err) {
    console.error(`❌ ${label} ошибка:`, err);
    showToast(`${label}: ошибка`, "error");
  }
}


// ==== Operations ====

// Пересобрать JSON
async function doRebuild() {
  await safeAction("Пересборка JSON", async () => {
    const res = await fetch(`/api/rebuild`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

// ==== Event Listeners ====
document.addEventListener("DOMContentLoaded", () => {

  // Создать папку
  els.btnMkdir?.addEventListener("click", () => {
    const name = els.mkdirName.value.trim();
    if (!name) return alert("Введите название папки");
    safeAction("Создание папки", () =>
      apiPost("/api/mkdir", { path: currentPath, name })
    );
  });

  // Загрузить файл
  els.btnUpload?.addEventListener("click", () => {
    if (!els.fileInput.files.length) return alert("Выберите файл");

    const formData = new FormData();
    formData.append("path", currentPath.join("/"));
    formData.append("file", els.fileInput.files[0]);

    safeAction("Загрузка файла", async () => {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });
  });

  // Переименовать
  els.btnRename?.addEventListener("click", () => {
    const type = els.renameType.value;
    const oldName = els.renameOld.value.trim();
    const newName = els.renameNew.value.trim();
    if (!oldName || !newName) return alert("Заполните оба поля");

    safeAction("Переименование", () =>
      apiPost("/api/rename", { path: currentPath, type, oldName, newName })
    );
  });

  // Удалить
  els.btnDelete?.addEventListener("click", () => {
    const type = els.deleteType.value;
    const name = els.deleteName.value.trim();
    if (!name) return alert("Введите имя");

    safeAction("Удаление", () =>
      apiPost("/api/delete", { path: currentPath, type, name })
    );
  });

  // Пересобрать JSON
  els.rebuild?.addEventListener("click", doRebuild);

  // Выйти
  els.logout?.addEventListener("click", () => {
    console.log("🚪 Выход из админки");
    window.location.href = "portfolio.html";
  });
});
