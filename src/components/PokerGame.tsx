import React, { useEffect } from "react";
import { usePokerGame } from "../hooks/usePokerGame";
import { PlayerHUD } from "./PlayerHUD";
import { GameTable } from "./GameTable";
// // import { Card } from "./Card";
import { DebugDeck } from "./debug/DebugDeck";
// import { DebugFlags } from "./debug/DebugFlags";

const IS_DEBUG = true;

const PokerGame: React.FC = () => {
  // Destructure everything we need from the custom hook
  const { gameState, resetGame, playTurn, originalDeck } = usePokerGame();

  // useEffect(() => {
  //   console.log("___originalDeck", originalDeck.map((c) => c.key).join(", "));
  // }, [originalDeck]);

  const { gameCurrentStage, currentPlayerId, players, burnedCards } = gameState;

  // console.log({ gameState });

  return (
    <div className="  w-screen h-screen bg-green-900 text-white overflow-x-hidden">
      <div className="flex gap-2 container mx-auto">
        <button
          onClick={resetGame}
          className="bg-blue-500 text-white p-2 rounded-md"
        >
          Reset Game
        </button>
        <button
          onClick={playTurn}
          className="bg-blue-500 text-white p-2 rounded-md"
        >
          Play Turn
        </button>
      </div>
      <DebugDeck
        deck={gameState.deck}
        originalDeck={originalDeck}
        burnedCards={burnedCards}
      />
      {IS_DEBUG && (
        <div className="flex flex-col gap-2 p-4 container mx-auto border border-red-500">
          <div>Game Stage: {gameCurrentStage}</div>

          <div>
            Current Player:{" "}
            {players.find((p) => p.id === currentPlayerId)?.name}
          </div>
        </div>
      )}
      <div>
        <GameTable
          debugMode={IS_DEBUG}
          remainingDeckCards={gameState.deck}
          burnedCards={gameState.burnedCards}
          board={gameState.board}
          pot={gameState.pot}
          showdown={gameState.showdown}
        />
      </div>

      <div className="flex flex-wrap gap-2  container mx-auto">
        {gameState.players.map((player) => (
          <PlayerHUD
            key={player.id}
            debugMode={IS_DEBUG}
            player={player}
            isCurrentPlayer={gameState.currentPlayerId === player.id}
          />
        ))}
      </div>
    </div>
  );
};

export default PokerGame;
