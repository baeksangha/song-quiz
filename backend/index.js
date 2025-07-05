const express = require('express');
const http = require('http');
const cors = require('cors');
const WebSocket = require('ws');
const roomManager = require('./roomManager');
const songs = require('./songs');

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

app.get('/health', (req, res) => {
  res.send('OK');
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 소켓ID <-> 방코드 매핑
const socketRoomMap = {};

function broadcastToRoom(roomCode, data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.roomCode === roomCode) {
      client.send(JSON.stringify(data));
    }
  });
}

wss.on('connection', (ws) => {
  console.log('WebSocket 연결됨!123123');
  ws.on('message', (msg) => {
    let data;
    try { data = JSON.parse(msg); } catch { return; }
    const { type, payload } = data;
    console.log('받은 메시지:', data);
    console.log('받은 메시지:', { type, payload });
    // 방 생성
    if (type === 'create_room') {
      console.log('방 생성 요청:', payload);
      const { roomCode, password, nickname } = payload;
      const created = roomManager.createRoom(roomCode, password, ws._socket.remotePort);
      if (!created) {
        ws.send(JSON.stringify({ type: 'room_error', payload: { error: 'ROOM_EXISTS' } }));
        return;
      }
      ws.roomCode = roomCode;
      socketRoomMap[ws._socket.remotePort] = roomCode;
      roomManager.addPlayer(roomCode, ws._socket.remotePort, nickname);
      ws.send(JSON.stringify({ type: 'room_joined', payload: { roomCode, isHost: true } }));
      broadcastToRoom(roomCode, { type: 'update_players', payload: { players: roomManager.getPlayers(roomCode) } });
    }

    // 방 입장
    else if (type === 'join_room') {
      const { roomCode, password, nickname } = payload;
      const result = roomManager.joinRoom(roomCode, password, ws._socket.remotePort);
      if (!result.success) {
        ws.send(JSON.stringify({ type: 'room_error', payload: { error: result.error } }));
        return;
      }
      ws.roomCode = roomCode;
      socketRoomMap[ws._socket.remotePort] = roomCode;
      roomManager.addPlayer(roomCode, ws._socket.remotePort, nickname);
      ws.send(JSON.stringify({ type: 'room_joined', payload: { roomCode, isHost: false } }));
      broadcastToRoom(roomCode, { type: 'update_players', payload: { players: roomManager.getPlayers(roomCode) } });
      // 게임이 이미 시작된 방이어도, join_room 후에는 바로 game_state를 보내지 않는다.
    }

    // 닉네임 등록 (방 입장 후 변경)
    else if (type === 'register_nickname') {
      const { nickname } = payload;
      const roomCode = ws.roomCode;
      if (!roomCode) return;
      roomManager.addPlayer(roomCode, ws._socket.remotePort, nickname);
      broadcastToRoom(roomCode, { type: 'update_players', payload: { players: roomManager.getPlayers(roomCode) } });
    }

    // 게임 시작 (방장만 가능)
    else if (type === 'start_game') {
      const roomCode = ws.roomCode;
      const room = roomManager.getRoom(roomCode);
      if (!room || room.hostId !== ws._socket.remotePort) return;
      roomManager.startGame(roomCode);
      startSong(roomCode);
    }

    // 정답 제출
    else if (type === 'submit_answer') {
      const { answer } = payload;
      const roomCode = ws.roomCode;
      const room = roomManager.getRoom(roomCode);
      if (!room || !room.started) return;
      const game = room.game;
      if (game.isAnswering) return; // 이미 정답자 있음
      if (game.checkAnswer(answer)) {
        game.isAnswering = true;
        room.players[ws._socket.remotePort].score += 1;
        // 타이머 정리
        if (room.hintTimeout) clearTimeout(room.hintTimeout);
        if (room.revealTimeout) clearTimeout(room.revealTimeout);
        broadcastToRoom(roomCode, {
          type: 'score_update',
          payload: { players: roomManager.getPlayers(roomCode), correct: room.players[ws._socket.remotePort].name, answer: game.getCurrentSong().title }
        });
        setTimeout(() => {
          game.nextSong();
          if (game.currentSongIndex < songs.length) {
            startSong(roomCode);
          } else {
            endGame(roomCode);
          }
        }, 2000);
      }
    }

    // 방 나가기
    else if (type === 'leave_room') {
      const { roomCode } = payload;
      if (roomCode) {
        roomManager.removePlayer(roomCode, ws._socket.remotePort);
        broadcastToRoom(roomCode, { type: 'update_players', payload: { players: roomManager.getPlayers(roomCode) } });
        // 방에 아무도 없으면 방 삭제
        if (roomManager.getPlayers(roomCode).length === 0) {
          roomManager.deleteRoom(roomCode);
        }
      }
      ws.roomCode = null;
    }

    // ready 메시지 처리 (더 이상 사용하지 않음)
    else if (type === 'ready') {
      // ready 메시지는 무시 (startSong에서 바로 game_state 전송)
    }
  });

  ws.on('close', () => {
    const roomCode = ws.roomCode;
    if (roomCode) {
      roomManager.removePlayer(roomCode, ws._socket.remotePort);
      broadcastToRoom(roomCode, { type: 'update_players', payload: { players: roomManager.getPlayers(roomCode) } });
    }
  });
});

function startSong(roomCode) {
  const room = roomManager.getRoom(roomCode);
  if (!room) return;
  const game = room.game;
  const song = game.getCurrentSong();
  game.isAnswering = false;
  game.hintGiven = false;

  // 기존 타이머가 있다면 모두 정리
  if (room.hintTimeout) clearTimeout(room.hintTimeout);
  if (room.revealTimeout) clearTimeout(room.revealTimeout);

  // 준비된 플레이어 목록 초기화
  room.readyPlayers = new Set();

  // 모든 유저에게 바로 game_state 전송 (prepare 단계 생략)
  broadcastToRoom(roomCode, { type: 'game_state', payload: { song: { audioUrl: song.audioUrl }, index: game.currentSongIndex + 1 } });
  
  // 10초 후 힌트 (디버깅용)
  room.hintTimeout = setTimeout(() => {
    if (!game.isAnswering && !game.hintGiven) {
      game.hintGiven = true;
      broadcastToRoom(roomCode, { type: 'hint', payload: { hint: song.artist, index: game.currentSongIndex + 1 } });
    }
  }, 10000);
  // 60초 후 정답 공개 및 다음 곡
  room.revealTimeout = setTimeout(() => {
    if (!game.isAnswering) {
      broadcastToRoom(roomCode, { type: 'reveal_answer', payload: { answer: song.title } });
      setTimeout(() => {
        game.nextSong();
        if (game.currentSongIndex < songs.length) {
          startSong(roomCode);
        } else {
          endGame(roomCode);
        }
      }, 2000);
    }
  }, 60000);
}

// sendGameStateAndStartTimers 함수는 더 이상 사용하지 않음 (startSong에서 직접 처리)

function endGame(roomCode) {
  const room = roomManager.getRoom(roomCode);
  if (!room) return;
  // 타이머 정리
  if (room.hintTimeout) clearTimeout(room.hintTimeout);
  if (room.revealTimeout) clearTimeout(room.revealTimeout);
  const players = roomManager.getPlayers(roomCode);
  const maxScore = Math.max(...players.map(p => p.score));
  const winners = players.filter(p => p.score === maxScore);
  broadcastToRoom(roomCode, { type: 'game_end', payload: { players, winners } });
  // 방 삭제
  roomManager.deleteRoom(roomCode);
}

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
}); 