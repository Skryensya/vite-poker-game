import { Card } from "./Card";

type CardType = {
  key: string; // Unique identifier, e.g., "A♠"
  value: string;
  suit: string;
};

type DebugDeckProps = {
  deck: CardType[];
  variant?: "big" | "tiny";
};

const suits = ["♠", "♥", "♦", "♣"];
const values = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

// Generate all 52 cards and sort them by suit and value
const allCards: CardType[] = values.flatMap((value) =>
  suits.map((suit) => ({
    key: `${value}${suit}`,
    value,
    suit,
  }))
).sort((a, b) => {
  // Sort by suit first, then by value
  const suitOrder = suits.indexOf(a.suit) - suits.indexOf(b.suit);
  return suitOrder !== 0 ? suitOrder : values.indexOf(a.value) - values.indexOf(b.value);
});

export const DebugDeck: React.FC<DebugDeckProps> = ({
  deck,
  variant = "tiny",
}) => {
  // Create a Set for faster lookup
  const deckSet = new Set(deck.map((card) => card.key));

  return (
    <div className="container mx-auto border-2 scale-75 p-2">
      <div className="flex gap-4 items-center">
        <h1 className="text-2xl font-bold">Debug Deck</h1>
        <span className="text-xl font-bold">{deck.length} / 52</span>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {allCards.map((card) => (
          <div
            key={card.key}
            className={`${deckSet.has(card.key) ? "opacity-100" : "opacity-50"}`}
          >
            <Card
              key={card.key}
              value={card.value}
              suit={card.suit}
              variant={variant}
              open={true} // Assuming you want to show front side
            />
          </div>
        ))}
      </div>
    </div>
  );
};
 
