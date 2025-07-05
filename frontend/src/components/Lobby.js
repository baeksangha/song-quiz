import React from "react";
import { useAppContext } from "../context/AppContext";
import PlayerList from "./PlayerList";

export default function Lobby() {
  const { state } = useAppContext();
  const { isHost, socket, roomCode, players, page, gameState } = state;

  const handleStart = () => {
    socket && socket.send(JSON.stringify({ type: "start_game" }));
  };

  // page가 'lobby'이고, gameState가 null일 때만 버튼 보이기
  const showStartButton = isHost && page === "lobby" && !gameState;

  return (
    <div className="lobby-container">
      <h2>대기실 - 방 코드: {roomCode}</h2>
      <PlayerList players={players} />
      {showStartButton ? (
        <button className="start-btn" onClick={handleStart}>
          게임 시작
        </button>
      ) : (
        <div className="wait-msg">방장이 게임을 시작할 때까지 기다려주세요.</div>
      )}
    </div>
  );
} 