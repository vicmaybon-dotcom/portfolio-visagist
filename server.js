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
const PUBLIC_DIR    = path.join(__dirname);
const PORTFOLIO_DIR = path.join(__dirname, 'img', '1_PORTFOLIO');
const DATA_DIR      = path.join(__dirname, 'data');
const JSON_FILE     = path.join(DATA_DIR, 'portfolio.json');

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
// Раздаём HTML, CSS, JS (корень проекта)
app.use(express.static(PUBLIC_DIR));

// Раздаём портфолио (картинки)
app.use('/img', express.static(path.join(__dirname, 'img')));

// Раздаём данные (portfolio.json)
app.use('/data', express.static(path.join(__dirname, 'data')));

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
    const relPath = req.body.path || ''; // полный путь, например: "Portrait/NewFolder"
    if (!relPath.trim()) return res.status(400).json({ error: 'bad path' });

    const safePath = normalizeName(relPath); 
    const abs = path.join(PORTFOLIO_DIR, safePath);

    await fsp.mkdir(abs, { recursive: true });
    res.json({ ok: true, created: relPath });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


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
  paths: {
    '/api/tree': {
      get: {
        summary: 'Список папок и файлов',
        parameters: [
          { name: 'path', in: 'query', schema: { type: 'string' }, required: false }
        ],
        responses: { 200: { description: 'OK' } }
      }
    },

    '/api/mkdir': {
      post: {
        summary: 'Создать папку',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  path: { type: 'string', example: 'Portrait' },
                  name: { type: 'string', example: 'NewFolder' }
                },
                required: ['name']
              }
            }
          }
        },
        responses: { 200: { description: 'OK' } }
      }
    },

    '/api/upload': {
      post: {
        summary: 'Загрузить файл',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  path: { type: 'string', example: 'Portrait/NewFolder' },
                  file: { type: 'string', format: 'binary' }
                },
                required: ['file']
              }
            }
          }
        },
        responses: { 200: { description: 'OK' } }
      }
    },

    '/api/rename': {
      post: {
        summary: 'Переименовать файл/папку',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  path: { type: 'string', example: 'Portrait' },
                  oldName: { type: 'string', example: 'OldFile.jpg' },
                  newName: { type: 'string', example: 'NewFile.jpg' }
                },
                required: ['oldName','newName']
              }
            }
          }
        },
        responses: { 200: { description: 'OK' } }
      }
    },

    '/api/delete': {
      post: {
        summary: 'Удалить файл/папку',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  path: { type: 'string', example: 'Portrait' },
                  name: { type: 'string', example: 'FileToDelete.jpg' }
                },
                required: ['name']
              }
            }
          }
        },
        responses: { 200: { description: 'OK' } }
      }
    },

    '/api/rebuild': {
      post: {
        summary: 'Пересобрать portfolio.json',
        responses: { 200: { description: 'OK' } }
      }
    },
  },
  components: {
    securitySchemes: {
      AdminKey: { type: 'apiKey', in: 'header', name: 'x-admin-key' }
    }
  },
  security: [{ AdminKey: [] }]
};

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server http://localhost:${PORT}`);
  console.log(`Admin key: ${ADMIN_KEY === 'change-me' ? '(не задан, используйте change-me)' : '(задан через ENV)'}`);
});
