const express = require('express');
const http = require('http');
const cors = require('cors');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const RoomManager = require('./roomManager');
const songs = require('./songs');

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// 정적 파일 제공
app.use('/audio', express.static(path.join(__dirname, 'public/audio')));

app.get('/health', (req, res) => {
  res.send('OK');
});

// 오디오 스트리밍 엔드포인트
app.get('/stream/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'public/audio', filename);
  
  // 파일이 존재하는지 확인
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Audio file not found');
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'audio/mpeg',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'audio/mpeg',
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// RoomManager 인스턴스 생성
const roomManager = new RoomManager();

// 소켓ID <-> 방코드 매핑
const socketRoomMap = {};

// 방별 게임 상태 관리
const roomGameStates = {};

function broadcastToRoom(roomCode, data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.roomCode === roomCode) {
      client.send(JSON.stringify(data));
    }
  });
}

// YouTube URL에서 비디오 ID 추출
function extractYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

// YouTube URL에서 시작 시간 추출
function extractStartFromUrl(url) {
  if (!url) return 0;
  const match = url.match(/[?&]t=(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

wss.on('connection', (ws) => {
  console.log('WebSocket 연결됨!123123');
  ws.on('message', (msg) => {
    let data;
    try { data = JSON.parse(msg); } catch { return; }
    const { type, payload } = data;
    console.log('받은 메시지:', data);
    // 중복 로그 제거
    
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
      
      // 게임이 이미 시작된 경우 서버 게임 상태 전송
      const serverGameState = getRoomGameState(roomCode);
      if (serverGameState) {
        // 현재 서버 게임 상태를 새로 들어온 클라이언트에게만 전송
        ws.send(JSON.stringify({
          type: 'server_game_state',
          payload: serverGameState
        }));
      }
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

    // 정답 제출 처리 부분 수정
    else if (type === 'submit_answer') {
      const { answer } = payload;
      const roomCode = ws.roomCode;
      const room = roomManager.getRoom(roomCode);
      if (!room || !room.started) return;
      const game = room.game;
      
      // 서버 게임 상태 확인
      const serverGameState = getRoomGameState(roomCode);
      if (!serverGameState || serverGameState.isAnswering) return;
      
      if (game.checkAnswer(answer)) {
        // 서버 게임 상태 업데이트
        serverGameState.isAnswering = true;
        serverGameState.phase = 'correct';
        
        // 점수 업데이트
        roomManager.updatePlayerScore(roomCode, ws._socket.remotePort);
        
        // 서버 타이머 정리
        if (room.serverTimer) {
          clearInterval(room.serverTimer);
          room.serverTimer = null;
        }
        
        // 정답자 정보와 함께 게임 상태 전송
        broadcastToRoom(roomCode, {
          type: 'server_game_state',
          payload: {
            ...serverGameState,
            correctPlayer: room.players[ws._socket.remotePort].name,
            correctAnswer: game.getCurrentSong().title
          }
        });
        
        // 플레이어 점수 업데이트 브로드캐스트
        broadcastToRoom(roomCode, {
          type: 'score_update',
          payload: {
            players: roomManager.getPlayers(roomCode)
          }
        });
        
        // 다음 곡으로 이동
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

    // 클라이언트 준비 완료 신호 (서버 재생 방식에서는 불필요)
    else if (type === 'ready') {
      // 서버 재생 방식에서는 무시
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

// 서버 중심 게임 상태 관리
function updateRoomGameState(roomCode, gameState) {
  roomGameStates[roomCode] = {
    ...gameState,
    lastUpdate: Date.now()
  };
}

function getRoomGameState(roomCode) {
  return roomGameStates[roomCode];
}

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

  // 서버 중심 게임 상태 생성
  const serverGameState = {
    phase: 'playing', // playing, hint, reveal, waiting
    song: { 
      audioUrl: song.audioUrl,
      title: song.title,
      artist: song.artist,
      videoId: extractYouTubeId(song.audioUrl),
      startTime: extractStartFromUrl(song.audioUrl)
    },
    index: game.currentSongIndex + 1,
    serverStartTime: Date.now(), // 서버 시간 기준
    timeRemaining: 60, // 남은 시간 (초)
    hintGiven: false,
    isAnswering: false
  };

  // 서버에 게임 상태 저장
  updateRoomGameState(roomCode, serverGameState);

  // 모든 클라이언트에게 서버 게임 상태 전송
  broadcastToRoom(roomCode, { 
    type: 'server_game_state', 
    payload: serverGameState
  });
  
  // 서버 타이머 시작
  startServerTimer(roomCode);
}

// 서버 타이머 관리
function startServerTimer(roomCode) {
  const room = roomManager.getRoom(roomCode);
  if (!room) return;

  const game = room.game;
  let timeRemaining = 60;

  const timer = setInterval(() => {
    timeRemaining--;
    
    // 게임 상태 업데이트
    const currentState = getRoomGameState(roomCode);
    if (currentState) {
      currentState.timeRemaining = timeRemaining;
      
      // 힌트 시간 (10초)
      if (timeRemaining === 50 && !currentState.hintGiven) {
        currentState.phase = 'hint';
        currentState.hintGiven = true;
        broadcastToRoom(roomCode, { 
          type: 'server_game_state', 
          payload: currentState 
        });
      }
      
      // 시간 종료 (0초)
      if (timeRemaining === 0) {
        currentState.phase = 'reveal';
        broadcastToRoom(roomCode, { 
          type: 'server_game_state', 
          payload: currentState 
        });
        
        // 다음 곡으로 이동
        setTimeout(() => {
          game.nextSong();
          if (game.currentSongIndex < songs.length) {
            startSong(roomCode);
          } else {
            endGame(roomCode);
          }
        }, 2000);
        
        clearInterval(timer);
      } else {
        // 주기적으로 게임 상태 전송
        broadcastToRoom(roomCode, { 
          type: 'server_game_state', 
          payload: currentState 
        });
      }
    }
  }, 1000);

  // 타이머를 방에 저장
  room.serverTimer = timer;
}

// sendGameStateAndStartTimers 함수는 더 이상 사용하지 않음 (startSong에서 직접 처리)

function endGame(roomCode) {
  const room = roomManager.getRoom(roomCode);
  if (!room) return;
  
  // 서버 타이머 정리
  if (room.serverTimer) {
    clearInterval(room.serverTimer);
    room.serverTimer = null;
  }
  
  // 최종 플레이어 점수 정보 가져오기
  const players = roomManager.getPlayers(roomCode);
  
  // 승자 계산
  const maxScore = Math.max(...players.map(p => p.score));
  const winners = players.filter(p => p.score === maxScore);
  
  // 게임 종료 메시지 전송
  broadcastToRoom(roomCode, { 
    type: 'game_end', 
    payload: { 
      players: players,
      winners: winners 
    } 
  });
  
  // 서버 게임 상태 정리
  delete roomGameStates[roomCode];
  
  // 방 삭제
  roomManager.deleteRoom(roomCode);
}

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
}); 