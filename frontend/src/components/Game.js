import React, { useState, useEffect, memo, useCallback, useRef } from "react";
import { useAppContext } from "../context/AppContext";
import PlayerList from "./PlayerList";
import YouTube from "react-youtube";

function extractYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

function extractStartFromUrl(url) {
  if (!url) return 0;
  const match = url.match(/[?&]t=(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

const MemoYouTube = memo(function MemoYouTube({ videoId, start, onReady, onStateChange, shouldPlay }) {
  console.log("[MemoYouTube] 렌더링, videoId:", videoId, "shouldPlay:", shouldPlay);
  if (!videoId) return null;
  return (
    <YouTube
      videoId={videoId}
      opts={{
        width: "0",
        height: "0",
        playerVars: {
          autoplay: shouldPlay ? 1 : 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          mute: 0, // 음소거 해제
          enablejsapi: 1, // JavaScript API 활성화
          origin: window.location.origin // 현재 도메인 설정
        }
      }}
      style={{ display: 'none' }}
      onReady={onReady}
      onStateChange={onStateChange}
    />
  );
});

// 게임 설정 컴포넌트
function GameConfig({ onConfigSet }) {
  const [songSets, setSongSets] = useState([]);
  const [questionCounts, setQuestionCounts] = useState([]);
  const [timeOptions, setTimeOptions] = useState([]);
  const [selectedSet, setSelectedSet] = useState('');
  const [selectedCount, setSelectedCount] = useState(10);
  const [selectedTime, setSelectedTime] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // 임시로 하드코딩된 데이터 사용 (API 호출 대신)
    const mockSongSets = [
      { id: '2010s-idols', name: '2010년대 아이돌', songCount: 60 },
      { id: '1990s-dance', name: '90년대 중후반 댄스곡 모음', songCount: 50 },
      { id: '2020s-idols', name: '2020년대 아이돌음악', songCount: 53 }
    ];
    const mockQuestionCounts = [5, 10, 30, 50];
    const mockTimeOptions = [20, 40, 60];
    
    setSongSets(mockSongSets);
    setQuestionCounts(mockQuestionCounts);
    setTimeOptions(mockTimeOptions);
    if (mockSongSets.length > 0) {
      setSelectedSet(mockSongSets[0].id);
    }
    setLoading(false);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedSet && selectedCount && selectedTime) {
      onConfigSet(selectedSet, selectedCount, selectedTime);
    }
  };

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button 
          className="retry-button" 
          onClick={() => window.location.reload()}
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="game-config">
      <h3>게임 설정</h3>
      <form onSubmit={handleSubmit}>
        <div className="config-item">
          <label>노래 세트:</label>
          <select 
            value={selectedSet} 
            onChange={(e) => setSelectedSet(e.target.value)}
            required
          >
            {songSets.map(set => (
              <option key={set.id} value={set.id}>
                {set.name} ({set.songCount}곡)
              </option>
            ))}
          </select>
        </div>
        
        <div className="config-item">
          <label>문제 수:</label>
          <select 
            value={selectedCount} 
            onChange={(e) => setSelectedCount(parseInt(e.target.value))}
            required
          >
            {questionCounts.map(count => (
              <option key={count} value={count}>
                {count}문제
              </option>
            ))}
          </select>
        </div>
        
        <div className="config-item">
          <label>제한 시간:</label>
          <select 
            value={selectedTime} 
            onChange={(e) => setSelectedTime(parseInt(e.target.value))}
            required
          >
            {timeOptions.map(time => (
              <option key={time} value={time}>
                {time}초
              </option>
            ))}
          </select>
        </div>
        
        <button type="submit" className="config-submit">
          게임 시작
        </button>
      </form>
    </div>
  );
}

// 대기 메시지 컴포넌트
function WaitingMessage() {
  return (
    <div className="waiting-message">
      <div className="waiting-icon">⏳</div>
      <div className="waiting-text">방장이 게임 규칙을 정하고 있습니다...</div>
    </div>
  );
}

