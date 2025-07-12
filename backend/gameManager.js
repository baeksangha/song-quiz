// 게임 상태 및 로직 관리
const { getSongsBySet } = require('./songs');

class GameManager {
  constructor() {
    this.players = {}; // { socketId: { name, score } }
    this.currentSongIndex = 0;
    this.currentAnswer = '';
    this.isAnswering = false;
    this.timer = null;
    this.hintGiven = false;
    this.songs = []; // 선택된 세트의 노래들
    this.selectedSetId = null;
    this.questionCount = 10; // 기본값
    this.gamePhase = 'waiting'; // waiting, selecting, countdown, playing, finished
  }

  addPlayer(socketId, name) {
    // 기존 플레이어가 있는 경우 점수 유지
    const existingPlayer = this.players[socketId];
    this.players[socketId] = {
      name,
      score: existingPlayer ? existingPlayer.score : 0
    };
  }

  removePlayer(socketId) {
    delete this.players[socketId];
  }

  // 게임 설정 (세트와 문제 수 선택)
  setGameConfig(setId, questionCount) {
    this.selectedSetId = setId;
    this.questionCount = questionCount;
    this.songs = getSongsBySet(setId);
    if (!this.songs) {
      throw new Error('Invalid song set');
    }
    this.gamePhase = 'selecting';
  }

  // 게임 시작 준비
  prepareGame() {
    this.gamePhase = 'countdown';
    this.currentSongIndex = 0;
    this.isAnswering = false;
    this.hintGiven = false;
    // 모든 플레이어의 점수를 0으로 초기화
    Object.keys(this.players).forEach(socketId => {
      this.players[socketId].score = 0;
    });
  }

  // 게임 시작
  startGame() {
    this.gamePhase = 'playing';
  }

  getCurrentSong() {
    if (!this.songs || this.currentSongIndex >= this.songs.length) return null;
    return this.songs[this.currentSongIndex];
  }

  nextSong() {
    this.currentSongIndex++;
    this.isAnswering = false;
    this.hintGiven = false;
    
    // 게임 종료 체크
    if (this.currentSongIndex >= this.questionCount || this.currentSongIndex >= this.songs.length) {
      this.gamePhase = 'finished';
    }
  }

  checkAnswer(answer) {
    const song = this.getCurrentSong();
    if (!song || !answer) return false;
    
    const userAnswer = answer.trim().toLowerCase();
    const correctTitle = song.title.toLowerCase();
    
    // 1. 정확한 일치
    if (userAnswer === correctTitle) return true;
    
    // 2. 띄어쓰기 제거 후 비교
    const userAnswerNoSpace = userAnswer.replace(/\s+/g, '');
    const correctTitleNoSpace = correctTitle.replace(/\s+/g, '');
    if (userAnswerNoSpace === correctTitleNoSpace) return true;
    
    // 3. 영어 -> 한국어 변환 (일부 일반적인 변환)
    const englishToKorean = {
      'forever young': '포에버영',
      'really really': '리얼리리얼리',
      'cheer up': '치어업',
      'blue moon': '블루문',
      'ah yeah': '아예',
      'kill this love': '킬디스러브',
      'yes or yes': '예스올예스',
      'latata': '라타타',
      'idol': '아이돌',
      'likey': '라이키',
      'boomerang': '부메랑',
      'power up': '파워업',
      'time for the moon night': '타임포더문나이트',
      'bboom bboom': '뿜뿜',
      'why dont you know': '와이돈유노',
      'ddu du ddu du': '뚜두뚜두',
      'dna': '디엔에이',
      'yesterday': '예스터데이',
      'what is love': '왓이즈러브',
      'knock knock': '녹녹',
      'ah choo': '아츄',
      'navillera': '나빌레라',
      'view': '뷰',
      'russian roulette': '러시안룰렛',
      'ooh ahh하게': '우아하게',
      'her': '허',
      'dance the night away': '댄스더나이트어웨이'
    };
    
    // 영어 -> 한국어 변환 확인
    if (englishToKorean[userAnswer]) {
      if (englishToKorean[userAnswer] === correctTitle) return true;
    }
    
    // 한국어 -> 영어 변환 확인
    for (const [english, korean] of Object.entries(englishToKorean)) {
      if (userAnswer === korean && correctTitle === english) return true;
    }
    
    return false;
  }

  resetGame() {
    this.currentSongIndex = 0;
    this.hintGiven = false;
    this.isAnswering = false;
    this.gamePhase = 'waiting';
    // 점수 초기화는 RoomManager에서 처리
  }

  getPlayerScore(socketId) {
    return this.players[socketId]?.score || 0;
  }

  updatePlayerScore(socketId) {
    if (this.players[socketId]) {
      this.players[socketId].score = (this.players[socketId].score || 0) + 1;
      return true;
    }
    return false;
  }

  // 게임 상태 정보 가져오기
  getGameState() {
    return {
      phase: this.gamePhase,
      currentSongIndex: this.currentSongIndex,
      questionCount: this.questionCount,
      selectedSetId: this.selectedSetId,
      totalSongs: this.songs.length
    };
  }
}

module.exports = GameManager; 