import React from "react";

export default function PlayerList({ players }) {
  return (
    <div className="player-list">
      <h3>참가자 ({players.length}명)</h3>
      <table>
        <thead>
          <tr>
            <th>닉네임</th>
            <th>점수</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => (
            <tr key={i}>
              <td>{p.name}</td>
              <td>{p.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 