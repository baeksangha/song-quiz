import React from "react";
import { useAppContext } from "../context/AppContext";
import PlayerList from "./PlayerList";

export default function Lobby() {
  const { state, dispatch } = useAppContext();
  const { isHost, roomCode, players, page, gameState } = state;

  console.log("[Lobby] 렌더링 - isHost:", isHost, "page:", page, "gameState:", gameState);

  const handleStart = () => {
    console.log("[Lobby] 게임 설정하기 버튼 클릭됨");
    // start_game 메시지 전송 없이 게임 설정 화면으로 이동만
    dispatch({ type: 'SET_PAGE', payload: 'game' });
    console.log("[Lobby] SET_PAGE 액션 디스패치됨");
  };

  // page가 'lobby'이고, gameState가 null일 때만 버튼 보이기
  const showStartButton = isHost && page === "lobby" && !gameState;
  console.log("[Lobby] showStartButton:", showStartButton);

  return (
    <div className="lobby-container">
      <h2>대기실 - 방 코드: {roomCode}</h2>
      <PlayerList players={players} />
      {showStartButton ? (
        <button className="start-btn" onClick={handleStart}>
          게임 설정하기
        </button>
      ) : (
        <div className="wait-msg">방장이 게임을 시작할 때까지 기다려주세요.</div>
      )}
    </div>
  );
} 