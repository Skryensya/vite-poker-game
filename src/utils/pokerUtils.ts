import { Card, ChipStack, Denom, Player, BotPlayer, Pot } from "../types/poker.types";
import {
  DENOMINATIONS,
  SUITS,
  VALUES,
  STARTING_MONEY,
  PLAYER_NAMES,
  BOT_PLAYERS_DIFFICULTY,
} from "./constants";

export const createPlayers = (numberOfPlayers: number): (Player | BotPlayer)[] => {
  const players: (Player | BotPlayer)[] = [];
  players.push({
    id: 0,
    name: "You",
    hand: [],
    chipStack: defaultChipStack(STARTING_MONEY),
    isFolded: false,
    isDealer: true,
    isSmallBlind: false,
    isBigBlind: false,
  });
  for (let i = 0; i < numberOfPlayers; i++) {
    players.push({
      id: i + 1,
      name: PLAYER_NAMES[i],
      hand: [],
      chipStack: defaultChipStack(STARTING_MONEY),
      isFolded: false,
      isBot: true,
      decisionMaker: createAIDecisionMaker(BOT_PLAYERS_DIFFICULTY),
      aiDifficulty: BOT_PLAYERS_DIFFICULTY,
      isDealer: false,
      isSmallBlind: false,
      isBigBlind: false,
    });
  }
  return players;
};

/*
========================================
    STACK UTILS
========================================
*/

export const createDeck = (): Card[] =>
  SUITS.flatMap((suit) =>
    VALUES.map((value) => ({
      suit,
      value,
      key: `${value}${suit}`,
    }))
  );

export const shuffleDeck = (deck: Card[]): Card[] =>
  [...deck].sort(() => Math.random() - 0.5);

export const createPot = (total: number, players: number[]): Pot => ({
  total: defaultChipStack(total),
  players,
  bets: [],
  isActive: true,
});

export const addBetToPot = (
  pot: Pot,
  playerId: number,
  amount: number
): Pot => {
  const newPot = { ...pot };
  newPot.total = addToStack(newPot.total, amount);
  newPot.bets.push({
    playerId,
    chipStack: addToStack(newPot.bets[playerId].chipStack, amount),
  });
  return newPot;
};

export const defaultChipStack = (total: number): ChipStack => {
  // Define chip denominations in descending order
  const denominations = DENOMINATIONS;

  // Initialize the stack with zero counts for each denomination
  const stack: ChipStack = {
    10: 0,
    50: 0,
    100: 0,
    500: 0,
    1000: 0,
  };
  denominations.forEach((denom) => {
    stack[denom as Denom] = 0;
  });

  let remaining = total;

  // Phase 1: Balanced Round-Robin Assignment
  let assignedInThisRound: boolean;

  do {
    assignedInThisRound = false;

    for (const denom of denominations) {
      if (remaining >= denom) {
        stack[denom as Denom] += 1;
        remaining -= denom;
        assignedInThisRound = true;

        // Debug information
        // console.log(`Assigned 1x${denom}, remaining total: ${remaining}`);
      }
    }
  } while (remaining > 0 && assignedInThisRound);

  // Phase 2: Fill Remaining with Largest Denominations
  if (remaining > 0) {
    for (const denom of denominations) {
      if (remaining >= denom) {
        const count = Math.floor(remaining / denom);
        stack[denom as Denom] += count;
        remaining -= denom * count;

        // Debug information
        // console.log(
        //   `Phase 2: Assigned ${count}x${denom}, remaining total: ${remaining}`
        // );
      }
    }
  }

  // Final Check for Remaining Amount
  if (remaining > 0) {
    console.warn(
      `Unable to distribute the remaining ${remaining} with available denominations.`
    );
  }

  return stack;
};

export const deductFromStack = (
  stack: ChipStack,
  amount: number
): ChipStack => {
  const newStack = { ...stack };
  let remaining = amount;

  // Start from largest denominations
  for (const denom of DENOMINATIONS.slice().reverse()) {
    while (remaining >= denom && newStack[denom as Denom] > 0) {
      newStack[denom as Denom]--;
      remaining -= denom;
    }
    if (remaining === 0) break;
  }
  return newStack;
};

export const addToStack = (stack: ChipStack, amount: number): ChipStack => {
  const newStack = { ...stack };
  let remaining = amount;

  for (const denom of DENOMINATIONS.slice().reverse()) {
    const count = Math.floor(remaining / denom);
    newStack[denom as Denom] += count;
    remaining = remaining % denom;
  }
  return newStack;
};

