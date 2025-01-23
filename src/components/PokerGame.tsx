import React from "react";
import { usePokerGame } from "../hooks/usePokerGame";
import { Player } from "./Player";
import { GameTable } from "./GameTable";
// import { Card } from "./Card";
import { DebugDeck } from "./DebugDeck";
const PokerGame: React.FC = () => {
  // Destructure everything we need from the custom hook
  const { gameState, playerFold, playerCheck, playerCall, playerBet } =
    usePokerGame();

  // useEffect(() => {
  //   console.log(gameState);
  // }, [gameState]);

  return (
    <div className="  w-screen h-screen bg-green-900 text-white overflow-x-hidden">
      <DebugDeck deck={gameState.deck} />

      {/* The "table" in the center, showing pot + community board */}
      {/* The "table" in the center, showing pot + community board */}
      <GameTable
        remainingDeckCards={gameState.deck}
        burnedCards={gameState.burnCards}
        board={gameState.board} // All community cards: flop, turn, river
        pots={gameState.pots}
        showdown={gameState.showdown}
      />

      {/* Players, placed in corners or wherever your <Player> component positions them */}
      <div className="flex gap-2 items-center justify-evenly">
        {gameState.players.map((player, i) => (
          <Player
            key={player.name + i}
            player={player}
            isCurrentPlayer={gameState.currentPlayerId === player.id}
          />
        ))}
      </div>

      {/* add a floating pannel of button on the bottom to do the actions available */}

      {/* playerFold, playerCheck, playerCall, playerBet */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center items-center">
        <div className="flex gap-2 py-2  w-full items-center justify-center">
          <button
            onClick={() => playerFold(0)}
            className="bg-red-500 px-4 py-2 rounded-md"
          >
            Fold
          </button>
          <button
            onClick={() => playerCheck(0)}
            className="bg-green-500 px-4 py-2 rounded-md"
          >
            Check
          </button>
          <button
            onClick={() => playerCall(0)}
            className="bg-blue-500 px-4 py-2 rounded-md"
          >
            Call
          </button>
          <button
            onClick={() => playerBet(0, 100)}
            className="bg-yellow-500 px-4 py-2 rounded-md"
          >
            Bet
          </button>
        </div>
      </div>
    </div>
  );
};

export default PokerGame;
