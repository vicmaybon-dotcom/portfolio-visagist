// generatePortfolioJson.js
const fs = require('fs');
const path = require('path');

const portfolioDir = path.join(__dirname, 'img', '1_PORTFOLIO');
const outputJson = path.join(__dirname, 'data', 'portfolio.json');
const exts = new Set(['.jpg','.jpeg','.png','.webp','.gif','.mp4','.mov','.webm']);

function isMedia(name){ return exts.has(path.extname(name).toLowerCase()); }

function buildNode(dir) {
  const node = {};
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    if (e.isDirectory()) {
      node[e.name] = buildNode(path.join(dir, e.name));
    } else if (isMedia(e.name)) {
      files.push(e.name);
    }
  }
  node.__files__ = files;
  return node;
}

const tree = buildNode(portfolioDir);
fs.writeFileSync(outputJson, JSON.stringify(tree, null, 2), 'utf8');
console.log('✅ portfolio.json создан:', outputJson);
