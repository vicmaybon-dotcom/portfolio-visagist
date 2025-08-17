const fs = require("fs");
const path = require("path");

// Путь к папке с фото
const basePath = path.join(__dirname, "img", "1_PORTFOLIO");
const outputFile = path.join(__dirname, "data", "portfolio.json");

function buildStructure(dirPath) {
  const result = {};
  const items = fs.readdirSync(dirPath);

  items.forEach((item) => {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      result[item] = buildStructure(fullPath);
    } else if (/\.(jpg|jpeg|png|mp4)$/i.test(item)) {
      if (!result.__files__) result.__files__ = [];
      result.__files__.push(item);
    }
  });

  // Если в папке только файлы, возвращаем массив
  if (Object.keys(result).length === 1 && result.__files__) {
    return result.__files__;
  }

  return result;
}

// Генерация JSON
const portfolioData = buildStructure(basePath);

// Сохраняем файл
fs.writeFileSync(outputFile, JSON.stringify(portfolioData, null, 2), "utf8");

console.log(`✅ JSON создан: ${outputFile}`);
