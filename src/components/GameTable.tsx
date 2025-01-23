import React from "react";
import { GameTableProps } from "../types/poker.types";
import { Card } from "./Card";
import { FaceDownCards } from "./FaceDownCards";
import { ChipStack } from "./ChipStack";

export const GameTable: React.FC<GameTableProps> = ({
  remainingDeckCards,
  burnedCards,
  board,
  pots,
}) => {
  const { flop, turn, river } = board;

  return (
    <div className="bg-green-700 rounded-lg p-4 grid grid-cols-12">
      {pots.length > 0 && (
        <div>
          <ChipStack stack={pots[0].total} />
        </div>
      )}
      <div className="col-span-10 flex">
        <div className="flex flex-wrap gap-2 my-10">
          {remainingDeckCards.length > 0 && (
            <FaceDownCards numberOfCards={remainingDeckCards.length} />
          )}
          {burnedCards.length > 0 && (
            <FaceDownCards numberOfCards={burnedCards.length} />
          )}
          {/* Flop: the first 3 community cards */}
          <>
            {flop?.map(({ key, value, suit }) => (
              <Card key={key} value={value} suit={suit} open={true} />
            ))}
          </>

          {/* Turn: the 4th community card */}
          {turn && turn.length > 0 && (
            <>
              {turn.map(({ key, value, suit }) => (
                <Card key={key} value={value} suit={suit} open={true} />
              ))}
            </>
          )}

          {/* River: the 5th community card */}
          {river && river.length > 0 && (
            <>
              {river.map(({ key, value, suit }) => (
                <Card key={key} value={value} suit={suit} open={true} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
