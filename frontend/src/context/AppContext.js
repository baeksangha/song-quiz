import React, { createContext, useReducer, useContext } from "react";

const initialState = {
  socket: null,
  roomCode: "",
  isHost: false,
  nickname: "",
  players: [],
  gameState: null,
  page: "room", // room, lobby, game, result
  error: null,
  winners: [],
};

function reducer(state, action) {
  console.log("[AppContext] 액션:", action.type, "페이로드:", action.payload, "현재 상태:", state);
  
  switch (action.type) {
    case "SET_SOCKET":
      return { ...state, socket: action.socket };
    case "SET_ROOM":
      return { ...state, roomCode: action.roomCode, isHost: action.isHost, page: "lobby", gameState: null };
    case "SET_NICKNAME":
      return { ...state, nickname: action.nickname };
    case "SET_PLAYERS":
      return { ...state, players: action.players };
    case "SET_GAME_STATE":
      return { ...state, gameState: action.gameState, page: "game" };
    case "UPDATE_GAME_STATE":
      return { ...state, gameState: { ...state.gameState, ...action.gameState }, page: "game" };
    case "SET_PAGE":
      console.log("[AppContext] SET_PAGE 액션 처리 - 새로운 페이지:", action.payload);
      return { ...state, page: action.payload, error: action.payload === "room" ? null : state.error };
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "SET_WINNERS":
      return { ...state, winners: action.winners, page: "result" };
    case "RESET":
      return {
        ...initialState,
        socket: null, // 소켓도 초기화
      };
    case "RESET_KEEP_SOCKET":
      return {
        ...initialState,
        socket: state.socket, // 소켓만 유지
      };
    default:
      console.log("[AppContext] 알 수 없는 액션:", action.type);
      return state;
  }
}

const AppContext = createContext();

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
} 