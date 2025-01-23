import React from "react";
import { GameTableProps } from "../types/poker.types";
import { Card } from "./Card";
import { FaceDownCards } from "./FaceDownCards";
import { ChipStack } from "./ChipStack";
import { getStackTotalCLP } from "../utils/pokerUtils";
export const GameTable: React.FC<GameTableProps> = ({
  remainingDeckCards,
  burnedCards,
  board,
  pot,
  //   showdown,
  //   onDealFlop,
  //   onDealTurn,
  //   onDealRiver,
  //   onShowdown,
}) => {
  // Destructure your separate arrays from the board object
  const { flop, turn, river } = board;

  return (
    <div className="bg-green-700 rounded-lg p-4 grid grid-cols-12">
      <div>
        <ChipStack stack={pot} />
      </div>
      <div className="col-span-10 flex">
        <h2 className="text-xl mb-2">Pot: {getStackTotalCLP(pot)}</h2>

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

      {/* Show the dealing buttons if not at showdown yet
      {!showdown && (
        <div className="flex space-x-2">
          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
            onClick={onDealFlop}
          >
            Deal Flop
          </button>
          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
            onClick={onDealTurn}
          >
            Deal Turn
          </button>
          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
            onClick={onDealRiver}
          >
            Deal River
          </button>
          <button
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
            onClick={onShowdown}
          >
            Showdown
          </button>
        </div>
      )}

      {showdown && <p className="mt-2">Winner Determined!</p>} */}
    </div>
  );
};
