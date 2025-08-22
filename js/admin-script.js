// admin-script.js

async function apiRequest(url, data) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  }
  
  // === Привязка кнопок ===
  document.addEventListener("DOMContentLoaded", () => {
    // Создать папку
    document.getElementById("btnMkdir").addEventListener("click", async () => {
      const name = document.getElementById("mkdirName").value.trim();
      if (!name) return alert("Введите название папки");
  
      await apiRequest("/api/mkdir", { path: currentPath, name });
      await renderPortfolio();
    });
  
    // Загрузить файл
    document.getElementById("btnUpload").addEventListener("click", async () => {
      const input = document.getElementById("fileInput");
      if (!input.files.length) return alert("Выберите файл");
  
      const formData = new FormData();
      formData.append("path", currentPath.join("/"));
      formData.append("file", input.files[0]);
  
      await fetch("/api/upload", { method: "POST", body: formData });
      await renderPortfolio();
    });
  
    // Переименовать
    document.getElementById("btnRename").addEventListener("click", async () => {
      const type = document.getElementById("renameType").value;
      const oldName = document.getElementById("renameOld").value.trim();
      const newName = document.getElementById("renameNew").value.trim();
      if (!oldName || !newName) return alert("Заполните оба поля");
  
      await apiRequest("/api/rename", { path: currentPath, type, oldName, newName });
      await renderPortfolio();
    });
  
    // Удалить
    document.getElementById("btnDelete").addEventListener("click", async () => {
      const type = document.getElementById("deleteType").value;
      const name = document.getElementById("deleteName").value.trim();
      if (!name) return alert("Введите имя");
  
      await apiRequest("/api/delete", { path: currentPath, type, name });
      await renderPortfolio();
    });
  
    // Сохранить JSON
    document.getElementById("btnRebuild").addEventListener("click", async () => {
      await apiRequest("/api/rebuild", {});
      alert("Изменения сохранены!");
      await renderPortfolio();
    });
  
    // Выйти
    document.getElementById("logoutBtn").addEventListener("click", async () => {
      await apiRequest("/api/logout", {});
      window.location.href = "index.html";
    });
  });
  