import { GameState } from "../../game/game-state";
import "./game-screen.scss";
import React from "react";

interface GameScreenProps {
  gameState: GameState;
}

export const GameScreen: React.FC<GameScreenProps> = ({ gameState }) => {
  return (
    <div className="game-screen">
      <div className="button" onClick={gameState.generateGrid}>
        Generate Grid
      </div>
    </div>
  );
};
