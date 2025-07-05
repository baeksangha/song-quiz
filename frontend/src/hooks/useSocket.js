import { useEffect, useRef, useCallback } from "react";

const WS_URL = process.env.REACT_APP_WS_URL || "ws://localhost:4000";

export default function useSocket(dispatch) {
  const socketRef = useRef(null);

  const stableDispatch = useCallback(dispatch, [dispatch]);

  useEffect(() => {
    console.log("소켓 연결 시도:", WS_URL);
    
    try {
      let socket = new window.WebSocket(WS_URL);
    socketRef.current = socket;

      socket.onopen = () => {
        console.log("소켓 연결 성공");
        stableDispatch({ type: "SET_SOCKET", socket });
      };

    socket.onmessage = (event) => {
        console.log("소켓 메시지 수신:", event.data);
      let data;
      try { data = JSON.parse(event.data); } catch { return; }
      const { type, payload } = data;
        
        console.log("파싱된 메시지:", { type, payload });
        
      // 서버에서 오는 메시지 타입별로 dispatch
      if (type === "room_joined") {
          console.log("방 입장 성공:", payload);
          stableDispatch({ type: "SET_ROOM", roomCode: payload.roomCode, isHost: payload.isHost });
      } else if (type === "room_error") {
          console.log("방 에러:", payload.error);
          stableDispatch({ type: "SET_ERROR", error: payload.error });
      } else if (type === "update_players") {
          stableDispatch({ type: "SET_PLAYERS", players: payload.players });
        } else if (type === "game_state") {
          stableDispatch({ type: "SET_GAME_STATE", gameState: payload });
      } else if (type === "hint") {
          // 기존 gameState를 유지하면서 hint만 추가
          stableDispatch({ type: "UPDATE_GAME_STATE", gameState: { hint: payload.hint, index: payload.index } });
      } else if (type === "reveal_answer") {
          // 기존 gameState를 유지하면서 reveal만 추가
          stableDispatch({ type: "UPDATE_GAME_STATE", gameState: { reveal: true, answer: payload.answer } });
      } else if (type === "score_update") {
          stableDispatch({ type: "SET_PLAYERS", players: payload.players });
        // 정답자/정답 정보는 gameState에 추가로 저장 가능
      } else if (type === "game_end") {
          stableDispatch({ type: "SET_WINNERS", winners: payload.winners });
      }
    };

      socket.onclose = (event) => {
        console.log("소켓 연결 종료:", event.code, event.reason);
        stableDispatch({ type: "SET_SOCKET", socket: null });
    };

      socket.onerror = (error) => {
        console.log("소켓 에러:", error);
        console.log("소켓 readyState:", socket.readyState);
      };

      // 연결 상태 확인을 위한 타이머
      const checkConnection = setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          console.log("소켓 연결 실패 - readyState:", socket.readyState);
          console.log("WebSocket.OPEN:", WebSocket.OPEN);
          console.log("WebSocket.CONNECTING:", WebSocket.CONNECTING);
          console.log("WebSocket.CLOSING:", WebSocket.CLOSING);
          console.log("WebSocket.CLOSED:", WebSocket.CLOSED);
        }
      }, 3000);

    return () => {
        clearTimeout(checkConnection);
      socket.close();
    };
    } catch (error) {
      console.log("소켓 생성 에러:", error);
    }
  }, [stableDispatch]);

  return socketRef.current;
} 