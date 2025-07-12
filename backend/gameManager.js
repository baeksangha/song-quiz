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
    this.timeLimit = 20; // 기본값 (초)
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

  // 게임 설정 (세트, 문제 수, 시간 선택)
  setGameConfig(setId, questionCount, time = 20) {
    this.selectedSetId = setId;
    this.questionCount = questionCount;
    this.timeLimit = time;
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
    
    // 3. 괄호 안의 별칭 처리
    const titleVariations = this.getTitleVariations(correctTitle);
    for (const variation of titleVariations) {
      if (userAnswer === variation.toLowerCase()) return true;
    }
    
    // 4. 영어 -> 한국어 변환 (포괄적인 매핑)
    const englishToKorean = {
      // 2010년대 아이돌
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
      'why don\'t you know': '와이돈츄노',
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
      'dance the night away': '댄스더나이트어웨이',
      
      // 90년대 댄스곡
      'love is': '러브이즈',
      'summer time': '썸머타임',
      'gimme gimme': '김미김미',
      'tell me tell me': '텔미텔미',
      'poison': '포이즌',
      'twist king': '트위스트킹',
      'festival': '페스티벌',
      'honey': '허니',
      
      // 2020년대 아이돌
      'whiplash': '휩래시',
      'apt': '에이피티',
      'supernova': '슈퍼노바',
      'up': '업',
      'magnetic': '매그네틱',
      'how sweet': '하우스윗',
      'i am': '아이엠',
      'hype boy': '하입보이',
      'ditto': '디토',
      'bubble gum': '버블검',
      'drama': '드라마',
      'attention': '어텐션',
      'love dive': '러브다이브',
      'eta': '이타',
      'spicy': '스파이시',
      'queen card': '퀸카',
      'super shy': '슈퍼샤이',
      'perfect night': '퍼펙트나이트',
      'after like': '애프터라이크',
      'omg': '오엠지',
      'kitsch': '키치',
      'cupid': '큐피드',
      'next level': '넥스트레벨',
      'lovesick girls': '러브식걸스',
      'antifragile': '안티프래질',
      'crush': '크러시',
      'teddy bear': '테디베어',
      'eleven': '일레븐',
      'dolphin': '돌핀',
      'smiley': '스마일리',
      'dun dun dance': '던던댄스',
      'unforgiven': '언포기븐',
      'asap': '에이에스에이피',
      'nxde': '엔엑스디이',
      'flower': '플라워',
      'how you like that': '하우유라이크댓',
      'savage': '사비지',
      'fearless': '피어리스',
      'cookie': '쿠키',
      'panorama': '파노라마',
      'forever 1': '포에버원',
      'wannabe': '워너비',
      'fiesta': '피에스타',
      'dreams come true': '드림스컴트루',
      'black mamba': '블랙맘바',
      'queendom': '퀸덤',
      'chimaetbaram': '치맛바람',
      
      // 2000년대 히트곡
      'gee': '지',
      'fire': '파이어',
      'lollipop': '롤리팝',
      'nobody': '노바디',
      'so hot': '소핫',
      'bo peep bo peep': '보핍보핍',
      'roly poly': '롤리폴리',
      'u go girl': '유고걸',
      'abracadabra': '아브라카다브라',
      'my style': '마이스타일',
      'replay': '리플레이',
      'hug': '허그',
      'snow prince': '스노우프린스',
      'must have love': '머스트해브러브',
      'love song': '러브송',
      'i don\'t care': '아이돈케어',
      'bad girl good girl': '배드걸굿걸',
      'chu': '츄',
      'hot issue': '핫이슈',
      'mister': '미스터',
      'diva': '디바',
      'brand new': '브랜드뉴',
      'rainism': '레인즘',
      'one more time': '원모어타임',
      'marshmallow': '마시멜로',
      'friend': '프렌드',
      'love': '러브',
      'my girl': '마이걸',
      'love sick': '러브식',
      'friend confession': '프렌드컨페션',
      'gradually': '그래듀얼리',
      'what is love': '왓이즈러브',
      'like being shot': '라이크빙샷',
      'wind wind': '윈드윈드',
      
      // 추가 별칭들
      'so cool': '쏘쿨',
      '쏘쿨': 'so cool',
      'navillera': '나빌레라',
      '나빌레라': 'navillera',
      'mr. chu': '미스터츄',
      '미스터츄': 'mr. chu',
      'lovey-dovey': '러비더비',
      '러비더비': 'lovey-dovey',
      'yoo hoo': '유후',
      '유후': 'yoo hoo',
      'run devil run': '런데빌런',
      '런데빌런': 'run devil run',
      'sexy love': '섹시러브',
      '섹시러브': 'sexy love',
      'loving u': '러빙유',
      '러빙유': 'loving u',
      'nono no': '노노노',
      '노노노': 'nono no',
      'step': '스텝',
      '스텝': 'step',
      'shock': '쇼크',
      '쇼크': 'shock',
      'beautiful': '뷰티풀',
      '뷰티풀': 'beautiful',
      'daring': '데어링',
      '데어링': 'daring',
      'luv': '러브',
      '러브': 'luv',
      'tt': '티티',
      '티티': 'tt'
    };
    
    // 영어 -> 한국어 변환 확인
    if (englishToKorean[userAnswer]) {
      if (englishToKorean[userAnswer] === correctTitle) return true;
    }
    
    // 한국어 -> 영어 변환 확인
    for (const [english, korean] of Object.entries(englishToKorean)) {
      if (userAnswer === korean && correctTitle === english) return true;
    }
    
    // 4. 부분 일치 (띄어쓰기 제거 후)
    if (userAnswerNoSpace.includes(correctTitleNoSpace) || correctTitleNoSpace.includes(userAnswerNoSpace)) {
      return true;
    }
    
    // 5. 특수문자 제거 후 비교
    const userAnswerClean = userAnswer.replace(/[^\w\s가-힣]/g, '');
    const correctTitleClean = correctTitle.replace(/[^\w\s가-힣]/g, '');
    if (userAnswerClean === correctTitleClean) return true;
    
    return false;
  }

  // 제목의 다양한 변형을 생성하는 함수
  getTitleVariations(title) {
    const variations = [];
    
    // 원본 제목 추가
    variations.push(title);
    
    // 괄호 안의 별칭 처리
    const bracketMatch = title.match(/^(.+?)\s*\(([^)]+)\)$/);
    if (bracketMatch) {
      const mainTitle = bracketMatch[1].trim();
      const alias = bracketMatch[2].trim();
      
      variations.push(mainTitle);
      variations.push(alias);
      
      // NAVILLERA -> 나빌레라 변환
      if (alias === 'NAVILLERA') {
        variations.push('나빌레라');
      }
    }
    
    // 괄호가 없는 경우에도 별칭 매핑
    const specialAliases = {
      'navillera': '나빌레라',
      'so cool': '쏘쿨',
      '쏘쿨': 'so cool',
      'mr. chu': '미스터츄',
      '미스터츄': 'mr. chu',
      'lovey-dovey': '러비더비',
      '러비더비': 'lovey-dovey',
      'yoo hoo': '유후',
      '유후': 'yoo hoo',
      'run devil run': '런데빌런',
      '런데빌런': 'run devil run'
    };
    
    const lowerTitle = title.toLowerCase();
    if (specialAliases[lowerTitle]) {
      variations.push(specialAliases[lowerTitle]);
    }
    
    return variations;
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