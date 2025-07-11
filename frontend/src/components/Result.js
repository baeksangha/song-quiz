import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import PlayerList from "./PlayerList";

export default function Result() {
  const { state, dispatch } = useAppContext();
  const { players, winners } = state;

  // 로컬에 저장된 결과 불러오기
  const [localPlayers, setLocalPlayers] = useState([]);
  const [localWinners, setLocalWinners] = useState([]);

  useEffect(() => {
    console.log("결과 화면 - 플레이어:", players);
    console.log("결과 화면 - 승자:", winners);
    
    if (players && players.length > 0) {
      const playersWithScores = players.map(p => ({
        ...p,
        score: p.score || 0
      }));
      localStorage.setItem("sq_last_players", JSON.stringify(playersWithScores));
      setLocalPlayers(playersWithScores);
    } else {
      const saved = localStorage.getItem("sq_last_players");
      if (saved) setLocalPlayers(JSON.parse(saved));
    }
    
    if (winners && winners.length > 0) {
      const winnersWithScores = winners.map(w => ({
        ...w,
        score: w.score || 0
      }));
      localStorage.setItem("sq_last_winners", JSON.stringify(winnersWithScores));
      setLocalWinners(winnersWithScores);
    } else {
      const saved = localStorage.getItem("sq_last_winners");
      if (saved) setLocalWinners(JSON.parse(saved));
    }
  }, [players, winners]);

  const winnerNames = (localWinners.length > 0 ? localWinners : winners)
    .map((w) => `${w.name} (${w.score}점)`)
    .join(", ");

  const handleBackToLobby = () => {
    if (state.socket && state.roomCode) {
      state.socket.send(
        JSON.stringify({ type: "leave_room", payload: { roomCode: state.roomCode } })
      );
    }
    dispatch({ type: "SET_PAGE", page: "room" });
  };

  const displayPlayers = localPlayers.length > 0 ? localPlayers : players;
  
  return (
    <div className="result-container">
      <h2>게임 종료!</h2>
      <div className="winner">🥇 우승자: <b>{winnerNames}</b></div>
      <PlayerList players={displayPlayers} />
      <button className="to-lobby-btn" onClick={handleBackToLobby}>
        로비로 돌아가기
      </button>
    </div>
  );
} 