export default function Game() {
  const { state } = useAppContext();
  const { socket, gameState, players, isHost } = state;
  const [answer, setAnswer] = useState("");
  const [youtubePlayer, setYoutubePlayer] = useState(null);
  const [shouldPlay, setShouldPlay] = useState(false);
  const [gamePhase, setGamePhase] = useState('waiting'); // waiting, config, playing
  const [currentVideoId, setCurrentVideoId] = useState(null);
  const [currentStartTime, setCurrentStartTime] = useState(null);

  // 방장이 처음 들어왔을 때 설정 화면 보여주기
  useEffect(() => {
    console.log("[Game] useEffect - isHost:", isHost, "gameState:", gameState);
    if (isHost && !gameState) {
      console.log("[Game] 방장이고 gameState가 없음 - config 화면으로 설정");
      setGamePhase('config');
    }
  }, [isHost, gameState]);

  // 소켓 메시지 처리
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("[Game] 소켓 메시지 수신:", data.type);
      
      switch (data.type) {
        case 'game_config_set':
          setGamePhase('waiting');
          break;
        case 'server_game_state':
          if (data.payload.phase === 'playing') {
            setGamePhase('playing');
            setShouldPlay(true);
            // 새로운 곡이 시작될 때 비디오 ID와 시작 시간 확인
            const newVideoId = data.payload.song?.videoId;
            const newStartTime = data.payload.song?.startTime;
            
            // 비디오 ID나 시작 시간이 다르면 새로운 곡
            if (newVideoId !== currentVideoId || newStartTime !== currentStartTime) {
              console.log("[Game] 새로운 곡 감지:", newVideoId, newStartTime);
              setCurrentVideoId(newVideoId);
              setCurrentStartTime(newStartTime);
              setShouldPlay(false); // 재생 상태 초기화
              setTimeout(() => setShouldPlay(true), 100); // 약간의 지연 후 재생
            }
          }
          break;
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket, currentVideoId, currentStartTime]);

  // 서버 게임 상태 처리
  useEffect(() => {
    if (gameState?.phase === 'playing' && !shouldPlay) {
      console.log("[Game] 서버 게임 상태: 재생 시작");
      setShouldPlay(true);
    }
  }, [gameState?.phase, shouldPlay]);

  const handleConfigSet = (setId, questionCount, time) => {
    console.log("[Game] 게임 설정 전송:", setId, questionCount, time);
    if (socket) {
      // 1. 게임 설정 전송
      socket.send(JSON.stringify({
        type: 'set_game_config',
        payload: { setId, questionCount, time }
      }));
      
      // 2. 잠시 후 게임 시작 준비
      setTimeout(() => {
        console.log("[Game] 게임 시작 준비 전송");
        socket.send(JSON.stringify({
          type: 'prepare_game',
          payload: {}
        }));
      }, 1000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!answer) return;
    socket && socket.send(JSON.stringify({ type: "submit_answer", payload: { answer } }));
    setAnswer("");
  };

  const audioUrl = gameState?.song?.audioUrl;
  const videoId = gameState?.song?.videoId || extractYouTubeId(audioUrl);
  const start = gameState?.song?.startTime || extractStartFromUrl(audioUrl);

  const handleReady = useCallback((event) => {
    console.log("[YouTube] onReady, start:", start, "shouldPlay:", shouldPlay);
    try {
      setYoutubePlayer(event.target);
      if (start) {
        event.target.seekTo(start, true);
      }
      if (shouldPlay) {
        event.target.playVideo();
      }
    } catch (error) {
      console.log("[Game] YouTube 플레이어 준비 실패:", error);
    }
  }, [start, shouldPlay]);

  const handleStateChange = useCallback((event) => {
    // 1: 재생, 2: 일시정지, 0: 종료, 3: 버퍼링, 5: 큐됨
    console.log("[YouTube] onStateChange:", event.data);
    
    // 재생이 중단되면 다시 재생 시도
    if (event.data === 2 && shouldPlay) { // 일시정지 상태
      setTimeout(() => {
        try {
          if (youtubePlayer && shouldPlay) {
            console.log("[Game] 재생 재시도");
            youtubePlayer.playVideo();
          }
        } catch (error) {
          console.log("[Game] 재생 재시도 실패:", error);
        }
      }, 1000);
    }
  }, [shouldPlay, youtubePlayer]);

  console.log("[Game] 렌더링 - gamePhase:", gamePhase, "isHost:", isHost, "gameState:", gameState);

  // 게임 설정 화면 (방장만)
  if (gamePhase === 'config' && isHost) {
    console.log("[Game] 게임 설정 화면 렌더링");
    return (
      <div className="game-container">
        <GameConfig onConfigSet={handleConfigSet} />
        <PlayerList players={players} />
      </div>
    );
  }

  // 대기 화면 (방장이 설정 중일 때)
  if (gamePhase === 'waiting' && !isHost) {
    console.log("[Game] 대기 화면 렌더링");
    return (
      <div className="game-container">
        <WaitingMessage />
        <PlayerList players={players} />
      </div>
    );
  }

  // 게임 플레이 화면
  console.log("[Game] 게임 플레이 화면 렌더링");
  return (
    <div className="game-container">
      <h2>문제 {gameState?.index || 1}</h2>
      {videoId && (
        <MemoYouTube 
          key={`${videoId}-${start}`}
          videoId={videoId} 
          start={start} 
          onReady={handleReady} 
          onStateChange={handleStateChange} 
          shouldPlay={shouldPlay}
        />
      )}
      {shouldPlay && <div className="playing-indicator">🎵 재생 중...</div>}
      
      <form onSubmit={handleSubmit} className="answer-form">
        <input
          type="text"
          placeholder="노래 제목을 입력하세요"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={gameState?.phase === 'reveal' || gameState?.phase === 'correct'}
        />
        <button type="submit" disabled={gameState?.phase === 'reveal' || gameState?.phase === 'correct'}>
          정답 제출
        </button>
      </form>
      <div className="timer">남은 시간: {gameState?.timeRemaining || gameState?.timeLimit || 20}초</div>
      {gameState?.phase === 'hint' && <div className="hint">가수 힌트: {gameState?.song?.artist}</div>}
      {gameState?.phase === 'reveal' && <div className="reveal">정답: {gameState?.song?.title}</div>}
      {gameState?.phase === 'correct' && (
        <div className="correct">
          정답자: {gameState?.correctPlayer} | 정답: {gameState?.correctAnswer}
        </div>
      )}
      <PlayerList players={players} />
    </div>
  );
} 