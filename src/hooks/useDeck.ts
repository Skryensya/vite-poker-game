import { useState, useRef, useCallback } from "react";
import { Card, PlayerRecord } from "../types/poker.types";
import { SUITS, VALUES } from "../utils/constants";


export const useDeck = () => {
  const originalDeckRef = useRef<Card[]>(shuffleDeck(createDeck()));
  const originalDeck = [...originalDeckRef.current];
  const [deck, setDeck] = useState<Card[]>([...originalDeck]);
  const [burnedCards, setBurnedCards] = useState<Card[]>([]);

  // Fisher-Yates shuffle implementation

  // Helper to burn a card and update state synchronously
  const burnCard = useCallback(() => {
    const currentDeck = [...deck];
    const burn = currentDeck.pop();
    if (burn) {
      setBurnedCards((prev) => [...prev, burn]);
    } else {
      console.error("No se pudo quemar una carta");
    }
    setDeck(currentDeck);
    return { currentDeck, burn }; // Return updated deck for chaining
  }, [deck, setDeck, setBurnedCards]);

  const resetDeck = () => {
    const shuffled = shuffleDeck([...originalDeck]);
    setDeck(shuffled);
    setBurnedCards([]);
    originalDeckRef.current = shuffled;
  };

  const giveHandsToPlayers = (
    playerIds: number[]
  ): { playerRecords: PlayerRecord[]; remainingDeck: Card[] } | void => {
    const cardsPerPlayer = 2;
    const totalCardsNeeded = playerIds.length * cardsPerPlayer;

    if (deck.length !== 52) {
      console.error("Deck is not 52 cards");
      return;
    }

    if (playerIds.length === 0) {
      console.error("No hay jugadores para repartir las cartas.");
      return;
    }

    if (deck.length < totalCardsNeeded) {
      console.error("No hay suficientes cartas en el mazo para repartir.");
      return;
    }

    // Tomar las cartas desde el final del mazo para mantener la determinismo
    const dealtCards = deck.slice(-totalCardsNeeded);
    const remainingDeck = deck.slice(0, -totalCardsNeeded);
    setDeck(remainingDeck);

    // Inicializar los registros de los jugadores
    const playerRecords: PlayerRecord[] = playerIds.map((id) => ({
      id,
      hand: [],
    }));

    // Implementar un contador separado para rastrear el jugador actual
    let currentPlayer = 0;

    for (const card of dealtCards) {
      if (currentPlayer >= playerRecords.length) {
        currentPlayer = 0; // Reiniciar el contador si excede el número de jugadores
      }
      playerRecords[currentPlayer].hand.push(card);
      currentPlayer++;
    }

    // console.log("playerRecords:", playerRecords);
    // console.log("remainingDeck length:", remainingDeck.length);

    return { playerRecords, remainingDeck };
  };

  const getFlop = useCallback(() => {
    const { currentDeck, burn } = burnCard(); // Burn a card
    const flop = currentDeck.slice(-3);
    const remainingDeck = currentDeck.slice(0, -3);
    setDeck(remainingDeck);
    return { flop, burnedCards: [burn], remainingDeck };
  }, [burnCard, setDeck]);

  const getTurn = useCallback(() => {
    const { currentDeck, burn } = burnCard(); // Burn a card
    const turn = currentDeck.slice(-1);
    const remainingDeck = currentDeck.slice(0, -1);
    setDeck(remainingDeck);
    return { turn, burnedCards: [burn], remainingDeck };
  }, [burnCard, setDeck]);

  const getRiver = useCallback(() => {
    const { currentDeck, burn } = burnCard(); // Burn a card
    const river = currentDeck.slice(-1);
    const remainingDeck = currentDeck.slice(0, -1);
    setDeck(remainingDeck);
    return { river, burnedCards: [burn], remainingDeck };
  }, [burnCard, setDeck]);

  return {
    deck,
    burnedCards,
    giveHandsToPlayers,
    getFlop,
    getTurn,
    getRiver,
    originalDeck: [...originalDeckRef.current],
    resetDeck,
  };
};

// Create a standard 52-card deck
export const createDeck = (): Card[] =>
  SUITS.flatMap((suit) =>
    VALUES.map((value) => ({
      suit,
      value,
      key: `${value}${suit}`,
    }))
  );

  const shuffleDeck = (deck: Card[]): Card[] => {
    const shuffledDeck = [...deck];
    for (let i = shuffledDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
    }
    return shuffledDeck;
  };

