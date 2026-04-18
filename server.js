const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use(express.json());

function loadData(file) {
  return JSON.parse(fs.readFileSync(`./data/${file}`, 'utf-8'));
}

// ROUTES

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/home.html'));
});

app.get('/category/:type', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/category.html'));
});

app.get('/detail/:type/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/detail.html'));
});

// SEARCH API
app.get('/api/search', (req, res) => {
  const q = req.query.q.toLowerCase();

  const files = [
    'tirthankaras',
    'literature',
    'bhajans',
    'aartis',
    'poems',
    'blog',
    'news'
  ];

  let results = [];

  files.forEach(file => {
    const data = loadData(file + '.json');
    data.forEach(item => {
      if (
        item.title?.toLowerCase().includes(q) ||
        item.content?.toLowerCase().includes(q)
      ) {
        results.push({ ...item, type: file });
      }
    });
  });

  res.json(results);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
