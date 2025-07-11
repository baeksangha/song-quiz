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

  addPlayer(roomCode, socketId, name) {
    const room = this.rooms[roomCode];
    if (!room) return false;
    room.players[socketId] = { name, score: 0 };
    return true;
  }

  removePlayer(roomCode, socketId) {
    const room = this.rooms[roomCode];
    if (!room) return;
    delete room.players[socketId];
    // 방장이 나가면 방 삭제(간단화)
    if (room.hostId === socketId) delete this.rooms[roomCode];
  }

  getRoom(roomCode) {
    return this.rooms[roomCode];
  }

  getPlayers(roomCode) {
    const room = this.rooms[roomCode];
    if (!room) return [];
    return Object.values(room.players);
  }

  startGame(roomCode) {
    const room = this.rooms[roomCode];
    if (!room) return false;
    room.started = true;
    room.game.resetGame();
    return true;
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

  deleteRoom(roomCode) {
    delete this.rooms[roomCode];
  }
}

module.exports = new RoomManager();