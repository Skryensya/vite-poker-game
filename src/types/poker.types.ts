// File: src/types/poker.types.ts

export type Card = {
  suit: string;
  value: string;
  key: string;
};

export type Denom = 10 | 50 | 100 | 500 | 1000;
export type ChipStack = Record<Denom, number>;

export type Player = {
  id: number;
  name: string;
  hand: Card[];
  chipStack: ChipStack;

  isFolded: boolean;
  isDealer?: boolean;
  isSmallBlind?: boolean;
  isBigBlind?: boolean;
};

export type BotBrain = {
  isBot: boolean;
  aiDifficulty: number;
  confidence: number;
  decisionMaker: (hand: Card[], tableCards: Card[]) => number;
};

export type BotPlayer = Player & BotBrain;

/**
 * Defines the overall state of the poker game at any given point.
 */

export enum RoundStage {
  PRE_FLOP = "PRE_FLOP",
  FLOP = "FLOP",
  TURN = "TURN",
  RIVER = "RIVER",
  SHOWDOWN = "SHOWDOWN",
}

export type Pot = {
  total: ChipStack;
  bets: Bet[];
  isActive: boolean;
};

export type Bet = {
  playerId: number;
  chipStack: ChipStack;
};

export type GameState = {
  deck: Card[]; // La baraja actual de cartas para ser sacadas
  players: (Player | BotPlayer)[]; // Todos los jugadores en el juego
  board: {
    flop: Card[];
    turn: Card[];
    river: Card[];
  }; // Las cartas comunitarias compartidas (flop + turn + river)
  burnCards: Card[]; // Cartas descartadas ("quemadas") antes de cada ronda de reparto
  pots: Pot[]; // La cantidad total de fichas en el pozo
  showdown: boolean; // Indica si hemos llegado al showdown
  dealerIndex: number; // Índice del dealer actual
  smallBlindIndex: number; // Índice del jugador que pone la ciega pequeña
  bigBlindIndex: number; // Índice del jugador que pone la ciega grande
  currentPlayerId: number; // ID del jugador que tiene el turno actual
  roundStage: RoundStage; // Nueva propiedad para rastrear la etapa actual de la ronda
  playersActedThisStage: number; // Nueva propiedad para rastrear la etapa actual de la ronda
  availableActions: string[]; // Nueva propiedad para rastrear la etapa actual de la ronda
};

export interface BoardState {
  flop: Card[];
  turn: Card[];
  river: Card[];
}
export interface GameTableProps {
  remainingDeckCards: Card[];
  burnedCards: Card[];
  board: BoardState; // Object with flop, turn, river
  pots: Pot[];
  showdown: boolean;
  //   onDealFlop: () => void;
  //   onDealTurn: () => void;
  //   onDealRiver: () => void;
  //   onShowdown: () => void;
}
