import { Card } from "../Card";
import { Card as CardType } from "../../types/poker.types";

// Helper function to define the order of suits
const suitOrder: { [key: string]: number } = {
  Clubs: 1,
  Diamonds: 2,
  Hearts: 3,
  Spades: 4,
};

// Helper function to define the order of card values
const valueOrder: { [key: string]: number } = {
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

// Function to sort the deck by suit and then by value
const sortDeckBySuitAndValue = (deck: CardType[]): CardType[] => {
  return [...deck].sort((a, b) => {
    if (suitOrder[a.suit] !== suitOrder[b.suit]) {
      return suitOrder[a.suit] - suitOrder[b.suit];
    }
    return valueOrder[a.value] - valueOrder[b.value];
  });
};

// Function to group cards by suit
const groupBySuit = (deck: CardType[]): { [key: string]: CardType[] } => {
  return deck.reduce((groups, card) => {
    if (!groups[card.suit]) {
      groups[card.suit] = [];
    }
    groups[card.suit].push(card);
    return groups;
  }, {} as { [key: string]: CardType[] });
};

export const DebugDeck = ({
  deck,
  originalDeck,
  burnedCards,
}: {
  deck: CardType[];
  originalDeck: CardType[];
  burnedCards: CardType[];
}) => {
  // Sort the originalDeck to ensure all cards are present and sorted
  const sortedOriginalDeck = sortDeckBySuitAndValue(originalDeck);
  const groupedSortedOriginalDeck = groupBySuit(sortedOriginalDeck);

  // Function to check if a card is burned
  const isBurned = (card: CardType) => {
    return burnedCards.some((burnedCard) => burnedCard.key === card.key);
  };

  return (
    <div className=" border-2 p-2">
      {/* Original Order */}
      <h2 className="text-xl font-bold mb-2">Original Deck Order</h2>
      <div className="flex flex-wrap gap-1 mt-2 ">
        {originalDeck.map((card) => (
          <div
            key={card.key}
            className={`relative ${
              deck.find((c) => c.key === card.key)
                ? "opacity-100"
                : "opacity-50"
            }`}
          >
            <Card
              key={card.key}
              value={card.value}
              suit={card.suit}
              variant="tiny"
              open={true}
            />
            {isBurned(card) && (
              <div className="absolute inset-0 bg-red-500 opacity-50 pointer-events-none"></div>
            )}
          </div>
        ))}
      </div>

      {/* Sorted Order */}
      <h2 className="text-xl font-bold mt-4 mb-2">
        Sorted Deck (Grouped by Suit and Value)
      </h2>
      {Object.keys(groupedSortedOriginalDeck).flatMap((suit) => (
        <div key={suit} className="mb-1 flex gap-1 flex-wrap items-center">
          {groupedSortedOriginalDeck[suit].map((card) => (
            <div
              key={card.key}
              className={`relative flex flex-wrap items-center gap-1 ${
                deck.find((c) => c.key === card.key)
                  ? "opacity-100"
                  : "opacity-50"
              }`}
            >
              <Card
                key={card.key}
                value={card.value}
                suit={card.suit}
                variant="tiny"
                open={true}
              />
              {isBurned(card) && (
                <div className="absolute inset-0 bg-red-500 opacity-50 pointer-events-none"></div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