export const getStackTotal = (stack: Record<number, number>): number =>
  DENOMINATIONS.reduce((sum, denom) => sum + denom * (stack[denom] || 0), 0);

export const getStackTotalCLP = (stack: Record<number, number>): string => {
  const total = DENOMINATIONS.reduce(
    (sum, denom) => sum + denom * (stack[denom] || 0),
    0
  );
  return total.toLocaleString("es-CL", { style: "currency", currency: "CLP" });
};

/*
========================================
    Bot Player Utils
========================================
*/

type DifficultyLevel = 1 | 2 | 3 | 4 | 5;
export function createAIDecisionMaker(difficulty: DifficultyLevel) {
  if (difficulty < 1 || difficulty > 5) {
    throw new Error("Difficulty must be between 1 and 5");
  }

  return function (hand: Card[], tableCards: Card[]): number {
    const baseConfidence = evaluateConfidence(hand, tableCards);

    const factorBase = 0.5 + 0.1 * difficulty;

    const scaleRandom = 0.6 - 0.1 * difficulty;

    const randomOffset = (Math.random() - 0.5) * 2 * scaleRandom;

    let finalConfidence = baseConfidence * factorBase + randomOffset;

    if (tableCards.length === 3) {
      finalConfidence += 0.01 * difficulty;
    }

    if (finalConfidence < 0.1) {
      finalConfidence = 0.1;
    } else if (finalConfidence > 1) {
      finalConfidence = 1;
    }

    return finalConfidence;
  };
}

/*
========================================
    Evaluate Hand Strength
========================================
*/

export function evaluateConfidence(hand: Card[], tableCards: Card[]) {
  const MAX_CONFIDENCE = 1;
  const MIN_CONFIDENCE = 0.1;
  if (hand.length !== 2) {
    throw new Error("Your hand must contain exactly 2 cards.");
  }
  if (tableCards.length < 3 || tableCards.length > 5) {
    throw new Error("Table must have between 3 and 5 cards.");
  }

  // Combine the player's hand and the community cards
  const allCards = [...hand, ...tableCards];

  // Generate all 5-card combinations from the 7 available cards
  const allCombinations = combinations(allCards, 5);

  // Evaluate all combinations and track the best possible hand
  let bestConfidence = MIN_CONFIDENCE;

  for (const combo of allCombinations) {
    const confidence = calculateHandStrength(combo);
    if (confidence > bestConfidence) {
      bestConfidence = confidence;
    }
  }

  return Math.max(MIN_CONFIDENCE, Math.min(MAX_CONFIDENCE, bestConfidence));
}

function checkStraight(values: string[]): boolean {
  const uniqueValues = [...new Set(values)];
  const indices = uniqueValues
    .map((v) => values.indexOf(v))
    .sort((a, b) => a - b);

  for (let i = 0; i < indices.length - 4; i++) {
    if (
      indices[i + 1] === indices[i] + 1 &&
      indices[i + 2] === indices[i] + 2 &&
      indices[i + 3] === indices[i] + 3 &&
      indices[i + 4] === indices[i] + 4
    ) {
      return true;
    }
  }

  // Special case: Ace can be low in a straight (A, 2, 3, 4, 5)
  if (
    uniqueValues.includes("A") &&
    uniqueValues.includes("2") &&
    uniqueValues.includes("3") &&
    uniqueValues.includes("4") &&
    uniqueValues.includes("5")
  ) {
    return true;
  }

  return false;
}

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  const withFirst = combinations(rest, k - 1).map((combo) => [first, ...combo]);
  const withoutFirst = combinations(rest, k);
  return withFirst.concat(withoutFirst);
}

function calculateHandStrength(cards: Card[]): number {
  const values = cards.map((card) => card.value);
  const suits = cards.map((card) => card.suit);
  const isFlush = new Set(suits).size === 1;
  const isStraight = checkStraight(values);

  if (isFlush && isStraight) {
    return 1; // Straight Flush or Royal Flush
  }
  if (isFlush) return 0.9;
  if (isStraight) return 0.8;

  const counts: Record<string, number> = values.reduce((acc, v) => {
    acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const countValues = Object.values(counts).sort((a, b) => b - a);
  if (countValues[0] === 4) return 0.85; // Four of a Kind
  if (countValues[0] === 3 && countValues[1] === 2) return 0.8; // Full House
  if (countValues[0] === 3) return 0.7; // Three of a Kind
  if (countValues[0] === 2 && countValues[1] === 2) return 0.65; // Two Pair
  if (countValues[0] === 2) return 0.5; // One Pair

  return 0.3; // High Card
}
