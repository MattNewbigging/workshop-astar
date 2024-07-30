import { Button } from "@blueprintjs/core";
import { GameState } from "../../game/game-state";
import "./game-screen.scss";
import React from "react";

interface GameScreenProps {
  gameState: GameState;
}

export const GameScreen: React.FC<GameScreenProps> = ({ gameState }) => {
  return (
    <div className="game-screen">
      <Button
        className="button"
        text={"Generate Grid"}
        icon="grid"
        onClick={gameState.generateGrid}
      />
      <Button
        className="button"
        text={"Place Agent"}
        icon="walk"
        onClick={(e) => {
          e.stopPropagation();
          gameState.startPlacingAgent();
        }}
      />
    </div>
  );
};
