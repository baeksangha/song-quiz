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

const MemoYouTube = memo(function MemoYouTube({ videoId, start, onReady, onStateChange, audioUrl, shouldPlay }) {
  console.log("[MemoYouTube] 렌더링, videoId:", videoId, "shouldPlay:", shouldPlay);
  if (!videoId) return null;
  return (
    <YouTube
      key={audioUrl}
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

export default function Game() {
  const { state } = useAppContext();
  const { socket, gameState, players } = state;
  const [answer, setAnswer] = useState("");
  const [youtubePlayer, setYoutubePlayer] = useState(null);
  const [shouldPlay, setShouldPlay] = useState(false);

  // 서버 게임 상태 처리
  useEffect(() => {
    if (gameState?.phase === 'playing' && !shouldPlay) {
      console.log("[Game] 서버 게임 상태: 재생 시작");
      setShouldPlay(true);
    }
  }, [gameState?.phase, shouldPlay]);

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

  console.log("[Game] 렌더링, gameState:", gameState, "shouldPlay:", shouldPlay);

  return (
    <div className="game-container">
      <h2>문제 {gameState?.index || 1}</h2>
      {videoId && (
        <MemoYouTube 
          videoId={videoId} 
          start={start} 
          onReady={handleReady} 
          onStateChange={handleStateChange} 
          audioUrl={audioUrl}
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
      <div className="timer">남은 시간: {gameState?.timeRemaining || 60}초</div>
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