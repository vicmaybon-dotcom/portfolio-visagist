// validatePortfolio.js
import fs from "fs";
import path from "path";

const portfolioJson = path.join(process.cwd(), "data", "portfolio.json");

try {
  const raw = fs.readFileSync(portfolioJson, "utf-8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error("Корневой элемент должен быть массивом");
  }

  console.log("✅ JSON валиден. Элементов в корне:", parsed.length);
} catch (e) {
  console.error("❌ Ошибка в portfolio.json:", e.message);
}
