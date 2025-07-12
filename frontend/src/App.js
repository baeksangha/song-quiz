import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AppProvider, useAppContext } from "./context/AppContext";
import useSocket from "./hooks/useSocket";
import RoomForm from "./components/RoomForm";
import Lobby from "./components/Lobby";
import Game from "./components/Game";
import Result from "./components/Result";
import "./styles/main.css";

function MainRouter() {
  const { state, dispatch } = useAppContext();
  useSocket(dispatch);

  console.log("[MainRouter] 현재 페이지:", state.page, "전체 상태:", state);

  if (state.page === "room") return <RoomForm />;
  if (state.page === "lobby") return <Lobby />;
  if (state.page === "game") return <Game />;
  if (state.page === "result") return <Result />;
  return <div>Loading...</div>;
}

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/*" element={<MainRouter />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}
