import { GameState } from "../types/poker.types";

export const DebugFlags = ({ gameState }: { gameState: GameState }) => {
  const { roundStage } = gameState;

  const currentPlayer = gameState.players.find(
    (player) => player.id === gameState.currentPlayerId
  );

  return (
    <div className="absolute top-0 left-0 bg-red-500 text-black p-4">
      <div className="flex gap-2 items-center">
        <div className="font-bold">Round Stage</div>
        <div className="text-sm">{roundStage}</div>
      </div>
      <div className="flex gap-2 items-center">
        <div className="font-bold">Current Player</div>
        <div>{currentPlayer?.name}</div>
      </div>
    </div>
  );
};
