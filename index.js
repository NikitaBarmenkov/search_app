const express = require('express');
const app = express();
const http = require('http').Server(app);
const wss = require('socket.io')(http);

const port = process.env.PORT || 3030;

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

const vk = require('./vk');
const reddit = require('./reddit');

wss.on('connection', ws => {
  ws.on('message', async (data) => {
    await GetData(JSON.parse(data), ws);
  });
});

async function GetData(data, ws) {
    switch (data.radio) {
      case 'vk':
        await vk.GetData(ws, data.keyword, data.excluded_words);
        vk.GetRealTime(ws, data.keyword, data.excluded_words);
        break;
      case 'reddit':
        await reddit.GetData(ws, data.keyword, data.excluded_words);
        reddit.GetRealTime(ws, data.keyword, data.excluded_words);
        break;
    }
}

http.listen(port, () => console.log('listening on port ' + port));