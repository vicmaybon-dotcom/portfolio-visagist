// js/admin-ui.js

document.addEventListener("DOMContentLoaded", () => {
    // создать папку
    document.getElementById("btnMkdir").addEventListener("click", async () => {
      const name = document.getElementById("mkdirName").value.trim();
      if (!name) return alert("Введите название папки!");
      await createFolder(name);
    });
  
    // загрузить файл
    document.getElementById("btnUpload").addEventListener("click", async () => {
      const fileInput = document.getElementById("fileInput");
      if (!fileInput.files.length) return alert("Выберите файл!");
      await uploadFile(fileInput.files[0]);
    });
  
    // переименовать
    document.getElementById("btnRename").addEventListener("click", async () => {
      // Убрали строку: const type = document.getElementById("renameType").value;
      const oldName = document.getElementById("renameOld").value.trim();
      const newName = document.getElementById("renameNew").value.trim();
      if (!oldName || !newName) return alert("Укажите имена!");
      await renameItem(oldName, newName); // <-- Передаём только 2 аргумента
  });
  
    // удалить
    document.getElementById("btnDelete").addEventListener("click", async () => {
      // Убрали строку: const type = document.getElementById("deleteType").value;
      const name = document.getElementById("deleteName").value.trim();
      if (!name) return alert("Введите имя для удаления!");
      await deleteItem(name); // <-- Передаём только 1 аргумент
  });
  
  // восстановить
  document.getElementById("btnRestore").addEventListener("click", async () => {
    await restoreItem();
});


  });
  