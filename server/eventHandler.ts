import express from 'express';
import https from 'https';
import http from 'http';
import 'dotenv/config';
import eventsub from './eventsub';

const app = express();

app.use(
  express.raw({
    type: 'application/json',
  })
);

app.post('/eventsub', eventsub);

const PORT = 8080;

http.createServer(app).listen(PORT, () => {
  console.log(`listening at http://localhost:${PORT}`);
});
