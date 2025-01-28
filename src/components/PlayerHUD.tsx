import React from "react";
import { Player as PlayerType } from "../types/poker.types";
// import { ChipStack } from "./ChipStack";
import { Card } from "./Card";

interface PlayerHUDProps {
  debugMode?: boolean;
  player: PlayerType;
  isCurrentPlayer: boolean;
}

export const PlayerHUD: React.FC<PlayerHUDProps> = ({
  debugMode,
  player,
  isCurrentPlayer,
}) => {
  return (
    <div
      className={`p-4 mb-10 min-w-56 items-center space-y-2 ${
        isCurrentPlayer ? "current-player" : ""
      } ${player.isFolded ? "opacity-50" : ""}`}
    >
      <div className="flex gap-2">
        <div className="flex gap-2 items-center mb-8">
          {/* Avatar */}
          <div
            className={
              "w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-black font-bold "
            }
          >
            {player.name.charAt(0)}
          </div>

          {/* Name */}
          <h3
            className={
              "text-sm font-semibold text-center" +
              (isCurrentPlayer ? "underline bg-red-500" : "")
            }
          >
            {player.name}{" "}
            {/* {player.aiDifficulty ? `(${player.aiDifficulty})` : ""} */}
          </h3>
        </div>
        <div className="flex space-x-1 scale-75">
          {player.hand.map((card, index) => (
            <Card
              key={index}
              value={card.value}
              suit={card.suit}
              open={player.isFolded || debugMode || !player.isBot}
              variant="tiny"
            />
          ))}
        </div>
      </div>
      {player.chipTotal}
      {/* <ChipStack stack={player.chipStack} /> */}
    </div>
  );
};
