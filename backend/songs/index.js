// 노래 세트 관리
const songs2010sIdols = require('./2010s-idols');
const songs1990sDance = require('./1990s-dance');
const songs2020sIdols = require('./2020s-idols');
const songs2000sHits = require('./2000s-hits');

// 사용 가능한 노래 세트들
const songSets = {
  '2010s-idols': {
    name: '2010년대 아이돌',
    songs: songs2010sIdols
  },
  '1990s-dance': {
    name: '90년대 중후반 댄스곡 모음',
    songs: songs1990sDance
  },
  '2020s-idols': {
    name: '2020년대 아이돌음악',
    songs: songs2020sIdols
  },
  '2000s-hits': {
    name: '00년대 히트곡',
    songs: songs2000sHits
  }
  // 향후 추가될 세트들:
  // '1990s': { name: '1990년대 히트곡', songs: songs1990s }
};

// 사용 가능한 문제 수 옵션들
const questionCounts = [5, 10, 30, 50];

// 사용 가능한 시간 옵션들 (초 단위)
const timeOptions = [20, 40, 60];

// 배열을 섞는 함수 (Fisher-Yates 알고리즘)
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 세트 목록 가져오기
function getAvailableSets() {
  return Object.entries(songSets).map(([key, set]) => ({
    id: key,
    name: set.name,
    songCount: set.songs.length
  }));
}

// 특정 세트의 노래들 가져오기 (섞어서)
function getSongsBySet(setId) {
  const set = songSets[setId];
  if (!set) return null;
  return shuffleArray(set.songs);
}

// 문제 수 옵션들 가져오기
function getQuestionCountOptions() {
  return questionCounts;
}

// 시간 옵션들 가져오기
function getTimeOptions() {
  return timeOptions;
}

module.exports = {
  songSets,
  getAvailableSets,
  getSongsBySet,
  getQuestionCountOptions,
  getTimeOptions
}; 