const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const PORT = 3000;

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

// WebSocket Helpers (RFC 6455)
function computeAcceptKey(key) {
  return crypto
    .createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');
}

function parseFrame(buffer) {
  if (buffer.length < 2) return null;
  const opcode = buffer[0] & 0x0f;
  const isMasked = (buffer[1] & 0x80) !== 0;
  let payloadLen = buffer[1] & 0x7f;
  let offset = 2;

  if (payloadLen === 126) {
    if (buffer.length < 4) return null;
    payloadLen = buffer.readUInt16BE(2);
    offset = 4;
  } else if (payloadLen === 127) {
    if (buffer.length < 10) return null;
    payloadLen = Number(buffer.readBigUInt64BE(2));
    offset = 10;
  }

  let maskKey = null;
  if (isMasked) {
    if (buffer.length < offset + 4) return null;
    maskKey = buffer.slice(offset, offset + 4);
    offset += 4;
  }

  if (buffer.length < offset + payloadLen) return null;
  const payload = buffer.slice(offset, offset + payloadLen);

  if (isMasked && maskKey) {
    for (let i = 0; i < payload.length; i++) {
      payload[i] ^= maskKey[i % 4];
    }
  }

  return { opcode, payload, totalLength: offset + payloadLen };
}

function makeTextFrame(data) {
  const payload = Buffer.from(data, 'utf8');
  let header;
  if (payload.length < 126) {
    header = Buffer.from([0x81, payload.length]);
  } else if (payload.length <= 65535) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(payload.length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(payload.length), 2);
  }
  return Buffer.concat([header, payload]);
}

// Room Management
const rooms = new Map(); // roomCode -> { hostSocket, guestSocket, p1Controller, p2Controller }

function sendSocket(sock, obj) {
  if (sock && !sock.destroyed) {
    try {
      sock.write(makeTextFrame(JSON.stringify(obj)));
    } catch (e) {}
  }
}

// HTTP Server
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  const filePath = path.join(__dirname, reqPath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + err.code);
      }
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content);
    }
  });
});

// WebSocket Upgrade Handler
server.on('upgrade', (req, socket, head) => {
  const secKey = req.headers['sec-websocket-key'];
  if (!secKey) {
    socket.destroy();
    return;
  }

  const acceptKey = computeAcceptKey(secKey);
  const responseHeaders = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${acceptKey}`,
    ''
  ].join('\r\n');

  socket.write(responseHeaders + '\r\n');

  let buffer = Buffer.alloc(0);
  let boundRoom = null;
  let boundRole = null; // 'host', 'guest', 'controller'

  socket.on('data', chunk => {
    buffer = Buffer.concat([buffer, chunk]);

    while (buffer.length > 0) {
      const frame = parseFrame(buffer);
      if (!frame) break;
      buffer = buffer.slice(frame.totalLength);

      // Handle text frame
      if (frame.opcode === 1) {
        try {
          const msg = JSON.parse(frame.payload.toString('utf8'));
          handleMessage(msg, socket);
        } catch (e) {}
      } else if (frame.opcode === 8) {
        // Close frame
        socket.end();
        break;
      }
    }
  });

  function handleMessage(msg, sock) {
    if (msg.type === 'create_room') {
      const code = msg.room || Math.random().toString(36).substring(2, 8).toUpperCase();
      boundRoom = code;
      boundRole = 'host';

      rooms.set(code, {
        host: sock,
        guest: null,
        p1Controller: null,
        p2Controller: null
      });

      sendSocket(sock, { type: 'room_created', room: code, ip: getLocalIp(), port: PORT });
      console.log(`[Room Created] ${code}`);
    } else if (msg.type === 'join_room') {
      const code = (msg.room || '').toUpperCase();
      const r = rooms.get(code);
      if (!r) {
        sendSocket(sock, { type: 'error', message: 'Room not found. Check the code!' });
        return;
      }
      boundRoom = code;
      boundRole = 'guest';
      r.guest = sock;

      sendSocket(sock, { type: 'joined_room', room: code, role: 'guest', player: 2 });
      sendSocket(r.host, { type: 'player_joined', player: 2 });
      console.log(`[Player 2 Joined] Room: ${code}`);
    } else if (msg.type === 'join_controller') {
      const code = (msg.room || '').toUpperCase();
      const p = msg.player || 1;
      let r = rooms.get(code);

      // If room doesn't exist yet, create a placeholder
      if (!r) {
        r = { host: null, guest: null, p1Controller: null, p2Controller: null };
        rooms.set(code, r);
      }

      boundRoom = code;
      boundRole = 'controller';
      if (p === 1) r.p1Controller = sock;
      else r.p2Controller = sock;

      sendSocket(sock, { type: 'controller_connected', room: code, player: p });
      if (r.host) sendSocket(r.host, { type: 'controller_ready', player: p });
      console.log(`[Controller Connected] Player ${p} for room: ${code}`);
    } else if (msg.type === 'input' || msg.type === 'action') {
      // Forward input from controller or guest to host
      const r = rooms.get(boundRoom);
      if (r && r.host && sock !== r.host) {
        sendSocket(r.host, msg);
      }
    } else if (msg.type === 'sync') {
      // Forward game state sync from host to guest & controllers
      const r = rooms.get(boundRoom);
      if (r && sock === r.host) {
        if (r.guest) sendSocket(r.guest, msg);
        if (r.p1Controller) sendSocket(r.p1Controller, msg);
        if (r.p2Controller) sendSocket(r.p2Controller, msg);
      }
    } else if (msg.type === 'rumble') {
      // Forward vibration command from host to specific player controller
      const r = rooms.get(boundRoom);
      if (r) {
        const targetSock = msg.player === 1 ? r.p1Controller : r.p2Controller;
        if (targetSock) sendSocket(targetSock, msg);
      }
    }
  }

  socket.on('close', () => {
    if (boundRoom && rooms.has(boundRoom)) {
      const r = rooms.get(boundRoom);
      if (boundRole === 'host') {
        if (r.guest) sendSocket(r.guest, { type: 'opponent_disconnected' });
        rooms.delete(boundRoom);
        console.log(`[Room Closed] ${boundRoom}`);
      } else if (boundRole === 'guest') {
        r.guest = null;
        if (r.host) sendSocket(r.host, { type: 'opponent_disconnected' });
      } else if (boundRole === 'controller') {
        if (r.p1Controller === socket) r.p1Controller = null;
        if (r.p2Controller === socket) r.p2Controller = null;
      }
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIp();
  console.log('========================================================');
  console.log('  🥋 STREET CLASH MULTIPLAYER & TOUCH CONSOLE SERVER');
  console.log('========================================================');
  console.log(`  💻 Desktop Browser:      http://localhost:${PORT}`);
  console.log(`  📱 Mobile Phone Controller: http://${localIp}:${PORT}`);
  console.log('========================================================');
  console.log('  Share your network link or scan QR code to play!');
  console.log('========================================================\n');
});
