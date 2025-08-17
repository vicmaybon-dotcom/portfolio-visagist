// generatePortfolioJson.js
const fs = require('fs');
const path = require('path');

const portfolioDir = path.join(__dirname, 'img', '1_PORTFOLIO');
const outputJson = path.join(__dirname, 'data', 'portfolio.json');

function buildTree(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });

  const files = [];
  const tree = {};

  items.forEach(item => {
    if (item.isDirectory()) {
      tree[item.name] = buildTree(path.join(dir, item.name));
    } else {
      const ext = item.name.split('.').pop().toLowerCase();
      if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'mov', 'webm'].includes(ext)) {
        files.push(item.name);
      }
    }
  });

  tree.__files__ = files;
  return tree;
}

const jsonData = buildTree(portfolioDir);
fs.writeFileSync(outputJson, JSON.stringify(jsonData, null, 2), 'utf-8');
console.log('✅ portfolio.json создан:', outputJson);
