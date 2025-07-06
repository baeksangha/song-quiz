import React, { useState, useEffect, memo, useCallback } from "react";
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

const MemoYouTube = memo(function MemoYouTube({ videoId, start, onReady, onStateChange, audioUrl }) {
  console.log("[MemoYouTube] 렌더링, videoId:", videoId, "audioUrl:", audioUrl);
  if (!videoId) return null;
  return (
    <YouTube
      key={audioUrl} // audioUrl 전체를 key로 사용하여 다른 구간도 새로운 컴포넌트로 인식
      videoId={videoId}
      opts={{
        width: "0",
        height: "0",
        playerVars: {
          autoplay: 1
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
  const [time, setTime] = useState(60);
  const [hint, setHint] = useState("");
  const [reveal, setReveal] = useState(false);

  // 타이머 관리 - index가 변경될 때만 리셋
  useEffect(() => {
    setTime(60);
    setHint("");
    setReveal(false);
    if (!gameState) return;
    const timer = setInterval(() => {
      setTime((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState?.index]); // eslint-disable-line react-hooks/exhaustive-deps

  // 힌트/정답 공개 처리
  useEffect(() => {
    if (gameState?.hint) setHint(gameState.hint);
    if (gameState?.reveal) setReveal(true);
  }, [gameState]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!answer) return;
    socket && socket.send(JSON.stringify({ type: "submit_answer", payload: { answer } }));
    setAnswer("");
  };

  const audioUrl = gameState?.song?.audioUrl;
  const videoId = extractYouTubeId(audioUrl);
  const start = extractStartFromUrl(audioUrl);

  const handleReady = useCallback((event) => {
    console.log("[YouTube] onReady, start:", start);
    if (start) {
      event.target.seekTo(start, true);
    }
    event.target.playVideo();
  }, [start]);

  const handleStateChange = useCallback((event) => {
    // 1: 재생, 2: 일시정지, 0: 종료, 3: 버퍼링, 5: 큐됨
    console.log("[YouTube] onStateChange:", event.data);
  }, []);

  console.log("[Game] 렌더링, gameState index:", gameState?.index, "hint:", gameState?.hint);

  return (
    <div className="game-container">
      <h2>문제 {gameState?.index || 1}</h2>
      {videoId && (
        <MemoYouTube videoId={videoId} start={start} onReady={handleReady} onStateChange={handleStateChange} audioUrl={audioUrl} />
      )}
      <form onSubmit={handleSubmit} className="answer-form">
        <input
          type="text"
          placeholder="노래 제목을 입력하세요"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={reveal}
        />
        <button type="submit" disabled={reveal}>정답 제출</button>
      </form>
      <div className="timer">남은 시간: {time}초</div>
      {hint && <div className="hint">가수 힌트: {hint}</div>}
      {reveal && <div className="reveal">정답: {gameState?.song?.title || "(정답 공개)"}</div>}
      <PlayerList players={players} />
    </div>
  );
} 