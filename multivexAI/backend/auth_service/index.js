const express = require('express');
const app = express();
const port = 8001;

app.get('/auth', (req, res) => {
  res.json({ status: 'ok', message: 'Auth service working' });
});

app.listen(port, () => {
  console.log(`Auth service listening on port ${port}`);
});
