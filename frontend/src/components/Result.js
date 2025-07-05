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
    if (players && players.length > 0) {
      localStorage.setItem("sq_last_players", JSON.stringify(players));
      setLocalPlayers(players);
    } else {
      const saved = localStorage.getItem("sq_last_players");
      if (saved) setLocalPlayers(JSON.parse(saved));
    }
    if (winners && winners.length > 0) {
      localStorage.setItem("sq_last_winners", JSON.stringify(winners));
      setLocalWinners(winners);
    } else {
      const saved = localStorage.getItem("sq_last_winners");
      if (saved) setLocalWinners(JSON.parse(saved));
    }
  }, [players, winners]);

  const winnerNames = (localWinners.length > 0 ? localWinners : winners).map((w) => w.name).join(", ");

  const handleBackToLobby = () => {
    if (state.socket && state.roomCode) {
      state.socket.send(
        JSON.stringify({ type: "leave_room", payload: { roomCode: state.roomCode } })
      );
    }
    dispatch({ type: "SET_PAGE", page: "room" }); // 즉시 로비(방 입장) 화면으로 이동
  };

  return (
    <div className="result-container">
      <h2>게임 종료!</h2>
      <div className="winner">🥇 1등: <b>{winnerNames}</b></div>
      <PlayerList players={localPlayers.length > 0 ? localPlayers : players} />
      <button className="to-lobby-btn" onClick={handleBackToLobby}>
        로비로 돌아가기
      </button>
    </div>
  );
} 