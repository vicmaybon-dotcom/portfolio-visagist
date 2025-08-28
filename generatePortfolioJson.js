// generatePortfolioJson.js
import fs from "fs";
import path from "path";

const uploadsDir = path.join(process.cwd(), "uploads");
const outputJson = path.join(process.cwd(), "data", "portfolio.json");

// Список папок/файлов, которые исключаем
const EXCLUDE = ["tmp", "_tmp", ".git", ".DS_Store"];

function walkDir(dir, baseUrl = "") {
  const result = [];

  for (const item of fs.readdirSync(dir)) {
    // 🚫 пропускаем системные и скрытые
    if (EXCLUDE.includes(item) || item.startsWith(".")) continue;

    const fullPath = path.join(dir, item);
    const relPath = path.join(baseUrl, item);

    try {
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Папка → всегда children:[]
        result.push({
          type: "folder",
          name: item,
          path: relPath.replace(/\\/g, "/"),
          children: walkDir(fullPath, relPath) || [], // ✅ всегда массив
        });
      } else {
        // Файл → никогда children
        result.push({
          type: "file",
          name: item,
          path: relPath.replace(/\\/g, "/"),
        });
      }
    } catch (e) {
      console.warn(`⚠️ Ошибка при чтении ${fullPath}:`, e.message);
    }
  }

  return result;
}

export function generatePortfolioJson() {
  if (!fs.existsSync(uploadsDir)) {
    console.error("❌ Папка uploads не найдена");
    return;
  }

  const tree = walkDir(uploadsDir);
  console.log("📦 Сгенерировано объектов:", tree.length);

  try {
    const jsonData = JSON.stringify(tree, null, 2);
    fs.mkdirSync(path.dirname(outputJson), { recursive: true });
    fs.writeFileSync(outputJson, jsonData, "utf-8");

    // 🔍 проверка на валидность
    JSON.parse(fs.readFileSync(outputJson, "utf-8"));

    console.log(`✅ portfolio.json обновлён: ${outputJson}`);
  } catch (e) {
    console.error("❌ Ошибка при сохранении portfolio.json:", e.message);
  }
}
