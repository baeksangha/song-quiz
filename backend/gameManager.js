// 게임 상태 및 로직 관리
const songs = require('./songs');

class GameManager {
  constructor() {
    this.players = {}; // { socketId: { name, score } }
    this.currentSongIndex = 0;
    this.currentAnswer = '';
    this.isAnswering = false;
    this.timer = null;
    this.hintGiven = false;
  }

  addPlayer(socketId, name) {
    this.players[socketId] = { name, score: 0 };
  }

  removePlayer(socketId) {
    delete this.players[socketId];
  }

  getCurrentSong() {
    return songs[this.currentSongIndex];
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
      'yes or yes': '예스오어예스',
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

  nextSong() {
    this.currentSongIndex++;
    this.hintGiven = false;
    this.isAnswering = false;
  }

  resetGame() {
    this.currentSongIndex = 0;
    this.hintGiven = false;
    this.isAnswering = false;
    for (const id in this.players) {
      this.players[id].score = 0;
    }
  }
}

module.exports = GameManager; 