// server.js (ESM)
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import cors from "cors";
import swaggerUi from "swagger-ui-express";

import { generatePortfolioJson } from "./generatePortfolioJson.js";

const swaggerPath = path.join(process.cwd(), "docs", "swagger.json");
const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, "utf-8"));


const app = express();
const PORT = process.env.PORT || 4000;

// абсолютные пути
const __dirname = path.resolve();
const ROOT_DIR = __dirname;
const UPLOADS_DIR = path.join(__dirname, "uploads");
const TRASH_DIR = path.join(__dirname, "trash"); // 📌 Новая переменная

// ensure uploads/trash exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log("📁 Создана папка uploads");
}
if (!fs.existsSync(TRASH_DIR)) {
  fs.mkdirSync(TRASH_DIR, { recursive: true });
  console.log("📁 Создана папка trash");
}

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(ROOT_DIR)); // раздаём index.html, admin-portfolio.html, css, js, ...

// === helpers ===
function safeJoin(base, targetRel = "") {
  const target = targetRel ? path.join(base, targetRel) : base;
  const resolved = path.normalize(target);
  const baseWithSep = base.endsWith(path.sep) ? base : base + path.sep;
  if (resolved !== base && !resolved.startsWith(baseWithSep)) {
    throw new Error("Invalid path");
  }
  return resolved;
}
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// === multer storage ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR); // временно в корень, перенесём вручную
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

// === API ===

// создать папку
app.post("/create-folder", (req, res) => {
  try {
    const { folderPath } = req.body;
    if (!folderPath || typeof folderPath !== "string") {
      return res.status(400).send("folderPath обязателен");
    }
    const full = safeJoin(UPLOADS_DIR, folderPath);
    ensureDir(full);

    generatePortfolioJson(); // 🔄 автогенерация

    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).send("Не удалось создать папку");
  }
});

// загрузить файл
app.post("/upload-file", (req, res) => {
  upload.single("file")(req, res, function (err) {
    if (err) {
      console.error(err);
      return res.status(500).send("Ошибка загрузки");
    }
    if (!req.file) return res.status(400).send("Файл не получен");

    const folderPath = req.body.folderPath || "";
    const targetDir = safeJoin(UPLOADS_DIR, folderPath);
    ensureDir(targetDir);

    const targetPath = path.join(targetDir, req.file.originalname);
    fs.renameSync(req.file.path, targetPath);

    console.log(`✅ Загружен файл: ${req.file.originalname}`);
    console.log(`📂 Папка назначения: ${folderPath || "(корень)"}`);

    generatePortfolioJson(); // 🔄 автогенерация

    return res.json({ success: true, filename: req.file.originalname });
  });
});

// переименовать
app.post(["/api/rename", "/rename"], (req, res) => {
  try {
    const { oldPath, newPath } = req.body || {};
    console.log("🔁 RENAME body:", req.body);
    if (!oldPath || !newPath) return res.status(400).send("Нужно oldPath и newPath");

    const from = safeJoin(UPLOADS_DIR, oldPath);
    const to = safeJoin(UPLOADS_DIR, newPath);
    if (!fs.existsSync(from)) return res.status(404).send("Источник не найден");

    ensureDir(path.dirname(to));
    fs.renameSync(from, to);

    generatePortfolioJson(); // 🔄
    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).send("Не удалось переименовать");
  }
});

// удалить
app.post(["/api/delete", "/delete"], (req, res) => {
  try {
    const { targetPath } = req.body || {};
    console.log("🗑 DELETE body:", req.body);
    if (!targetPath) return res.status(400).send("Нужно targetPath");

    const full = safeJoin(UPLOADS_DIR, targetPath);
    if (!fs.existsSync(full)) return res.status(404).send("Не найдено");

    const trashPath = path.join(TRASH_DIR, path.basename(full));
    const oldDir = path.dirname(full);

    fs.renameSync(full, trashPath);

    const metadataPath = path.join(TRASH_DIR, `${path.basename(full)}.json`);
    fs.writeFileSync(metadataPath, JSON.stringify({ oldPath: oldDir }));

    generatePortfolioJson(); // 🔄
    return res.json({ success: true, targetPath });
  } catch (e) {
    console.error(e);
    return res.status(500).send("Не удалось удалить");
  }
});

// восстановить
app.post("/restore", (req, res) => {
  try {
    const { targetPath } = req.body || {};
    if (!targetPath) return res.status(400).send("Нужно targetPath");

    const trashFilePath = path.join(TRASH_DIR, path.basename(targetPath));
    const metadataPath = path.join(TRASH_DIR, `${path.basename(targetPath)}.json`);

    if (!fs.existsSync(trashFilePath)) {
      return res.status(404).send("Файл не найден в корзине");
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
    const oldPath = metadata.oldPath;

    const restorePath = path.join(oldPath, path.basename(trashFilePath));
    fs.renameSync(trashFilePath, restorePath);

    fs.unlinkSync(metadataPath);

    generatePortfolioJson(); // 🔄
    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).send("Не удалось восстановить");
  }
});

// === Очистка корзины ===
app.post("/clear-trash", (req, res) => {
  lastDeletedItem = null;
  res.json({ success: true, message: "Корзина очищена" });
});


// ручной rebuild
app.post("/save", (req, res) => {
  try {
    generatePortfolioJson();
    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).send("Не удалось перегенерировать JSON");
  }
});

// 📑 Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// стартуем сервер
app.listen(PORT, () => {
  console.log(`✅ Admin server running at http://localhost:${PORT}`);
  console.log(`📑 Swagger docs: http://localhost:${PORT}/api-docs`);
});
