// server.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const multer = require('multer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// === CONFIG ===
const PUBLIC_DIR    = path.join(__dirname); // сайт (html, css, js)
const UPLOADS_DIR   = path.join(__dirname, 'uploads');
const { mediaDir, mediaUrl } = require('./config');
const PORTFOLIO_DIR = path.join(__dirname, mediaDir);

const DATA_DIR      = path.join(__dirname, 'data');
const JSON_FILE     = path.join(DATA_DIR, 'portfolio.json');

// создаём папки, если их нет
if (!fs.existsSync(PORTFOLIO_DIR)) fs.mkdirSync(PORTFOLIO_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const ADMIN_KEY = process.env.ADMIN_KEY || 'change-me';

// === AUTH MIDDLEWARE ===
function requireKey(req, res, next) {
  const k = req.header('x-admin-key') || '';
  if (k !== ADMIN_KEY) return res.status(401).json({ error: 'unauthorized' });
  next();
}

// === STATIC ===
// Раздаём сайт (HTML, CSS, JS)
app.use(express.static(PUBLIC_DIR));

// Раздаём папку uploads (все медиа)
app.use('/uploads', express.static(UPLOADS_DIR));

// Раздаём медиа
app.use(mediaUrl, express.static(PORTFOLIO_DIR));

// Раздаём данные (portfolio.json)
app.use('/data', express.static(DATA_DIR));

// === UPLOADS ===
const upload = multer({ dest: path.join(__dirname, '.upload_tmp') });

// === HELPERS ===
const MEDIA_EXT = new Set(['.jpg','.jpeg','.png','.webp','.gif','.mp4','.mov','.webm']);
function isMedia(name) {
  return MEDIA_EXT.has(path.extname(name).toLowerCase());
}

async function listDir(rel) {
  const abs = path.join(PORTFOLIO_DIR, rel || '');
  const items = await fsp.readdir(abs, { withFileTypes: true });
  const folders = [];
  const files = [];
  for (const it of items) {
    if (it.isDirectory()) folders.push(it.name);
    else if (isMedia(it.name)) files.push(it.name);
  }
  folders.sort((a,b)=>a.localeCompare(b));
  files.sort((a,b)=>a.localeCompare(b));
  return { folders, files };
}

function normalizeName(name) {
  return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '').trim();
}

// Рекурсивная сборка дерева
function buildTreeSync(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const node = {};
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      node[e.name] = buildTreeSync(full);
    } else if (isMedia(e.name)) {
      files.push(e.name);
    }
  }
  node.__files__ = files;
  return node;
}

// === API ===
app.get('/api/tree', async (req, res) => {
  try {
    const rel = req.query.path || '';
    const data = await listDir(rel);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// === Создать папку ===
app.post('/api/mkdir', requireKey, async (req, res) => {
  try {
    const relPath = req.body.path || '';
    const name = req.body.name || '';
    if (!name.trim()) return res.status(400).json({ error: 'bad name' });

    const safeName = normalizeName(name);
    const abs = path.join(PORTFOLIO_DIR, relPath, safeName);

    await fsp.mkdir(abs, { recursive: true });
    res.json({ ok: true, created: path.join(relPath, safeName) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// === Загрузка файла ===
app.post('/api/upload', requireKey, upload.single('file'), async (req, res) => {
  try {
    const rel = req.body.path || '';
    if (!req.file) return res.status(400).json({ error: 'no file' });
    const orig = normalizeName(req.file.originalname);
    const target = path.join(PORTFOLIO_DIR, rel, orig);
    await fsp.rename(req.file.path, target);
    res.json({ ok: true, name: orig });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// === Переименование ===
app.post('/api/rename', requireKey, async (req, res) => {
  try {
    const { path: rel='', oldName, newName } = req.body;
    if (!oldName || !newName) return res.status(400).json({ error: 'bad names' });
    const oldAbs = path.join(PORTFOLIO_DIR, rel, oldName);
    const newAbs = path.join(PORTFOLIO_DIR, rel, normalizeName(newName));
    await fsp.rename(oldAbs, newAbs);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// === Удаление ===
async function rimraf(p) {
  if (!fs.existsSync(p)) return;
  const stat = await fsp.lstat(p);
  if (stat.isDirectory()) {
    const items = await fsp.readdir(p);
    for (const it of items) await rimraf(path.join(p, it));
    await fsp.rmdir(p);
  } else {
    await fsp.unlink(p);
  }
}

app.post('/api/delete', requireKey, async (req, res) => {
  try {
    const { path: rel='', name } = req.body;
    if (!name) return res.status(400).json({ error: 'bad name' });
    const abs = path.join(PORTFOLIO_DIR, rel, name);
    await rimraf(abs);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// === Пересборка JSON ===
app.post('/api/rebuild', requireKey, async (req, res) => {
  try {
    const tree = buildTreeSync(PORTFOLIO_DIR);
    fs.writeFileSync(JSON_FILE, JSON.stringify(tree, null, 2), 'utf8');
    res.json({ ok: true, file: JSON_FILE });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
// === Swagger ===
const swaggerUi = require('swagger-ui-express');
const swaggerDoc = {
  openapi: '3.0.0',
  info: { title: 'Portfolio Admin API', version: '1.0.0' },
  servers: [
    { url: process.env.BASE_URL || 'http://localhost:3000' }
  ],
  paths: {
    '/api/tree': {
      get: {
        summary: 'Список папок и файлов',
        responses: {
          200: {
            description: 'JSON со структурой папок/файлов',
            content: { 'application/json': { schema: { type: 'object' } } }
          }
        }
      }
    },
    '/api/mkdir': {
      post: {
        summary: 'Создать папку',
        security: [{ AdminKey: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { path: { type: 'string', example: 'new_folder' } }
              }
            }
          }
        },
        responses: {
          200: { description: 'Папка создана' },
          401: { description: 'Не авторизован' }
        }
      }
    },
    '/api/upload': {
      post: {
        summary: 'Загрузить файл',
        security: [{ AdminKey: [] }],
        responses: {
          200: { description: 'Файл загружен' },
          401: { description: 'Не авторизован' }
        }
      }
    },
    '/api/rename': {
      post: {
        summary: 'Переименовать файл/папку',
        security: [{ AdminKey: [] }],
        responses: {
          200: { description: 'Переименовано' },
          401: { description: 'Не авторизован' }
        }
      }
    },
    '/api/delete': {
      post: {
        summary: 'Удалить файл/папку',
        security: [{ AdminKey: [] }],
        responses: {
          200: { description: 'Удалено' },
          401: { description: 'Не авторизован' }
        }
      }
    },
    '/api/rebuild': {
      post: {
        summary: 'Пересобрать portfolio.json',
        security: [{ AdminKey: [] }],
        responses: {
          200: { description: 'Файл пересобран' },
          401: { description: 'Не авторизован' }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      AdminKey: { type: 'apiKey', in: 'header', name: 'x-admin-key' }
    }
  },
  security: [{ AdminKey: [] }]
};

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));



app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// === START ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server http://localhost:${PORT}`);
  console.log(`Admin key: ${ADMIN_KEY === 'change-me' ? '(не задан, используйте change-me)' : '(задан через ENV)'}`);
});