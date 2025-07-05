import React, { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";

export default function RoomForm() {
  const { state, dispatch } = useAppContext();
  const [roomCode, setRoomCode] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [mode, setMode] = useState("create"); // create or join

  useEffect(() => {
    dispatch({ type: "SET_ERROR", error: null });
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!roomCode || !password || !nickname) return;
    
    console.log("방 생성/입장 시도:", { mode, roomCode, nickname });
    
    // 닉네임을 state에 저장
    dispatch({ type: "SET_NICKNAME", nickname });
    
    const msg = {
      type: mode === "create" ? "create_room" : "join_room",
      payload: { roomCode, password, nickname },
    };
    
    if (state.socket && state.socket.readyState === 1) {
      state.socket.send(JSON.stringify(msg));
      console.log("소켓 메시지 전송:", msg);
    } else {
      console.log("소켓이 아직 연결되지 않았습니다. 메시지 전송 실패.");
      // 필요하다면 재시도 로직 추가
    }
  };

  return (
    <div className="room-form-container">
      <h2>노래 맞추기 게임</h2>
      <form onSubmit={handleSubmit} className="room-form">
        <input
          type="text"
          placeholder="방 코드"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          maxLength={12}
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          maxLength={12}
        />
        <input
          type="text"
          placeholder="닉네임"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={10}
        />
        <div className="room-form-buttons">
          <button
            type="button"
            className={mode === "create" ? "active" : ""}
            onClick={() => setMode("create")}
          >
            방 생성
          </button>
          <button
            type="button"
            className={mode === "join" ? "active" : ""}
            onClick={() => setMode("join")}
          >
            방 입장
          </button>
        </div>
        <button type="submit" className="submit-button">
          {mode === "create" ? "방 생성하기" : "방 입장하기"}
        </button>
        {state.error && <div className="error-msg">{state.error}</div>}
      </form>
    </div>
  );
} 