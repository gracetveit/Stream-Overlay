import express from 'express';
import https from 'https';

const app = express();

const PORT = 443;

https.createServer(app).listen(PORT, () => {
  console.log(`listening at https://localhost:${PORT}`);
});
