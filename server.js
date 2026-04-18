const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

// Load JSON safely
function load(file) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', file)));
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

app.get('/community', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/community.html'));
});

app.get('/search', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/search.html'));
});

// API: GET CATEGORY DATA
app.get('/api/:type', (req, res) => {
  try {
    const data = load(req.params.type + '.json');
    res.json(data);
  } catch {
    res.json([]);
  }
});

// API: SEARCH
app.get('/api/search', (req, res) => {
  const q = req.query.q?.toLowerCase() || '';

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
    const data = load(file + '.json');

    data.forEach(item => {
      const text =
        (item.title_hi || '') +
        (item.title_en || '') +
        (item.content_hi || '') +
        (item.content_en || '');

      if (text.toLowerCase().includes(q)) {
        results.push({ ...item, type: file });
      }
    });
  });

  res.json(results);
});

app.listen(PORT, () => {
  console.log(`✅ JainWorld running on port ${PORT}`);
});
