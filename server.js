const express = require('express');
const { PeerServer } = require('peer');
const path = require('path');

const app = express();

// 1. 设置静态资源目录，托管 Vue 构建产物（dist）
app.use(express.static(path.join(__dirname, 'dist')));

// 2. PeerJS 信令服务器（WebSocket）
const peerServer = PeerServer({
  port: 9000,
  path: '/Chat',
  proxied: true,
});

// 3. 处理 HTML5 history 路由（Vue-router history 模式）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

// 启动静态服务（建议与 peerServer 分开端口）
const IP = location.hostname || 'localhost';
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`App running at http://${IP}:${PORT}`);
  console.log(`PeerJS server running at ws://${IP}:9000/Chat`);
});
