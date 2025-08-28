// js/admin-actions.js

function getCurrentPath() {
    const params = new URLSearchParams(window.location.search);
    const path = [];
    if (params.get("category")) path.push(params.get("category"));
    let i = 1;
    while (params.get("subcategory" + i)) {
      path.push(params.get("subcategory" + i));
      i++;
    }
    return path.join("/"); // например: "Portrait/Classic"
  }
  
  async function handleResponse(res) {
    if (!res.ok) {
      let msg = "";
      try { msg = await res.text(); } catch (_) {}
      throw new Error(`HTTP ${res.status}${msg ? `: ${msg}` : ""}`);
    }
    try {
      return await res.json();
    } catch {
      return {}; // на всякий, если бэкенд вернул пусто
    }

  }
  
  // === СОЗДАТЬ ПАПКУ (в текущей папке) ===
  async function createFolder(folderName) {
    const name = (folderName || "").trim();
    if (!name) { alert("Введите имя папки"); return; }
  
    const basePath = getCurrentPath();
    const folderPath = basePath ? `${basePath}/${name}` : name;
  
    try {
      const res = await fetch("/create-folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderPath }),
      });
      await handleResponse(res);
      await renderPortfolio();               // 🔄 перерисовать сразу
    } catch (e) {
      console.error(e);
      alert("Не удалось создать папку: " + e.message);
    }
  }
  
  // === ЗАГРУЗИТЬ ФАЙЛ (в текущую папку) ===
  async function uploadFile(file) {
    const formData = new FormData();
  
    // 📌 сначала путь
    const folderPath = getCurrentPath();
    formData.append("folderPath", folderPath);
  
    // 📌 потом сам файл
    formData.append("file", file);
  
    const res = await fetch("/upload-file", {
      method: "POST",
      body: formData,
    });
  
    const result = await handleResponse(res);
    await renderPortfolio(); // 🔄 перерисовать
    return result;
  }
  
  // === ПЕРЕИМЕНОВАТЬ (в текущей папке) ===
  async function renameItem(oldName, newName) {
    if (!oldName || !newName) {
      alert("Введите старое и новое имя");
      return;
    }
   // 🚩 НОВАЯ ПРОВЕРКА: Добавляем расширение, если его нет
   const oldExt = oldName.split('.').pop(); // Получаем расширение старого файла
   if (oldExt && newName.indexOf('.') === -1) {
       newName += '.' + oldExt; // Добавляем расширение к новому имени
   }

    const folderPath = getCurrentPath(); // в какой папке мы находимся
    const oldPath = folderPath ? folderPath + "/" + oldName : oldName;
    const newPath = folderPath ? folderPath + "/" + newName : newName;
  
    const res = await fetch("/rename", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPath, newPath }),
    });
  
    await handleResponse(res);
    await renderPortfolio(); // 🔄 обновляем список
  }
  
  // === УДАЛИТЬ (из текущей папки) ===
  async function deleteItem(name) {
    const basePath = getCurrentPath();
    const targetPath = basePath ? `${basePath}/${name}` : name;

    try {
        const res = await fetch("/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetPath }),
        });
        await handleResponse(res);
        await renderPortfolio();

        // 📌 Сохраняем информацию о последнем удалённом элементе
        lastDeletedItem = {
            name: name,
            path: targetPath,
            basePath: basePath
        };

        alert("Элемент успешно удалён. Вы можете восстановить его.");
    } catch (e) {
        console.error(e);
        alert("Не удалось удалить элемент: " + e.message);
    }
}
  
// === ВОССТАНОВИТЬ ПОСЛЕДНИЙ УДАЛЁННЫЙ ЭЛЕМЕНТ ===
async function restoreItem() {
  if (!lastDeletedItem) {
      alert("Нет элементов для восстановления.");
      return;
  }

  try {
      const res = await fetch("/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetPath: lastDeletedItem.path }),
      });
      await handleResponse(res);
      await renderPortfolio();
      alert("Элемент '" + lastDeletedItem.name + "' успешно восстановлен.");

      // Сбрасываем переменную, чтобы нельзя было восстановить повторно
      lastDeletedItem = null;
  } catch (e) {
      console.error(e);
      alert("Не удалось восстановить элемент: " + e.message);
  }
}


  