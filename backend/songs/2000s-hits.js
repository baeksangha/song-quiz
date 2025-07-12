// 2000년대 히트곡 모음
const songs = [
  {
    title: "Gee",
    artist: "소녀시대",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=0"
  },
  {
    title: "거짓말",
    artist: "BIGBANG",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=199"
  },
  {
    title: "Fire",
    artist: "2NE1",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=427"
  },
  {
    title: "Lollipop",
    artist: "빅뱅 & 2NE1",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=649"
  },
  {
    title: "Nobody",
    artist: "원더걸스",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=837"
  },
  {
    title: "So Hot",
    artist: "원더걸스",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=1048"
  },
  {
    title: "Bo Peep Bo Peep",
    artist: "티아라",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=1228"
  },
  {
    title: "Roly-Poly",
    artist: "티아라",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=1452"
  },
  {
    title: "U-Go-Girl (With. 낯선)",
    artist: "이효리",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=1665"
  },
  {
    title: "Abracadabra",
    artist: "브라운아이드걸스",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=1853"
  },
  {
    title: "My Style (Hidden Track)",
    artist: "브라운아이드걸스",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=2035"
  },
  {
    title: "누난 너무 예뻐 (Replay)",
    artist: "SHINee",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=2273"
  },
  {
    title: "8282",
    artist: "다비치",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=2486"
  },
  {
    title: "사랑스러워",
    artist: "김종국",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=2703"
  },
  {
    title: "Hug (포옹)",
    artist: "동방신기",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=2968"
  },
  {
    title: "Snow Prince",
    artist: "SS501",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=3195"
  },
  {
    title: "Must Have Love",
    artist: "SG워너비 & 브라운아이드걸스",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=3397"
  },
  {
    title: "Love Song",
    artist: "7공주",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=3653"
  },
  {
    title: "냉면",
    artist: "명카드라이브",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=3882"
  },
  {
    title: "I Don't Care",
    artist: "2NE1",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=4099"
  },
  {
    title: "Bad Girl Good Girl",
    artist: "miss A",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=4337"
  },
  {
    title: "Chu~♡",
    artist: "f(x)",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=4552"
  },
  {
    title: "10점 만점에 10점",
    artist: "2PM",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=4742"
  },
  {
    title: "Hot Issue",
    artist: "4minute",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=4943"
  },
  {
    title: "미스터",
    artist: "카라",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=5150"
  },
  {
    title: "Diva",
    artist: "애프터스쿨",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=5341"
  },
  {
    title: "만만하니",
    artist: "유키스",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=5539"
  },
  {
    title: "삐리빠빠",
    artist: "나르샤",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=5750"
  },
  {
    title: "삐리뽐 빼리뽐",
    artist: "남녀공학",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=5956"
  },
  {
    title: "Brand New",
    artist: "신화",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=6144"
  },
  {
    title: "Rainism (Clean Ver.)",
    artist: "비",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=6370"
  },
  {
    title: "토요일밤에",
    artist: "손담비",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=6585"
  },
  {
    title: "유혹의 소나타",
    artist: "아이비",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=6806"
  },
  {
    title: "내 귀에 캔디 (Feat. 택연 Of 2PM)",
    artist: "백지영",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=7010"
  },
  {
    title: "One More Time",
    artist: "쥬얼리",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=7233"
  },
  {
    title: "낭만 고양이",
    artist: "체리필터",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=7434"
  },
  {
    title: "나에게로 떠나는 여행",
    artist: "버즈",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=7657"
  },
  {
    title: "비행기",
    artist: "거북이",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=7863"
  },
  {
    title: "마쉬멜로우",
    artist: "아이유",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=8075"
  },
  {
    title: "기억을 걷는 시간",
    artist: "넬",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=8268"
  },
  {
    title: "사랑했나봐",
    artist: "윤도현",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=8578"
  },
  {
    title: "친구여 (Feat 인순이)",
    artist: "조pd",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=8811"
  },
  {
    title: "사랑인걸",
    artist: "모세",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=9068"
  },
  {
    title: "내 여자라니까",
    artist: "이승기",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=9321"
  },
  {
    title: "사랑앓이",
    artist: "FTISLAND",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=9566"
  },
  {
    title: "친구의 고백",
    artist: "2AM",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=9808"
  },
  {
    title: "점점",
    artist: "브라운 아이즈",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=10065"
  },
  {
    title: "사랑..그게 뭔데",
    artist: "양파",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=10276"
  },
  {
    title: "총맞은것처럼",
    artist: "백지영",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=10514"
  },
  {
    title: "바람만바람만",
    artist: "김종국 & SG워너비",
    audioUrl: "https://youtu.be/U7mPqycQ0tQ?t=10752"
  }
];

module.exports = songs; 