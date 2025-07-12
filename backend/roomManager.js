const GameManager = require('./gameManager');

class RoomManager {
  constructor() {
    this.rooms = {}; // { roomCode: { password, players: {socketId: {name, score}}, hostId, game: GameManager, started: false, currentGameState: null } }
  }

  createRoom(roomCode, password, hostId) {
    if (this.rooms[roomCode]) return false;
    this.rooms[roomCode] = {
      password,
      players: {},
      hostId,
      game: new GameManager(),
      started: false,
      currentGameState: null
    };
    return true;
  }

  joinRoom(roomCode, password, socketId) {
    const room = this.rooms[roomCode];
    if (!room) return { success: false, error: 'NOT_FOUND' };
    if (room.password !== password) return { success: false, error: 'WRONG_PASSWORD' };
    if (room.players[socketId]) return { success: false, error: 'ALREADY_JOINED' };
    return { success: true, room, started: room.started };
  }

  getRoom(roomCode) {
    return this.rooms[roomCode];
  }

  addPlayer(roomCode, socketId, name) {
    const room = this.rooms[roomCode];
    if (!room) return false;
    
    // 기존 플레이어가 있는 경우 점수 유지
    const existingPlayer = room.players[socketId];
    room.players[socketId] = {
      name,
      score: existingPlayer ? existingPlayer.score : 0
    };
    
    // 게임 매니저에도 플레이어 추가
    room.game.addPlayer(socketId, name);
    return true;
  }

  removePlayer(roomCode, socketId) {
    const room = this.rooms[roomCode];
    if (!room) return false;
    delete room.players[socketId];
    room.game.removePlayer(socketId);
    return true;
  }

  getPlayers(roomCode) {
    const room = this.rooms[roomCode];
    if (!room) return [];
    return Object.entries(room.players).map(([id, player]) => ({
      name: player.name,
      score: player.score || 0
    }));
  }

  // 게임 설정 (방장만 호출 가능)
  setGameConfig(roomCode, setId, questionCount, time = 20) {
    const room = this.rooms[roomCode];
    if (!room) return false;
    
    try {
      room.game.setGameConfig(setId, questionCount, time);
      return true;
    } catch (error) {
      console.error('게임 설정 실패:', error);
      return false;
    }
  }

  // 게임 시작 준비 (방장만 호출 가능)
  prepareGame(roomCode) {
    const room = this.rooms[roomCode];
    if (!room) return false;
    
    room.game.prepareGame();
    return true;
  }

  // 게임 시작 (방장만 호출 가능)
  startGame(roomCode) {
    const room = this.rooms[roomCode];
    if (!room) return false;
    
    room.started = true;
    room.game.startGame();
    return true;
  }

  updatePlayerScore(roomCode, socketId) {
    const room = this.rooms[roomCode];
    if (!room || !room.players[socketId]) return false;
    
    // 플레이어 점수 증가
    room.players[socketId].score = (room.players[socketId].score || 0) + 1;
    return true;
  }

  getPlayerScore(roomCode, socketId) {
    const room = this.rooms[roomCode];
    if (!room || !room.players[socketId]) return 0;
    return room.players[socketId].score || 0;
  }

  updateGameState(roomCode, gameState) {
    const room = this.rooms[roomCode];
    if (!room) return false;
    room.currentGameState = gameState;
    return true;
  }

  getCurrentGameState(roomCode) {
    const room = this.rooms[roomCode];
    if (!room) return null;
    return room.currentGameState;
  }

  // 게임 매니저의 게임 상태 가져오기
  getGameManagerState(roomCode) {
    const room = this.rooms[roomCode];
    if (!room) return null;
    return room.game.getGameState();
  }

  deleteRoom(roomCode) {
    delete this.rooms[roomCode];
  }
}

module.exports = RoomManager;